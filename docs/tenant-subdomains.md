## Dynamic subdomain tenancy (hospital1.myapp.com)

This backend supports multi-tenant resolution by **subdomain** (and optionally **custom domains**).

### How it works (runtime)

- NGINX routes all wildcard subdomains to the same backend (see `deploy/nginx/wildcard-subdomain.conf`)
- The backend reads the `Host` header and extracts the subdomain safely
- The tenant (hospital) is loaded from PostgreSQL and attached to the request:
  - `req.tenant` (new)
  - `req.hospitalContext` (existing alias, kept for compatibility)

The implementation lives in:
- `backend/src/middleware/hospitalContext.ts`

### Base domain + reserved subdomains

- Base domain is configured via `TENANT_BASE_DOMAIN` (defaults to `clinicos.com`)
- Reserved subdomains are blocked from being treated as tenants:
  - `www`, `api`, `admin`, `app`, `console`

### Localhost development

When running locally (`localhost`, `127.0.0.1`, `*.localhost`) the middleware cannot rely on subdomain DNS, so it supports:

- Header: `X-Hospital-Id: <uuid>`
- Query: `?hospitalId=<uuid>`

### PostgreSQL schema (tenants table)

In this codebase, the **tenant** is the `hospitals` table.

```sql
-- hospitals table (tenant)
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain VARCHAR(63) UNIQUE,
  customDomain TEXT UNIQUE,
  customDomainVerified BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  street TEXT,
  buildingNumber TEXT,
  city TEXT,
  state TEXT,
  postalCode TEXT,
  country TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  createdAt TIMESTAMPTZ NOT NULL,
  updatedAt TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS hospitals_subdomain_unique ON hospitals(subdomain);
CREATE UNIQUE INDEX IF NOT EXISTS hospitals_custom_domain_unique ON hospitals(customDomain);
```

### Example route handler using `req.tenant`

```ts
import { Router } from 'express';
import { extractHospitalFromDomain, requireHospitalContext } from '../middleware/hospitalContext';
import Department from '../models/Department';

const router = Router();

router.use(extractHospitalFromDomain);
router.use(requireHospitalContext);

router.get('/departments', async (req, res) => {
  // Prevent cross-tenant access by always scoping queries by tenant id.
  const tenantId = req.tenant!.id;
  const departments = await Department.findAll({ where: { hospitalId: tenantId } });
  res.json({ data: departments });
});

export default router;
```

### Preventing cross-tenant data access

**Rule:** every query must include `hospitalId = req.tenant.id` (or equivalent tenant column).

This codebase already follows that pattern for patient routes by reading `req.hospitalContext?.id`.

### Production concerns

- **Caching tenant lookup**: `backend/src/middleware/hospitalContext.ts` includes a small in-memory TTL cache.
  - For multi-instance deployments, consider Redis to share cache.
- **Host header safety**: we strip ports and lowercase the host before parsing.
- **Localhost**: requires `X-Hospital-Id` or `?hospitalId=` for tenant selection.
- **Reserved subdomains**: block `www`, `api`, `admin`, etc. to avoid conflicts and attacks.
- **Security**:
  - Keep `customDomainVerified = true` requirement for custom domains
  - Always scope queries by tenant id
  - Avoid exposing internal IDs in public endpoints unless necessary




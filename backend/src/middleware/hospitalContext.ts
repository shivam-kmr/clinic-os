import { Request, Response, NextFunction } from 'express';
import Hospital from '../models/Hospital';

/**
 * Tenant (hospital) resolution middleware.
 *
 * Goal:
 * - Requests like hospital1.myapp.com, demo.myapp.com route to same backend
 * - Tenant is resolved from subdomain and attached to request
 *
 * Notes:
 * - Base domain is configurable via TENANT_BASE_DOMAIN (defaults to "clinicos.com")
 * - Reserved subdomains (www, api, admin, etc.) are treated as "no tenant"
 * - Localhost/dev: supports X-Hospital-Id or ?hospitalId=... to select tenant
 *
 * Sets:
 * - req.hospitalContext (existing name, kept for compatibility)
 * - req.tenant (alias)
 * - req.tenantSubdomain (for debugging/logging)
 */
export const extractHospitalFromDomain = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const host = (req.get('host') || '').toLowerCase();
    const hostname = host.split(':')[0]; // Remove port if present

    const setTenant = (tenant: Hospital | null, tenantSubdomain?: string | null) => {
      req.hospitalContext = tenant;
      req.tenant = tenant;
      req.tenantSubdomain = tenantSubdomain || null;
    };

    // Tiny in-memory cache to avoid repetitive DB hits on hot endpoints.
    // Safe because hospitals change rarely, and stale reads are acceptable for public discovery.
    const CACHE_TTL_MS = 60_000;
    const cacheKey = `host:${hostname}`;
    const now = Date.now();
    const cached = tenantCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      setTenant(cached.tenant, cached.tenantSubdomain);
      return next();
    }

    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost');

    // For localhost development, allow selecting tenant explicitly.
    if (isLocalhost) {
      const hospitalId =
        (req.headers['x-hospital-id'] as string | undefined) ||
        (req.query.hospitalId as string | undefined);

      if (hospitalId) {
        const hospital = await Hospital.findByPk(hospitalId);
        if (hospital && hospital.status === 'ACTIVE') {
          setTenant(hospital, hospital.subdomain || null);
          tenantCache.set(cacheKey, {
            expiresAt: now + CACHE_TTL_MS,
            tenant: hospital,
            tenantSubdomain: hospital.subdomain || null,
          });
          return next();
        }
      }

      setTenant(null, null);
      tenantCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, tenant: null, tenantSubdomain: null });
      return next();
    }

    const baseDomain = (process.env.TENANT_BASE_DOMAIN || 'clinicos.com').toLowerCase();
    const reserved = new Set(['www', 'api', 'admin', 'app', 'console']);

    // If it's the base domain itself, no tenant context.
    if (hostname === baseDomain) {
      setTenant(null, null);
      tenantCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, tenant: null, tenantSubdomain: null });
      return next();
    }

    // Subdomain case: <tenant>.<baseDomain>
    let subdomain: string | null = null;
    if (hostname.endsWith(`.${baseDomain}`)) {
      const prefix = hostname.slice(0, -1 * (baseDomain.length + 1)); // remove ".<baseDomain>"
      // For hosts like "hospital1.myapp.com", prefix is "hospital1"
      // For "a.b.myapp.com", we take the left-most label ("a") to avoid ambiguity.
      subdomain = prefix.split('.')[0] || null;
      if (subdomain && reserved.has(subdomain)) subdomain = null;
    }

    if (subdomain) {
      const hospital = await Hospital.findOne({ where: { subdomain, status: 'ACTIVE' } });
      if (hospital) {
        setTenant(hospital, subdomain);
        tenantCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, tenant: hospital, tenantSubdomain: subdomain });
        return next();
      }
    }

    // Custom domain case: tenant uses their own verified domain.
    const hospital = await Hospital.findOne({
      where: {
        customDomain: hostname,
        customDomainVerified: true,
        status: 'ACTIVE',
      },
    });

    if (hospital) {
      setTenant(hospital, hospital.subdomain || null);
      tenantCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, tenant: hospital, tenantSubdomain: hospital.subdomain || null });
      return next();
    }

    // Tenant not found.
    setTenant(null, subdomain);
    tenantCache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, tenant: null, tenantSubdomain: subdomain });
    return next();
  } catch (error) {
    // On error, continue without hospital context
    req.hospitalContext = null;
    req.tenant = null;
    req.tenantSubdomain = null;
    return next();
  }
};

/**
 * Middleware to require hospital context (for patient portal routes)
 */
export const requireHospitalContext = (
  req: Request,
  res: Response,
  next: NextFunction
) : void => {
  if (!req.hospitalContext) {
    res.status(404).json({
      error: {
        code: 'TENANT_NOT_FOUND',
        message: 'Clinic not found for this domain',
      },
    });
    return;
  }

  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      hospitalContext?: Hospital | null;
      tenant?: Hospital | null;
      tenantSubdomain?: string | null;
    }
  }
}

type TenantCacheEntry = {
  expiresAt: number;
  tenant: Hospital | null;
  tenantSubdomain: string | null;
};

const tenantCache = new Map<string, TenantCacheEntry>();


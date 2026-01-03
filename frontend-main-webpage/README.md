## frontend-main-webpage (marketing site)

This app serves the public marketing pages for **useclinicos.com**:
- Home (hero)
- Pricing
- Testimonials
- Certifications
- Schedule demo

It intentionally does **not** include authenticated routes. If a legacy `token` is present in localStorage
(from when the app and marketing site shared an origin), we redirect to `https://app.useclinicos.com`.

### Dev
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Notes
- This app reuses the existing UI/pages from `../frontend/src` via Vite + TS path aliases.
- For SEO, you can add pre-render/SSG later (e.g. `vite-plugin-ssg`) once the route list is stable.



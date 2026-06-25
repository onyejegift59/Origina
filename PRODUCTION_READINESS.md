# Production Readiness Review: Origina

**Date:** June 25, 2026
**Scope:** Environment variables, deployment configuration, build settings, middleware, route protection, error boundaries, SEO, performance, GitHub hygiene

---

## Deployment Readiness Score: 6/10

The application is functionally complete but has several deployment blockers and production risks that must be addressed before going live.

---

## Blocker

### B1. Live Production Secrets in `.env.local`

**File:** `.env.local`
**Issue:** The `.env.local` file contains real, unexpired production credentials:
- `SUPABASE_SERVICE_ROLE_KEY` — full admin database access
- `DEEPSEEK_API_KEY` — `sk-ec747e4afebf411183c211ce89252acf`
- `UPSTASH_REDIS_REST_TOKEN` — Redis access
- `UPSTASH_REDIS_REST_URL` — infrastructure exposure

While `.env.local` is properly gitignored (`.gitignore` line 13), the file exists on disk. Any developer with filesystem access, or if the file is accidentally served, these secrets are compromised. **All four must be rotated before production deployment.**

**Fix:** Rotate all credentials immediately. Ensure production secrets are provided via Vercel environment variables (not a `.env.local` file).

### B2. No `robots.ts` or `robots.txt`

**File:** Missing (should be `src/app/robots.ts` or `public/robots.txt`)
**Issue:** No robots.txt exists. In production, search engines will crawl all routes by default. For an authenticated workspace application, this means:
- `/login`, `/signup` pages will be indexed (low risk)
- `/dashboard/*` URLs could be crawled (they'll get 401, but it creates noise)
- No instruction for crawlers about API routes
**Fix:** Add `src/app/robots.ts`:
```ts
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/settings/', '/projects/', '/artifacts/'],
    },
  };
}
```

### B3. No `sitemap.ts`

**File:** Missing (should be `src/app/sitemap.ts`)
**Issue:** No sitemap for SEO. The landing page should be discoverable.
**Fix:** Add a basic sitemap:
```ts
import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://origina.app', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 }];
}
```

### B4. No Custom `not-found.tsx`

**File:** Missing (should be `src/app/not-found.tsx`)
**Issue:** Next.js renders its default 404 page, which breaks the visual design language.
**Fix:** Add a custom 404 page matching the Origina Matte Olive aesthetic.

### B5. No Open Graph / Social Meta Tags

**File:** `src/app/layout.tsx:11-20`
**Issue:** The `metadata` export only has `title` and `description`. Missing Open Graph tags for social sharing: `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`.
**Fix:** Add Open Graph metadata to the root layout.

---

## Important

### I1. Missing `.env.example` Documentation for All Variables

**File:** `.env.example`
**Issue:** The example file has placeholder values but no documentation of what each variable is for, where to obtain it, or which are required vs optional. A new developer cannot set up the project from scratch without external documentation.
**Fix:** Add comments above each variable explaining its purpose and how to get it:
```env
# Supabase project URL (found in Supabase dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# Supabase anon/public key (safe for client-side use)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### I2. No Error Boundary

**Files:** All page components
**Issue:** No React error boundary exists anywhere. A runtime error in any component will crash the entire page with no recovery UI. For a workspace application, this means users lose their conversation/artifacts on any unexpected error.
**Fix:** Add a top-level error boundary (`src/app/error.tsx`) with a "Something went wrong" message and retry button.

### I3. No Global Loading State

**File:** Missing (`src/app/loading.tsx`)
**Issue:** No root loading.tsx exists. Page transitions may show empty or partially-rendered content.
**Fix:** Add `src/app/loading.tsx` with a simple skeleton or spinner matching the design system.

### I4. No `.env.production` Guidance

**Issue:** The `.gitignore` correctly excludes `.env.production.local`, but there is no documentation about how production environment variables should be configured. On Vercel, these are set via the dashboard or CLI, but there should be a canonical list.
**Fix:** Document in a README or add a `ENV_GUIDE.md` listing all required env vars for each environment.

### I5. Duplicate Auth Illustration File

**Files:** `public/images/origina-auth-illustration.png` and `public/image/origina-auth-illustration.png.png`
**Issue:** The same illustration exists in two locations, one with a double `.png.png` extension. This wastes ~500KB of build size and is confusing.
**Fix:** Remove the duplicate `public/image/origina-auth-illustration.png.png`.

### I6. Middleware Excludes API Routes from Session Refresh

**File:** `middleware.ts:9-11`
**Issue:** The middleware matcher explicitly excludes `/api` from session cookie refresh. While each API route handles auth independently, this means API-only users never get their session cookie refreshed by the middleware. The SDK's `getUser()` handles token refresh internally, but this is a subtle failure mode.
**Fix:** Consider the trade-off documented. For production, ensure monitoring is in place to detect 401 spikes from API routes.

### I7. No Performance Monitoring or Analytics

**Issue:** No analytics, error tracking (Sentry), or performance monitoring is configured. Production issues will be invisible unless users report them.
**Fix:** Add Sentry or similar error tracking before launch.

### I8. `next.config.ts` Lacks Production Optimizations

**File:** `next.config.ts`
**Issue:** The config is minimal. Missing:
- `images` configuration for remote images
- HTTP headers for security (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`)
- Redirects or rewrites (if needed)
**Fix:** Add security headers via `headers()` in next.config.ts.

### I9. No Content Security Policy (CSP)

**Issue:** No CSP headers are set. This leaves the application vulnerable to XSS attacks if user-generated content is ever rendered unsafely. Currently the app renders all content via React JSX (safe), but CSP is defense-in-depth.
**Fix:** Add CSP headers via `next.config.ts` or middleware.

### I10. Build Output Contains Supabase URL

**Issue:** The Supabase project URL is inlined into `.next/` build artifacts (verified in chunk files). While `.next/` is gitignored, if the build output is deployed as-is to a VPS or shared hosting, the Supabase URL and reference to `SUPABASE_SERVICE_ROLE_KEY` are exposed in readable JS bundles.
**Fix:** This is normal for Next.js (env vars are inlined at build time). Ensure the `.next/` directory is never committed or publicly served.

---

## Nice to Have

### N1. Metadata Title Should Be Dynamic Per Page

**File:** `src/app/layout.tsx:12`
**Issue:** The root layout has `title: 'Origina'` for all pages. Each page should have a unique title (e.g., "Sign In - Origina", "Dashboard - Origina").
**Fix:** Add per-page `metadata` exports using Next.js Metadata API.

### N2. No `manifest.json` for PWA

**Issue:** No Web App Manifest. Users cannot add Origina to their mobile home screen as a PWA.
**Fix:** Add `src/app/manifest.ts` with basic app metadata.

### N3. No `icon.ico` Favicon

**Files:** `public/icon.png` (PNG only)
**Issue:** Older browsers and some tools require `.ico` format favicon. Only a 64x64 PNG exists.
**Fix:** Add `public/favicon.ico`.

### N4. No `vercel.json` Configuration

**Issue:** If deploying to Vercel, a `vercel.json` can configure rewrites, headers, and region settings. The current setup relies on Vercel defaults.
**Fix:** Add `vercel.json` if custom configuration is needed for headers, regions, or cron jobs.

### N5. Console.Error Statements Should Use Structured Logging

**Files:** 21 `console.*` calls across the codebase
**Issue:** All error logging uses `console.error` with string interpolation. No structured JSON logs, no severity levels, no request correlation IDs.
**Fix:** Add a lightweight logging utility (`src/lib/logger.ts`) that wraps `console` with structured output and environment-aware filtering.

### N6. `.agent/` Directory Not Gitignored

**Issue:** The `.agent/` directory (used for AI agent configuration) is not in `.gitignore`. It references `SUPABASE_SERVICE_ROLE_KEY` in its rules.
**Fix:** Add `.agent/` to `.gitignore`.

---

## GitHub Hygiene

| Check | Status | Action Needed |
|-------|--------|---------------|
| `.env.local` ignored | ✅ Yes (`.gitignore` line 13) | Verify with `git check-ignore .env.local` |
| `.env*` ignored (except example) | ✅ Yes (lines 12-16) | OK |
| `.next/` ignored | ✅ Yes (line 19) | OK |
| `node_modules/` ignored | ✅ Yes (line 2) | OK |
| No API keys committed | ⚠️ See B1 above | Rotate all keys; verify no committed copies |
| No Supabase service role key committed | ⚠️ See B1 above | Check git history for accidental commits |
| No generated exports committed | ✅ `.next/` and `out/` gitignored | OK |
| `.agent/` directory gitignored | ❌ Not in `.gitignore` | Add `.agent/` |

---

## Summary

| Category | Count | Key Items |
|----------|-------|-----------|
| **Blockers** | 5 | Live secrets in `.env.local`, no robots.txt, no sitemap, no 404 page, no Open Graph tags |
| **Important** | 10 | Missing error boundary, no loading.tsx, analytics, security headers, CSP, env docs, duplicate asset |
| **Nice to Have** | 6 | Per-page titles, PWA manifest, `.ico` favicon, structured logging, `.agent/` gitignore |

**To reach 10/10:**
1. Rotate and secure all production secrets
2. Add `robots.ts`, `sitemap.ts`, `not-found.tsx`
3. Add Open Graph metadata to root layout
4. Add `error.tsx` and `loading.tsx`
5. Add security headers and CSP
6. Clean up duplicate illustration asset

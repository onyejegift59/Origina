# Security Audit Report: Origina

**Date:** June 25, 2026
**Scope:** Authentication, authorization, Supabase RLS, API routes, AI generation, exports, env vars, XSS, CSRF, rate limiting, data exposure

---

## 1. Critical Security Issues

### C1. Path Traversal in Export Storage Uploads

**Files:** `src/app/api/export/pdf/route.ts:81,87`, `docx/route.ts:143,149`, `pptx/route.ts:112,118`
**Risk:** The `fileName` is derived from `project.name` with only whitespace replacement (`.replace(/\s+/g, '-')`). Characters like `../` pass through unchanged. Used in Storage upload path: `${user.id}/${projectId}/${fileName}`. A project named `../..` would write outside the intended directory.
**Impact:** Attacker could overwrite or access files outside their project's Storage directory.
**Fix:** Sanitize `fileName` to alphanumeric + hyphens only: `.replace(/[^a-zA-Z0-9-]/g, '')`.

### C2. Sensitive Data Logging on Auth Failures

**Files:** `src/app/api/auth/login/route.ts:42`, `signup/route.ts:47`
**Risk:** User email and IP are logged via `console.warn` on every failed login/signup attempt.
**Impact:** PII (email, IP) in logs violates data protection regulations and creates a breach surface if logs are exposed.
**Fix:** Log only anonymized data (e.g., `email.substring(0, 3) + '***'`) or log the event without PII.

### C3. Auth Error Messages Forwarded to Client

**Files:** `src/app/api/auth/signup/route.ts:49`, `projects/route.ts:34`
**Risk:** Supabase auth error messages are returned directly to the client (e.g., "User already registered", "Unauthorized: {details}").
**Impact:** Information disclosure — attackers can enumerate registered emails, learn internal auth system details.
**Fix:** Return generic error messages (e.g., "Authentication failed") and log the real error server-side.

---

## 2. High-Risk Findings

### H1. Content-Disposition Header Injection (All Export Routes)

**Files:** `export/pdf/route.ts:100`, `docx/route.ts:163`, `markdown/route.ts:42`, `pptx/route.ts:131`
**Risk:** `fileName` derived from unsanitized `project.name` is used in `Content-Disposition: attachment; filename="${fileName}.{ext}"`. If `project.name` contains `"` or CRLF (`%0d%0a`), the HTTP response headers can be manipulated (HTTP response splitting).
**Impact:** Response header injection could enable cache poisoning, XSS in older browsers, or bypass security controls.
**Fix:** Sanitize `fileName` and validate it contains no quotes or control characters before use in headers.

### H2. IP-Based Rate Limiting Bypass

**File:** `src/app/api/auth/login/route.ts:25`
**Risk:** Rate limiting uses `x-forwarded-for` header which is trivially spoofed by attackers. When absent, falls back to string `'unknown'` — meaning all users without the header share one rate limit bucket.
**Impact:** Brute-force attacks bypass per-IP rate limits easily.
**Fix:** Use combined identifiers (IP + email hash) or rely on Supabase's built-in rate limiting instead of IP alone.

### H3. Rate Limiting Fails Open When Redis Unavailable

**File:** `src/lib/ratelimit.ts:25-30`
**Risk:** If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` env vars are missing, `checkRateLimit` returns `{ allowed: true }`. A console warning is printed in production, but rate limiting is silently disabled. Any Redis outage or misconfiguration leaves auth and AI endpoints completely unprotected.
**Impact:** Unauthenticated abuse of AI generation, brute-force login, and mass account creation.
**Fix:** In production, fail closed (deny requests) when Redis is unavailable. Add a health-check endpoint that verifies rate limiting is operational.

### H4. No Input Length Validation on Project Creation

**Files:** `src/app/api/projects/route.ts:55`, `projects/[projectId]/route.ts:53`
**Risk:** Project `name` and `idea` fields have no maximum length validation. An attacker could submit multi-megabyte values.
**Impact:** Storage bloat, AI API costs from processing enormous prompts, potential denial of service.
**Fix:** Add max-length validation (e.g., 500 chars for name, 10000 for idea) on both POST and PATCH.

---

## 3. Medium-Risk Findings

### M1. No `artifactType` Whitelist in Refine Route

**File:** `src/app/api/ai/refine/route.ts:31`
**Risk:** The `artifactType` field is not validated against the supported types list. Any arbitrary string passes through.
**Impact:** While the AI generator would fail for unsupported types, the string reaches `upsertArtifact` and could write malformed type data to the database.
**Fix:** Validate `artifactType` against `ARTIFACT_TYPES` before processing.

### M2. Missing `WITH CHECK` on UPDATE RLS Policies

**File:** `supabase/migrations/000_all_migrations.sql:17-19,49-51`
**Risk:** UPDATE policies on `profiles` and `projects` have a `USING` clause but no `WITH CHECK`. A user could theoretically change the `id` or `user_id` column on their own row.
**Impact:** Ownership transfer possible (mitigated by FK constraints to `auth.users`).
**Fix:** Add `WITH CHECK (auth.uid() = id)` to profile and `WITH CHECK (auth.uid() = user_id)` to project UPDATE policies.

### M3. Dynamic Imports in Export Handlers (Performance + Security)

**Files:** `export/pdf/route.ts:83`, `docx/route.ts:145`, `pptx/route.ts:114`
**Risk:** `await import('@/lib/supabase/server')` inside the request handler instead of a static top-level import.
**Impact:** Unnecessary latency on every export request. Also, dynamic imports can be exploited if an attacker can control the module specifier (not the case here, but poor practice).
**Fix:** Move to static `import` at top of file.

### M4. Unused `userId` Parameter in Queries

**File:** `src/lib/supabase/queries.ts:198`
**Risk:** `getUserExports` accepts a `userId` parameter but never uses it in the query. `getProjectArtifacts`, `getConversation`, `upsertArtifact`, `addConversationMessage`, and `createExportRecord` have no `userId` parameter at all — they rely entirely on RLS for access control.
**Impact:** If RLS were ever accidentally disabled, these functions would return any project's data without ownership checks.
**Fix:** Add `userId` filtering to all project-scoped queries as defense-in-depth.

### M5. Verbose Logging in Projects Route

**File:** `src/app/api/projects/route.ts:23,29-32,40,53,70,72,86-88,96`
**Risk:** Extensive `console.log`/`console.error` calls log user email, request details, and internal state at info level.
**Impact:** PII exposure in logs. Log noise makes real security events harder to detect.
**Fix:** Reduce to essential events only. Remove email logging. Use structured logging with appropriate levels.

---

## 4. Low-Risk Findings

### L1. No CSRF Tokens on Auth Endpoints

**Files:** `login/route.ts:6`, `signup/route.ts:7`
**Risk:** No CSRF tokens validated. However, both endpoints require `Content-Type: application/json` (triggers CORS preflight) and Supabase uses `SameSite=Lax` cookies.
**Impact:** Practically mitigated in modern browsers. Theoretical risk from first-party subdomain attacks.
**Fix:** Add Origin/Referer header validation as a lightweight CSRF defense.

### L2. TOCTOU Race Condition in Generate Route

**File:** `src/app/api/ai/generate/route.ts:142-160`
**Risk:** Check for existing artifact (`getArtifact`) then upsert (`upsertArtifact`) with version increment — non-atomic.
**Impact:** Duplicate artifact versions possible under concurrent requests (low probability, low impact).
**Fix:** Move version increment to a single SQL statement with `ON CONFLICT DO UPDATE SET version = project_outputs.version + 1`.

### L3. API Routes Excluded from Middleware Session Refresh

**File:** `middleware.ts:10`
**Risk:** The middleware matcher excludes `/api/*` from session cookie refresh. API routes handle auth independently via `getUser()`.
**Impact:** If a user only uses API calls (e.g., programmatic), session cookies aren't refreshed by the middleware. `getUser()` should handle this, but failure mode means silent 401 errors.
**Fix:** Consider adding a lightweight session refresh for API routes, or document this as a known trade-off.

### L4. No Env Var Validation in `server.ts` and Middleware

**Files:** `src/lib/supabase/server.ts:8-9`, `middleware.ts:7-8`
**Risk:** Uses TypeScript `!` non-null assertion instead of runtime validation. Missing env vars produce cryptic Supabase SDK errors instead of clear messages.
**Impact:** Debugging difficulty. No production impact if env vars are always set.
**Fix:** Add explicit null checks with descriptive error messages (as `client.ts` and `admin.ts` do).

### L5. `SECURITY DEFINER` Trigger Function

**File:** `supabase/migrations/000_all_migrations.sql:277`
**Risk:** `handle_new_user()` runs with `SECURITY DEFINER` (table owner privileges).
**Impact:** Low — function is tightly scoped (inserts id, email, created_at). Any future modifications must be carefully reviewed.
**Fix:** Document this as a known pattern. Review on any schema change.

---

## 5. Positive Security Findings

| Pattern | Details |
|---------|---------|
| **No XSS vectors** | Zero `dangerouslySetInnerHTML` usage. All AI content rendered via React auto-escaping JSX. No markdown-to-HTML pipeline. |
| **Server-only secrets** | `SUPABASE_SERVICE_ROLE_KEY`, `DEEPSEEK_API_KEY`, `UPSTASH_REDIS_*` are NOT prefixed with `NEXT_PUBLIC_` — never reach the client bundle. |
| **Consistent auth** | Every protected route calls `supabase.auth.getUser()` before processing. |
| **Ownership enforced** | All project queries filter by `user_id` in the database layer (defense-in-depth beyond RLS). |
| **All RLS policies scoped** | Every policy uses `auth.uid()`, `auth.role() = 'authenticated'`, or EXISTS subquery. No public access policies. |
| **All 5 tables have RLS** | No table is missing `ENABLE ROW LEVEL SECURITY`. |
| **Parameterized queries** | Zero raw SQL concatenation. Supabase query builder prevents SQL injection. |
| **Rate limiting applied** | Login (10/IP/hr), signup (5/IP/hr), AI generate (20/user/hr), assistant (10/user/hr). |
| **Mass assignment protection** | PATCH routes destructure only known fields before update queries. |
| **Generic error messages** | Most routes return sanitized messages ("Project not found", "Unauthorized") without internal details. |
| **No open redirects** | All redirects use hardcoded paths (`/dashboard`, `/login`). |
| **Supabase token management** | Auth tokens handled by `@supabase/ssr` library — no custom token storage. |

---

## 6. Recommended Fix Priority

| Priority | Fix | Issues Addressed |
|----------|-----|------------------|
| **IMMEDIATE** | Sanitize `fileName` in export routes to prevent path traversal | C1 |
| **IMMEDIATE** | Stop logging PII (email, IP) on auth failures | C2 |
| **IMMEDIATE** | Return generic auth error messages to client | C3 |
| **HIGH** | Sanitize `Content-Disposition` filename to prevent header injection | H1 |
| **HIGH** | Add input length limits to project name/idea | H4 |
| **HIGH** | Add rate limiting fail-closed behavior in production | H3 |
| **MEDIUM** | Add artifactType whitelist validation to refine route | M1 |
| **MEDIUM** | Add `WITH CHECK` to UPDATE RLS policies | M2 |
| **MEDIUM** | Fix dynamic imports in export handlers | M3 |
| **MEDIUM** | Add userId filtering to all query functions as defense-in-depth | M4 |
| **LOW** | Add Origin header check to auth endpoints | L1 |
| **LOW** | Add runtime env var validation to server.ts and middleware | L4 |

---

## 7. Verdict

**Security posture: 6/10**

The application has strong foundations (no XSS, proper RLS, server-only secrets, consistent auth) but has exploitable path traversal in export Storage uploads, PII leakage in logs, and an auth error information disclosure that enable email enumeration. The rate limiting fail-open behavior is concerning for production deployments. The most impactful issues are the three Critical findings — all are fixable with straightforward sanitization and logging changes.

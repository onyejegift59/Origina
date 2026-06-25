# Engineering Audit: Origina

**Date:** June 25, 2026
**Scope:** Full-stack architecture, frontend, backend, AI system, CSS/accessibility

---

## 1. Critical Issues

### 1.1 Database Schema Mismatch — 5-Value ENUM vs 15-Type Union

**Location:** `supabase/migrations/000_all_migrations.sql:73-79` vs `src/types/index.ts:11-26`
**Issue:** The PostgreSQL `artifact_type` ENUM only contains 5 values. The TypeScript `ArtifactType` union has 15. Inserting any of the 10 missing types (positioning_statement, brand_strategy, etc.) causes a PostgreSQL crash.
**Impact:** Half the artifact system is non-functional. Any generation of the 10 missing types will fail silently at the database layer — the `catch` block swallows the error.
**Fix:** ALTER TYPE to add all 10 missing values, or change the column to TEXT with a CHECK constraint.
**Priority:** **Critical** — data loss for 10/15 artifact types.

### 1.2 Zero Runtime JSON Validation

**Location:** `src/lib/ai/prompts.ts:28`, all route handlers
**Issue:** `JSON.parse(result) as T` checks only syntax. No validation that the parsed object matches the expected schema. If the AI returns `{"score": "high"}` instead of `{"score": 42}`, corrupted data flows to the database and UI.
**Impact:** Silent data corruption. No warning. No error. The `as T` cast is a TypeScript lie.
**Fix:** Add Zod (already a transitive dependency) to validate AI outputs against schemas before accepting.
**Priority:** **Critical**

### 1.3 Pervasive `as any` / `as unknown as T` Casts

**Location:** ~40+ occurrences across all generator files, route handlers, and the assistant stream
**Issue:** The codebase uses `as unknown as Record<string, unknown>` and `as any` to bypass the type system. This means the compiler cannot catch type errors anywhere in the artifact pipeline.
**Impact:** Zero type safety for the core data flow. Any API change that breaks types is invisible until runtime.
**Fix:** Type the `generateJson` return properly. Use Zod inference to derive types from schemas.
**Priority:** **Critical**

### 1.4 Catastrophic Error Swallowing

**Location:** `src/app/api/ai/generate/route.ts:154`, `assistant-stream/route.ts:162`, `ChatWorkspace.tsx:167-169,185-187,211-212`, and 5+ more catch blocks
**Issue:** Exception variables are omitted (`catch {`). The actual error, stack trace, and root cause are lost forever. Production debugging is guesswork.
**Impact:** Impossible to debug AI failures in production. Users see generic "Unable to generate" messages with no actionable information.
**Fix:** Always log the error. Include error details in the response envelope for debugging.
**Priority:** **Critical**

### 1.5 Plaintext Secrets in `.env.local`

**Location:** `.env.local` (possibly tracked in version control)
**Issue:** Real production DeepSeek API key, Supabase service role key, Supabase anon key, and Upstash Redis credentials are stored in plaintext. If `.env.local` is committed or leaked, all services are compromised.
**Impact:** Complete account takeover of AI, database, and caching infrastructure.
**Fix:** Verify `.env.local` is in `.gitignore`. Rotate all exposed keys immediately. Use a secrets manager for production.
**Priority:** **Critical** — security incident

### 1.6 No Rate Limiting on Auth Endpoints

**Location:** `src/app/api/auth/login/route.ts`, `src/app/api/auth/signup/route.ts`
**Issue:** Login and signup have no rate limiting. Brute-force attacks and mass account creation are unthrottled.
**Impact:** Credential stuffing, brute-force password attacks, and account enumeration are trivially automated.
**Fix:** Add `checkRateLimit` calls to both auth routes.
**Priority:** **Critical** — security vulnerability

---

## 2. High Priority Improvements

### 2.1 `ArtifactRenderers.tsx` is Severely Bloated (1123 lines)

**Location:** `src/components/chat/ArtifactRenderers.tsx`
**Issue:** A single monolithic file containing render, preview, and preview-line functions for all 15 artifact types. Adding a new artifact type requires editing this file.
**Impact:** Maintainability bottleneck. High risk of merge conflicts. Difficult to test.
**Fix:** Split into `renderers/` directory with one file per artifact type + barrel export for registry.
**Impact estimate:** Low effort (1-2 hours), high improvement.

### 2.2 `ChatWorkspace.tsx` is Monolithic (359 lines)

**Location:** `src/components/chat/ChatWorkspace.tsx`
**Issue:** Manages streaming logic, API calls, state for messages/artifacts/errors, skeleton loading, empty state, error state, artifact grid, export, regenerate, refine — all in one component.
**Impact:** Hard to test, hard to reason about, re-renders cascade.
**Fix:** Extract streaming logic into `useConversation(projectId)` hook. Extract artifact operations into `useArtifacts(projectId)` hook.
**Impact estimate:** Medium effort (2-3 hours), high improvement.

### 2.3 5 Redundant Single-Artifact API Routes

**Location:** `src/app/api/ai/startup-analysis/route.ts`, `personas/route.ts`, `mvp-scope/route.ts`, `roadmap/route.ts`, `health-score/route.ts`
**Issue:** Five nearly-identical route files that are entirely redundant with the consolidated `generate/route.ts`. ~60% code duplication.
**Impact:** 4x maintenance cost. Each new artifact type previously required a new route file.
**Fix:** Remove the 5 individual routes. Route consolidation in `generate/route.ts` already covers all types.
**Impact estimate:** Low effort (30 min), no risk.

### 2.4 `generateArtifactForProject` Duplicates Generator Dispatch

**Location:** `src/app/api/ai/assistant-stream/route.ts:64-165`
**Issue:** The assistant stream's `generateArtifactForProject` function duplicates the entire generator dispatch logic that already exists in `generate/route.ts:23-95`. Adding a new artifact type requires editing two locations.
**Fix:** Reuse `generate/route.ts`'s generator map or extract it into a shared module (`@/lib/ai/generatorMap.ts`).
**Impact estimate:** Medium effort (1-2 hours), moderate improvement.

### 2.5 No Ownership Checks on Artifact/Conversation Queries

**Location:** `src/lib/supabase/queries.ts:126-135` (`getProjectArtifacts`), `:164-175` (`getConversation`)
**Issue:** These functions filter only by `project_id`, not by user ownership. They rely on callers having already verified ownership via `getProject`, creating a TOCTOU race condition.
**Impact:** If a project is deleted between the ownership check and data fetch, queries silently return empty results or stale data.
**Fix:** Join with projects table to verify user_id, or accept userId parameter and filter.
**Impact estimate:** Low effort (30 min), security improvement.

### 2.6 Keyboard Accessibility Gaps

**Location:** `ArtifactCard.tsx:238-262` (modal lacks focus trap), `ArtifactCard.tsx:166-198` (export dropdown no Escape key), `ArtifactChips.tsx:88-99` (More dropdown no arrow navigation)
**Issue:** Three interactive popups/dropdowns lack keyboard interaction patterns required by WCAG 2.2.
**Impact:** Keyboard-only users cannot use core artifact features (open modal, export, artifact selection).
**Fix:** Add focus trapping to modal. Add Escape handlers to all popups. Add arrow key navigation to dropdowns.
**Impact estimate:** Medium effort (2-3 hours).

### 2.7 Touch Target Violations (WCAG 2.5.8)

**Location:** `ArtifactCard.tsx:85-116` (13px icon toolbar buttons), `ArtifactCard.tsx:147-210` (11px footer icons), `ArtifactCard.tsx:176-197` (23px tall export items)
**Issue:** Artifact card toolbar buttons, footer actions, and export dropdown items have touch targets well below the 44x44px minimum.
**Impact:** Fails WCAG 2.2 AA. Users with motor disabilities cannot reliably interact with artifact cards.
**Fix:** Enforce `min-width: 44px` and `min-height: 44px` on all icon buttons. Build a reusable `IconButton` component.
**Impact estimate:** Medium effort (1-2 hours), accessibility compliance.

### 2.8 Duplicate Utility Code (DRY Violation)

**Location:** `formatContentForCopy` in `ArtifactCard.tsx:13-35` and `formatContent` in `ArtifactsHub.tsx:28-51`; export/download logic duplicated in both files
**Issue:** Content formatting and export download logic is duplicated 2-3 times across components.
**Impact:** 2x-3x maintenance cost. Bug fixes must be applied in multiple locations.
**Fix:** Extract `src/lib/format.ts` and `src/lib/export.ts` with shared utilities.
**Impact estimate:** Low effort (30 min).

### 2.9 No Pagination on List Endpoints

**Location:** `src/lib/supabase/queries.ts:103-124` (getAllUserArtifacts), `:164-175` (getConversation), `:85-100` (getProjects)
**Issue:** All list queries return unbounded results. No limit/offset. Users with many projects, artifacts, or long conversations fetch everything.
**Impact:** Performance degrades linearly with data growth. Large payloads cause slow page loads.
**Fix:** Add `.limit(50)` and `.order()` to all list queries. Add cursor or offset-based pagination to API routes.
**Impact estimate:** Medium effort (1-2 hours).

### 2.10 Missing `React.memo` on `ChatMessage`

**Location:** `src/components/chat/ChatMessage.tsx` (entire file)
**Issue:** Each streaming chunk calls `setStreamingContent`, which re-renders `ChatWorkspace`, which re-renders ALL `ChatMessage` components — including every prior message in the conversation.
**Impact:** Unnecessary re-renders on every token of streaming output. Performance degrades with conversation length.
**Fix:** Wrap `ChatMessage` in `React.memo`. Memoize callback props passed to it.
**Impact estimate:** Low effort (30 min), significant performance improvement for long conversations.

---

## 3. Medium Priority Improvements

### 3.1 `prefers-reduced-motion` Gaps

**Location:** 27+ CSS modules with transitions/animations, only `settings.module.css` implements reduced-motion fallback
**Issue:** Users who prefer reduced motion are not respected. Animations (skeleton shimmer, transitions, spin) run at full speed.
**Fix:** Add global `@media (prefers-reduced-motion: reduce)` block in `globals.css`.
**Impact estimate:** Low effort (15 min).

### 3.2 No CSS Shadow Tokens

**Location:** All CSS files — 15+ hardcoded `box-shadow` values
**Issue:** Shadow values hardcoded with raw rgba(). No design token system for elevation.
**Fix:** Add `--shadow-sm`, `--shadow-md`, `--shadow-lg` to `tokens.css`.
**Impact estimate:** Low effort (20 min).

### 3.3 No Systematic Z-Index Scale

**Location:** All CSS files — values from 1 to 300 with no documented system
**Issue:** Risk of overlap conflicts between modals (200), sidebar (30), tooltips (100), and settings header (300).
**Fix:** Add z-index tokens to `tokens.css` (`--z-dropdown`, `--z-sidebar`, `--z-overlay`, `--z-modal`, `--z-tooltip`).
**Impact estimate:** Low effort (15 min).

### 3.4 `upsertArtifact` Does Two Database Queries

**Location:** `src/lib/supabase/queries.ts:137-162`
**Issue:** First reads current version via `getArtifact`, then upserts with `version + 1`. Two round-trips for every save.
**Fix:** Use `ON CONFLICT DO UPDATE SET version = project_outputs.version + 1` in a single query.
**Impact estimate:** Low effort (15 min), performance improvement.

### 3.5 No Retry Logic for AI Provider Calls

**Location:** `src/lib/ai/retry.ts` — `MAX_RETRIES = 1` (1 retry, 2 total attempts)
**Issue:** Only 1 retry with total ~3 seconds of delay. Does not distinguish retryable (5xx) from non-retryable (4xx) errors. No jitter in backoff.
**Impact:** Transient AI API failures (rate limits, 503s) often fail permanently when a second attempt would succeed.
**Fix:** Increase MAX_RETRIES to 3. Add error-type discrimination. Add jitter.
**Impact estimate:** Low effort (30 min).

### 3.6 Rate Limiting Silently Fails Open

**Location:** `src/lib/ratelimit.ts:25-27`
**Issue:** If Redis is unavailable (missing env vars), rate limiting returns `{ allowed: true }` with no warning. System operates unprotected.
**Impact:** Misconfigured deployments have no rate limiting with no visible alert.
**Fix:** Add warning log. Consider in-memory fallback for development.
**Impact estimate:** Low effort (15 min).

### 3.7 No Logging on Most API Routes

**Location:** All API routes except `POST /api/projects`
**Issue:** Zero logging on AI generation routes, auth routes, artifact routes. AI errors are caught but never logged.
**Impact:** Production debugging impossible. Security incidents invisible.
**Fix:** Add structured logging (request ID, user ID, route, status, duration) to all route handlers. Consider Sentry integration.
**Impact estimate:** Medium effort (2-3 hours).

### 3.8 Admin (Service Role) Client Used in API Routes

**Location:** `src/app/api/auth/signup/route.ts:44`, `src/app/api/projects/route.ts:64`, `src/app/auth/callback/route.ts:14`
**Issue:** The service role key bypasses RLS. Any bug in these routes grants full database write access.
**Impact:** Elevated security risk. Profile upserts could be done with anon key + proper RLS policies.
**Fix:** Use anon-key client with RLS for profile creation. Only use admin client for server-to-server operations.
**Impact estimate:** Medium effort (1-2 hours) — requires RLS policy verification.

### 3.9 Artifact Card Modal Lacks Focus Trap

**Location:** `ArtifactCard.tsx:238-262`
**Issue:** When the modal is open, pressing Tab can move focus behind the overlay. No Escape key handler.
**Impact:** Keyboard users can lose focus context. WCAG 2.1.2 (No Keyboard Trap) and 2.4.3 (Focus Order) violation.
**Fix:** Add focus trapping with `useEffect` ref management. Add Escape handler.
**Impact estimate:** Medium effort (1 hour).

### 3.10 No `@media print` Styles

**Location:** None in the entire codebase
**Issue:** Sidebar, dark mode colors, hero overlays, and chat bubbles will print with full styling, wasting ink and potentially being illegible.
**Impact:** Users cannot print artifacts or reports cleanly.
**Fix:** Add basic `@media print` styles to hide sidebar, remove backgrounds, use black text.
**Impact estimate:** Low effort (30 min).

### 3.11 Missing `useCallback` on ChatWorkspace Handlers

**Location:** `ChatWorkspace.tsx:72-231` (handleSend, handleGenerateArtifact, handleRefine, handleExport, handleRetry)
**Issue:** All handlers recreated on every render. Combined with missing React.memo on children, causes unnecessary re-renders.
**Fix:** Wrap all handlers in `useCallback`. Wrap child components in `React.memo`.
**Impact estimate:** Low effort (30 min).

---

## 4. Low Priority Improvements

### 4.1 15 Nearly-Identical Generators

**Location:** All files in `src/lib/ai/generators/*.ts`
**Issue:** Each generator follows an identical structure with different prompt templates. 15 files with ~95% structural duplication. Adding a field to all generators requires editing 15 files.
**Fix:** Create a factory function or code generation script. Generators could be data-driven: `createGenerator(type, promptTemplate, schema)`.
**Impact estimate:** Medium effort (2-3 hours), quality improvement.

### 4.2 Provider Hardcoded at Import Time

**Location:** `src/lib/ai/provider.ts:3`
**Issue:** `export const aiProvider = deepseekAdapter` — no runtime switching. To swap to OpenAI, you edit source code.
**Fix:** Read `AI_PROVIDER` env var and switch adapters at init.
**Impact estimate:** Low effort (30 min).

### 4.3 Hardcoded Font Sizes (9px, 10px, 11px) Below Label Threshold

**Location:** `ArtifactCard.module.css:161,231,239,256`, `ArtifactsHub.module.css:36,241,259`
**Issue:** Several UI elements use 9px-11px font sizes. The smallest design token is `--label-small-font-size: 12px`. These hardcoded values are below WCAG-recommended minimums for readability.
**Fix:** Increase to `--label-small-font-size` (12px) or add a smaller token intentionally.
**Impact estimate:** Low effort (30 min), accessibility improvement.

### 4.4 Global `sidebar:toggle` CustomEvent Pattern

**Location:** `Sidebar.tsx`, `ChatWorkspace.tsx:241`, `artifacts/page.tsx:44`
**Issue:** Uses `window.dispatchEvent(new CustomEvent('sidebar:toggle'))` + `window.addEventListener` for sidebar state. Fragile, not React-idiomatic.
**Fix:** Replace with React Context for sidebar state.
**Impact estimate:** Medium effort (1-2 hours), architectural improvement.

### 4.5 `outline: none` Without `:focus-visible` Override

**Location:** `ChatMessage.module.css`, `dashboard.module.css`, `settings.module.css`, `projects.module.css`
**Issue:** Several elements set `outline: none` without a corresponding `:focus-visible` rule. The global `:focus-visible` in `globals.css` may not apply correctly.
**Fix:** Each `outline: none` should be paired with an explicit `:focus-visible` style.
**Impact estimate:** Low effort (20 min).

### 4.6 Skeleton Loading Without `role="list"` Wrapper

**Location:** `ChatWorkspace.tsx:250-271`
**Issue:** Skeleton items use `role="listitem"` but the parent container has no `role="list"`, creating orphaned list items.
**Fix:** Wrap skeleton in same `role="list"` structure as real messages.
**Impact estimate:** Low effort (5 min).

### 4.7 `min-height: 100vh` on Mobile Safari

**Location:** `globals.css:22`, several module files
**Issue:** `100vh` on mobile Safari includes the address bar height, causing content below the fold. Several modules correctly use `100dvh`.
**Fix:** Change `100vh` to `100dvh` globally.
**Impact estimate:** Low effort (5 min).

### 4.8 Login Page Checking Session Returns Empty Div

**Location:** `src/app/login/page.tsx:62-64`
**Issue:** While checking session, returns `<div className={styles.page} />` with no visible content or accessible label. Screen reader users get silence.
**Fix:** Add `aria-busy="true"` and a screen-reader-only "Checking session..." text.
**Impact estimate:** Low effort (10 min).

---

## 5. Technical Debt

| Debt | Location | Age/Cause | Effort to Fix |
|------|----------|-----------|---------------|
| `!important` flags in CSS | `ChatMessage.module.css:61,114` | Specificity workaround | 15 min |
| Inline styles for export popover | `ArtifactCard.tsx:192-210` | Quick implementation | 30 min |
| String .replace() instead of template engine | All 15 generators | Simple approach | 1 hour (centralize) |
| No zod/yup (available as transitive dep) | Entire codebase | Never added | 2 hours |
| `page.tsx` hero overlay hardcoded colors | `page.module.css:57-63` | Design decision | 30 min |
| 5 redundant API routes | `src/app/api/ai/*.ts` | Never cleaned up | 30 min |
| Shimmer animation infinite on skeletons | All skeleton files | Default pattern | 15 min (add reduced-motion) |
| No error boundary at route level | All API routes | Never added | 30 min per route |
| `max-width: 768px` breakpoint inconsistency | `page.module.css` vs others | Different devs | 30 min to harmonize |

---

## 6. Security Risks

| Risk | File | Severity | Mitigation |
|------|------|----------|------------|
| Plaintext API keys in `.env.local` | `.env.local` | **Critical** | Rotate keys, verify gitignore |
| No rate limiting on auth | `login/route.ts`, `signup/route.ts` | **Critical** | Add rate limiting |
| Admin client bypasses RLS | `admin.ts` + 3 API routes | **High** | Use anon key + RLS for profile ops |
| No CSRF protection | All POST routes | **Medium** | Add origin/referer check (low risk with API routes) |
| No input size limits | All POST routes | **Medium** | Add max length validation on all string fields |
| Rate limiting fails open | `ratelimit.ts:25-27` | **Medium** | Log warning, add in-memory fallback |
| Entire project context sent to AI provider | `assistant-stream/route.ts:213-224` | **Medium** | Provider may log prompts; document risk |
| No pagination on data exports | All list queries | **Low** | Add limit/offset |
| SSE stream could be CSRF'd | `assistant-stream/route.ts` | **Low** | Check Origin header |

---

## 7. Accessibility Issues (WCAG 2.2 AA)

| Criterion | Issue | Location | Severity |
|-----------|-------|----------|----------|
| 2.4.3 Focus Order | Modal lacks focus trap | `ArtifactCard.tsx:238-262` | **High** |
| 2.1.2 No Keyboard Trap | Export/More dropdowns not keyboard accessible | `ArtifactCard.tsx:166-198`, `ArtifactChips.tsx:88-99` | **High** |
| 2.5.8 Target Size | Icon buttons 11-13px, well below 44px | `ArtifactCard.tsx:85-116,147-210` | **High** |
| 1.4.1 Use of Color | Copy buttons only visible on hover | `ChatMessage.module.css:56-58` | **High** |
| 2.4.7 Focus Visible | Elements with `outline: none` missing `:focus-visible` | Multiple CSS files | **Medium** |
| 1.4.4 Resize Text | 9px-11px hardcoded font sizes | `ArtifactCard.module.css`, `ArtifactsHub.module.css` | **Medium** |
| 1.4.12 Text Spacing | No override support | All CSS (implicit risk) | **Medium** |
| 4.1.2 Name, Role, Value | Export dropdown first button not labeled | `ArtifactCard.tsx:176-197` | **Medium** |
| 2.4.4 Link Purpose | Skeleton items orphaned `role="listitem"` | `ChatWorkspace.tsx:250-271` | **Low** |
| 2.2.2 Pause, Stop, Hide | No reduced-motion support for animations | All animation CSS | **Medium** |

---

## 8. Performance Concerns

| Concern | Location | Impact |
|---------|----------|--------|
| All messages re-render on each streaming token | `ChatMessage.tsx` missing `React.memo` | **High** — degrades with conversation length |
| No selective fetching on project GET | `[projectId]/route.ts:28-29` fetches all artifacts + all messages | **Medium** — waste on every page load |
| No pagination on list queries | `queries.ts:85-124,164-175` | **Medium** — unbounded memory/bandwidth |
| `upsertArtifact` does 2 queries | `queries.ts:137-162` | **Medium** — 2x DB load on every save |
| No HTTP caching on API responses | All API routes | **Medium** — repeated identical requests hit DB |
| Streaming accumulates full response in memory | `assistant-stream/route.ts:260` | **Low** — memory grows with conversation |
| Skeleton shimmer animation runs indefinitely | All skeleton components | **Low** — wasted GPU cycles |
| Hero image CLS risk on landing page | `page.tsx` | **Low** — 75vh + min-height 720px fallback |

---

## 9. Architecture Recommendations

### 9.1 Immediate (0-2 weeks)

1. **Rotate compromised API keys** — All services should issue new keys immediately.
2. **Fix database ENUM** — Add 10 missing artifact types to the PostgreSQL enum.
3. **Add Zod validation** — Install zod. Validate all AI outputs against schemas. Derive TypeScript types from schemas.
4. **Remove redundant API routes** — Delete the 5 individual single-artifact routes. The consolidated `generate/route.ts` covers all types.
5. **Add rate limiting to auth routes** — Login and signup must be throttled.

### 9.2 Short-term (2-4 weeks)

6. **Split `ArtifactRenderers.tsx`** — One file per artifact type in a `renderers/` directory.
7. **Extract `useConversation` hook** — Move streaming logic out of `ChatWorkspace.tsx`.
8. **Add focus trapping to modals** — Use `@react-aria/focus` or custom `useFocusTrap`.
9. **Enforce 44px touch targets** — Build `IconButton` component. Audit all icon buttons.
10. **Add error logging** — At minimum, log caught exceptions before swallowing.
11. **Add keyboard navigation** — Escape to close all popups. Arrow keys for dropdowns.

### 9.3 Medium-term (1-2 months)

12. **Consolidate generator dispatch** — Extract `generatorMap` from `generate/route.ts` into shared module. Remove duplicate switch in `assistant-stream/route.ts`.
13. **Add retry logic** — Increase MAX_RETRIES to 3. Add error discrimination. Add jitter.
14. **Add pagination** — Limit/offset on all list queries. Cursor-based for conversations.
15. **Add `prefers-reduced-motion`** — Global block in `globals.css`.
16. **Replace CustomEvent pattern** — React Context for sidebar state.

### 9.4 Long-term (2-4 months)

17. **Generator factory pattern** — Replace 15 identical generator files with data-driven factory.
18. **Provider switching** — Env-var-based AI provider selection.
19. **Admin client audit** — Remove service role key usage from API routes. Use RLS with anon key.
20. **Add print styles** — Basic `@media print` for artifact readability.
21. **Harmonize breakpoints** — Single source of truth for responsive breakpoints.

---

## Summary

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| **Issues** | 6 | 14 | 11 | 8 |
| **Security Risks** | 2 | 1 | 4 | 2 |
| **Accessibility Issues** | 0 | 3 | 5 | 2 |
| **Performance Concerns** | 0 | 1 | 4 | 2 |
| **Technical Debt** | 0 | 0 | 5 | 5 |

The most urgent actions are: rotating exposed API keys, fixing the database ENUM mismatch, adding Zod validation for AI outputs, rate-limiting auth endpoints, and adding error logging throughout the backend.

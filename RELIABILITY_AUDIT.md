# Data Integrity & Reliability Audit: Origina

**Date:** June 25, 2026
**Scope:** Database schema, foreign keys, cascading deletes, artifact persistence, conversation persistence, export records, project lifecycle, AI generation workflows, caching, failure recovery

---

## 1. Critical Data Risks

### C1. `upsertArtifact` Race Condition — Silent Data Loss

**Files:** `src/lib/supabase/queries.ts:140-165`
**Issue:** The version increment is computed client-side via read-then-write (READ version at line 147, COMPUTE at line 148, WRITE at line 150). Two concurrent requests can both read version N, compute N+1, and the second write silently overwrites the first. The version number becomes incorrect and the first request's changes are permanently lost.
**Impact:** On concurrent artifact regeneration, one generation's output is silently discarded. The user sees no error.
**Fix:** Use an atomic SQL operation: `ON CONFLICT DO UPDATE SET version = project_outputs.version + 1, content = $1`.

### C2. No Validation on Refine Output — Can Corrupt Artifacts

**Files:** `src/lib/ai/generators/refine.ts:24`, `src/lib/ai/prompts.ts:35-52`
**Issue:** `refineArtifact` calls `generateJson` with no schema and no `artifactType`. The AI's raw JSON output is saved directly to the database with zero structural validation. If the AI returns structurally invalid data during refinement, it corrupts the artifact permanently.
**Impact:** A bad refine operation can replace valid artifact data with garbage. No recovery (no version history).
**Fix:** Pass the appropriate schema to `generateJson` in the refine flow.

### C3. No Timeout on AI API Calls — Indefinite Hangs

**Files:** `src/lib/ai/adapters/deepseek.ts:10,42`
**Issue:** All `fetch()` calls to DeepSeek lack `AbortController` or timeout configuration. If the AI provider hangs (network issue, provider overload), the request hangs indefinitely until the hosting platform kills it (e.g., Vercel's 10s/60s limits).
**Impact:** Every AI feature (generate, refine, assistant stream) can hang without recovery. The retry mechanism can never fire because the promise never settles.
**Fix:** Add `AbortSignal.timeout(30000)` to all fetch calls.

### C4. Assistant Messages Silently Lost on Stream Completion Save Failure

**Files:** `src/app/api/ai/assistant-stream/route.ts:269-273`
**Issue:** The `flush()` callback saves the assistant message to the database but does not `await` the promise and has no error handling. If `addConversationMessage` fails (DB error, network blip), the user has already seen the full AI response in the UI, but on page refresh it disappears permanently.
**Impact:** Users believe the conversation is saved, but messages can vanish silently.
**Fix:** Await the promise and log/handle failures.

### C5. Partial Streaming Content Lost on Disconnect — Orphaned User Messages

**Files:** `src/app/api/ai/assistant-stream/route.ts:204,271-275`, `src/hooks/useConversation.ts:124`
**Issue:** When a client disconnects mid-stream, the user message was already saved (line 206) but `flush()` never fires (the stream was aborted). This creates an orphaned user message in the conversation with no matching assistant response. `handleRetry` only re-fetches conversation data — it does not resend the message.
**Impact:** Users who disconnect mid-response or click "Stop" see a user message with no reply on refresh. No way to recover the partial response.
**Fix:** Save partial responses on abort. Add a resend mechanism.

### C6. Storage Upload Failure Returns 200 Success

**Files:** `src/app/api/export/pdf/route.ts:86-103`, `docx/route.ts:147-164`, `pptx/route.ts:116-133`
**Issue:** All three binary export routes unconditionally return HTTP 200 with the file buffer at the end. If the storage upload fails (checked at line 93/154/123 but not enforced), the response is still 200. The user downloads the file but it was never persisted to storage and no export record was created.
**Impact:** Users believe exports are persisted (they appear to succeed), but the export history is empty, and the storage file doesn't exist.
**Fix:** Return an error response if the storage upload fails.

---

## 2. Consistency Issues

### 2.1 `EXPORT_FORMATS` Constant vs DB Enum Mismatch

**Files:** `src/constants/index.ts:29` vs `supabase/migrations/000_all_migrations.sql:195`
**Issue:** `EXPORT_FORMATS` uses `'markdown'` but the DB enum and TypeScript type both use `'md'`. Currently no runtime error because the markdown route doesn't call `createExportRecord`, but any future addition of storage persistence to the markdown export will crash with a Postgres enum violation.
**Impact:` Low now, high if markdown exports ever get storage/record persistence.
**Fix:` Change `'markdown'` to `'md'` in `EXPORT_FORMATS`.

### 2.2 `deleteProject` Returns True When No Rows Deleted

**Files:** `src/lib/supabase/queries.ts:76-85`
**Issue:** The `.delete()` call without `.select()` returns `{ error: null }` even when no matching row exists. Callers cannot distinguish between "deleted successfully" and "not found/not owned".
**Impact:** Callers think deletion succeeded when it didn't. The user sees success but the project still exists.
**Fix:** Use `.select()` after delete or check the return count.

### 2.3 Markdown Export Creates No Storage Record

**Files:** `src/app/api/export/markdown/route.ts:42-51`
**Issue:** Unlike PDF, DOCX, and PPTX exports, the markdown route generates the file in-memory and returns it directly with no storage upload and no `createExportRecord` call. This means markdown exports are never tracked in the database.
**Impact:** Users cannot view markdown export history. The export is fire-and-forget.
**Fix:` Add storage persistence consistent with other export routes.

### 2.4 `getUserExports` Accepts Unused `userId` Parameter

**Files:** `src/lib/supabase/queries.ts:197-209`
**Issue:** The `userId` parameter is declared but never used in the query. Only `project_id` is filtered. RLS is the sole access control.
**Impact:** If RLS were accidentally disabled, this function would return any project's exports.
**Fix:** Remove the unused parameter or actually filter by it.

---

## 3. Reliability Risks

### 3.1 Retry Mechanism Too Weak

**Files:** `src/lib/ai/retry.ts:1-23`
**Issue:** Only 1 retry (2 total attempts). No jitter (thundering herd on retry). No error discrimination (retries 400s and 429s equally). No `Retry-After` header support. No circuit breaker.
**Impact:** Transient failures (rate limits, 503s) often fail permanently when a second attempt with proper delay would succeed.
**Fix:** Increase MAX_RETRIES to 3. Add jitter. Add error discrimination.

### 3.2 Artifact Generation in Assistant Stream Fails Silently

**Files:** `src/app/api/ai/assistant-stream/route.ts:162-166,208-212,228-230`
**Issue:** When `generateArtifactForProject` fails (429, timeout, validation error, DB error), it returns `null`. The caller at line 211-213 checks for null and omits the artifact note from the prompt. The assistant responds conversationally as if nothing happened. The user never knows the artifact generation failed.
**Impact:** Users request artifacts via chat, receive no artifact, and receive no error message. They may wait indefinitely or assume the system is broken.
**Fix:** Surface errors to the user in the assistant's response.

### 3.3 No Idempotency or Deduplication

**Files:** `src/app/api/ai/generate/route.ts`, `assistant-stream/route.ts`, `refine/route.ts`
**Issue:** No request idempotency key is used. If a client retries the same request (network timeout, user double-click), duplicate AI calls are made and duplicate upserts race. For the assistant stream, duplicate user messages are saved.
**Impact:** Wasted AI costs, duplicate conversation entries, race conditions on artifact data.
**Fix:** Add an idempotency key mechanism using the project ID + type + timestamp or UUID.

### 3.4 Version History Not Preserved

**Files:** `supabase/migrations/000_all_migrations.sql:93-101`
**Issue:** The `UNIQUE(project_id, type)` constraint and upsert pattern mean old artifact versions are permanently overwritten. The `version` column increments but the previous content is lost. Rollback or audit is impossible.
**Impact:** No recovery from bad refinement, no audit trail, no version comparison.
**Fix:** Consider an artifact version history table if rollback capability is required.

### 3.5 Storage Files Orphaned on User/Project Deletion

**Files:** `supabase/migrations/000_all_migrations.sql:241-265`
**Issue:** The `ON DELETE CASCADE` chain correctly removes database records when a user or project is deleted. However, files in the `exports` storage bucket (stored at `{userId}/{projectId}/{fileName}`) are never cleaned up. No trigger or cron job removes them.
**Impact:** Storage costs accumulate indefinitely for deleted users and projects.
**Fix:` Add a cleanup mechanism (post-delete trigger, scheduled job, or lifecycle policy).

---

## 4. Failure Scenarios

| Scenario | Behavior | Severity |
|----------|----------|----------|
| **AI provider 429** | Generic 500 returned. 1 retry with 1s delay is insufficient. | High |
| **AI provider timeout** | Request hangs indefinitely. No `AbortController`. Promise never settles. | **Critical** |
| **Malformed AI JSON** | `JSON.parse` throws. Error caught by generic catch block. No diagnostic info. | Medium |
| **Validation failure (generate)** | Artifact not saved. 500 returned with helpful message. **Correct behavior.** | None |
| **Validation failure (refine)** | **No validation exists.** Invalid data saved to DB. | **Critical** |
| **Upsert failure after generation** | Generated content lost. AI cost incurred for nothing. Generic 500. | High |
| **Concurrent same-artifact requests** | Second request silently overwrites first. No error. | **Critical** |
| **Client disconnect mid-stream** | Orphaned user message in DB. Partial assistant response discarded. | **Critical** |
| **Client clicks Stop** | AbortError caught silently. User message saved, no assistant response. | High |
| **Export storage upload fail** | 200 returned to client. File never persisted. No record created. | High |
| **Export DB record fail** | Storage file orphaned. No record of export. 200 returned. | High |
| **Page refresh mid-generation** | Generation completes server-side. Artifact saved. Client sees artifact on reload. | Low |
| **Network failure on fetchSilently** | Stale data served with no notification. | Medium |
| **Redis unavailable** | Rate limiting returns `{ allowed: false }` — all requests blocked. | High |

---

## 5. Recovery Recommendations

| Priority | Fix | Files | Effort |
|----------|-----|-------|--------|
| **IMMEDIATE** | Add `AbortSignal.timeout(30000)` to all AI provider fetch calls | `deepseek.ts:10,42` | 15 min |
| **IMMEDIATE** | Await and handle errors in `flush()` save | `assistant-stream/route.ts:269-273` | 10 min |
| **IMMEDIATE** | Add schema validation to refine output | `refine.ts:24`, `prompts.ts:35-52` | 10 min |
| **IMMEDIATE** | Fix `upsertArtifact` race condition with atomic version increment | `queries.ts:140-165` | 30 min |
| **HIGH** | Return error 500 if storage upload fails in export routes | `pdf/docx/pptx/route.ts` | 15 min |
| **HIGH** | Surface artifact generation errors in assistant stream | `assistant-stream/route.ts:162-166,228-230` | 20 min |
| **HIGH** | Fix `EXPORT_FORMATS` / DB enum mismatch | `constants/index.ts:29` | 5 min |
| **HIGH** | Fix `deleteProject` return value to distinguish "not found" from "deleted" | `queries.ts:76-85` | 10 min |
| **MEDIUM** | Increase retries to 3, add jitter and error discrimination | `retry.ts:1-23` | 20 min |
| **MEDIUM** | Add storage cleanup mechanism for deleted users/projects | Migration + scheduled job | 2-4 hours |
| **MEDIUM** | Add markdown export to storage/record system | `markdown/route.ts` | 30 min |
| **LOW** | Add idempotency keys to AI requests | `generate/route.ts`, `assistant-stream/route.ts` | 1-2 hours |
| **LOW** | Add artifact version history table | Migration | 1-2 hours |

---

## 6. Long-Term Scalability Concerns

| Concern | Impact | Recommendation |
|---------|--------|----------------|
| **No conversation pagination** | `getConversation` returns all messages. Long conversations cause large payloads. | Add `limit` + cursor-based pagination. |
| **No artifact pagination** | `getProjectArtifacts` returns all artifacts. Scales fine for current 15 types, but not for future expansion. | Add limit/offset soon. |
| **No export storage cleanup** | Orphaned files accumulate in storage bucket indefinitely. | Add TTL or lifecycle policy. |
| **No caching layer** | Every mount re-fetches conversations and artifacts. Increases database load as user base grows. | Add SWR/React Query or Redis caching. |
| **Migration not re-runnable** | `CREATE TYPE` and `CREATE INDEX` statements will fail on re-run. Makes CI/CD deployments fragile. | Add `IF NOT EXISTS` to all DDL statements. |
| **Hardcoded AI parameters** | `temperature: 0.3`, `max_tokens: 4096` — no per-request configurability. Limits flexibility for different artifact types. | Make configurable via generator options. |
| **No structured logging** | All errors use `console.error`. No request IDs, severity levels, or context propagation. Makes debugging at scale impossible. | Add structured logging with correlation IDs. |

---

## 7. Verdict

**Data integrity score: 5/10**

The cascade chain is correct and complete, preventing orphaned database records. However, the application has critical race conditions (`upsertArtifact`), a validation bypass in the refine flow, no timeouts on AI calls (risk of indefinite hangs), silent data loss scenarios in conversation persistence, and misleading success responses on export storage failures. The six critical issues should be addressed before production deployment.

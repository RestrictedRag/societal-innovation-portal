# Implementation Audit Report: Target Architecture vs. Codebase

**Date:** 2026-09-01  
**Audited Codebase:** `societal-innovation-portal` / `SIH Project 2026`  
**Scope:** Full-stack comparison of codebase against the target citizen-problem-to-university-project-to-corporate-sponsorship pipeline architecture.

---

## 1. Summary Table

| Component / Flow | Status | File(s) & Line Numbers | Notes |
| :--- | :--- | :--- | :--- |
| **ProfileSetupUI** | ⚠️ Partial | [`src/app/(auth)/signup/page.tsx:1-206`](file:///d:/SIH%20Project%202026/src/app/(auth)/signup/page.tsx#L1-L206) | Location input exists on signup, but no dedicated Org Profile UI to configure `service_radius_km`. |
| **API_Profile** (`POST /api/users/profile`) | ❌ Missing | — | No `/api/users/profile` route exists. Initial user registration is handled by [`/api/auth/register`](file:///d:/SIH%20Project%202026/src/app/api/auth/register/route.ts#L1-L126). |
| **CitizenPage** (Citizen App / Post UI) | ✅ Implemented | [`src/components/feed/ProblemFeed.tsx:1-784`](file:///d:/SIH%20Project%202026/src/components/feed/ProblemFeed.tsx#L1-L784)<br>[`src/components/complaints/ComplaintFormView.tsx:1-350`](file:///d:/SIH%20Project%202026/src/components/complaints/ComplaintFormView.tsx#L1-L350)<br>[`src/components/complaints/useComplaintForm.ts:1-461`](file:///d:/SIH%20Project%202026/src/components/complaints/useComplaintForm.ts#L1-L461) | Feed view, issue posting modal, location resolution, client-side optimistic UI with offline retry, and >= 30-word description validation. |
| **API_Upload** (`POST /api/upload`) | ⚠️ Partial | [`src/app/api/upload/presigned/route.ts:1-24`](file:///d:/SIH%20Project%202026/src/app/api/upload/presigned/route.ts#L1-L24) | Implemented under path `/api/upload/presigned`. Generates presigned PUT URLs for Cloudflare R2 / AWS S3. |
| **AWS_S3 / Cloudflare R2** | ✅ Implemented | [`src/lib/s3.ts:1-60`](file:///d:/SIH%20Project%202026/src/lib/s3.ts#L1-L60) | AWS SDK v3 S3Client configured for Cloudflare R2 / S3-compatible endpoints with presigned URL creation. |
| **API_Submit** (`POST /api/problems`) | 🔀 Diverges | [`src/app/api/problems/create/route.ts:1-226`](file:///d:/SIH%20Project%202026/src/app/api/problems/create/route.ts#L1-L226)<br>[`src/app/api/problems/route.ts:1-36`](file:///d:/SIH%20Project%202026/src/app/api/problems/route.ts#L1-L36) | Endpoint exists and inserts to `citizen_problems`, but **completely bypasses the AI pipeline** (no spam scoring, no vector embedding, no deduplication, no triage). Inserts directly with `status='OPEN'`. |
| **LLM_Spam** (Spam Scorer) | ❌ Missing | [`src/lib/ai/triage-schema.ts:14-19`](file:///d:/SIH%20Project%202026/src/lib/ai/triage-schema.ts#L14-L19) | Schema definition exists (`spamProbability: z.number()`), but no LLM prompt or scoring call is implemented or wired into submission. |
| **Model_BGE** (Embedding Model) | ⚠️ Unwired | [`src/lib/ai/embeddings.ts:1-23`](file:///d:/SIH%20Project%202026/src/lib/ai/embeddings.ts#L1-L23) | Helper `generateProblemEmbedding()` exists using Google Gemini Embedding (not BGE-M3), but is **never invoked** in any route or background worker. |
| **Vector Deduplication (sim > 0.92)** | ❌ Missing | — | No nearest-neighbor similarity query or upvote-on-match logic exists. Every submission creates a new row. |
| **LLM_Triage** (Classification & Tagging) | ❌ Missing | [`src/lib/ai/triage-schema.ts:1-22`](file:///d:/SIH%20Project%202026/src/lib/ai/triage-schema.ts#L1-L22) | Zod schema exists, but `generateObject` call is not implemented. Category comes strictly from client form selection. |
| **AdminReviewUI** | ❌ Missing | — | No admin moderation queue UI exists. |
| **API_ModerationReview** (`POST /api/problems/moderate`) | ❌ Missing | — | No moderation review API endpoint exists. |
| **UniDashboard** (Discovery UI) | ❌ Missing | [`src/app/(dashboard)/university/`](file:///d:/SIH%20Project%202026/src/app/(dashboard)/university) | Directory exists but is empty. |
| **API_RecommendUni** (`GET /api/recommendations/university`) | ❌ Missing | [`src/app/api/recommendations/route.ts:1-13`](file:///d:/SIH%20Project%202026/src/app/api/recommendations/route.ts#L1-L13) | Only a generic `/api/recommendations` stub exists returning `{ recommendations: [] }`. No domain + `ST_DWithin` + vector ranking query. |
| **API_Claim** (`POST /api/projects/claim`) | 🔀 Diverges | [`src/app/api/projects/claim/route.ts:1-103`](file:///d:/SIH%20Project%202026/src/app/api/projects/claim/route.ts#L1-L103) | Endpoint exists with auth and `STUDENT`/`FACULTY` role check, but uses **vulnerable non-atomic read-then-write logic** instead of an atomic conditional `UPDATE ... WHERE status='OPEN'`. |
| **UniProjectPage** (Workspace UI) | ❌ Missing | — | No project detail or workspace page exists. |
| **API_Milestone** (`POST /api/projects/milestone`) | ❌ Missing | — | No milestone submission endpoint exists. |
| **API_VerifyMilestone** (`POST /api/projects/verify-milestone`) | ❌ Missing | — | No milestone verification endpoint exists. |
| **CorporateFeed** (Corporate Showcase UI) | ❌ Missing | [`src/app/(dashboard)/corporate/`](file:///d:/SIH%20Project%202026/src/app/(dashboard)/corporate) | Directory exists but is empty. |
| **API_RecommendCorp** (`GET /api/recommendations/corporate`) | ❌ Missing | — | No corporate recommendation endpoint exists. |
| **API_Sponsor** (`POST /api/escrow/sponsor`) | ❌ Missing | — | No sponsorship / escrow funding endpoint exists. |
| **API_ReleaseEscrow** (Escrow Release Trigger) | ❌ Missing | — | No escrow release worker, event listener, or webhook exists. |
| **AuthGuard** (Auth & Role Middleware) | 🔀 Diverges | [`src/middleware.ts:1-21`](file:///d:/SIH%20Project%202026/src/middleware.ts#L1-L21) | Next.js middleware only intercepts page URLs (`/feed`, `/problems/:id/claim`, etc.) for login redirect. Does NOT intercept `/api/*` routes or enforce roles. Role checks are done manually inside individual route handlers. |
| **DB_Users** (`users`, `universities`) | ✅ Implemented | [`src/db/schema.ts:111-150`](file:///d:/SIH%20Project%202026/src/db/schema.ts#L111-L150) | Full Drizzle schema with `auth_user_id`, `role`, `isVerified`, `universityId`, `latitude`, `longitude`. `serviceRadiusKm` is located on `universities`. |
| **DB_Problems** (`citizen_problems`, `problem_media`, `problem_embeddings`) | ✅ Implemented | [`src/db/schema.ts:152-211`](file:///d:/SIH%20Project%202026/src/db/schema.ts#L152-L211) | Tables with `status` enum, `spamScore`, `domain`, `secondaryTags`, `latitude`, `longitude`, and `vector(1024)` HNSW index. |
| **DB_Projects** (`university_projects`) | ✅ Implemented | [`src/db/schema.ts:213-236`](file:///d:/SIH%20Project%202026/src/db/schema.ts#L213-L236) | Table with `problemId`, `leadUniversityId`, `claimedByUserId`, `status`, `budget`, and unique index on `(problemId, leadUniversityId)`. |
| **DB_Updates** (`project_updates`) | ✅ Implemented | [`src/db/schema.ts:238-249`](file:///d:/SIH%20Project%202026/src/db/schema.ts#L238-L249) | Table with `projectId`, `trlLevel`, `description`, `evidenceUrl`, `verified`, `verifiedBy`. |
| **DB_Escrow** (`escrow_ledger`) | ✅ Implemented | [`src/db/schema.ts:251-264`](file:///d:/SIH%20Project%202026/src/db/schema.ts#L251-L264) | Table with `projectId`, `milestoneId`, `corporateId`, `amount`, `status` (`HELD`, `RELEASED`, `REFUNDED`), `releasedAt`. |

---

## 2. Overall Completion Estimate

```
┌────────────────────────────────────────────────────────┬────────────┐
│ Architecture Cycle                                     │ Completion │
├────────────────────────────────────────────────────────┼────────────┤
│ Cycle 0: Org Profile & Service Area Setup              │    20%     │
│ Cycle 1: Submission, Spam Gate & Deduplication         │    40%     │
│ Cycle 2: Discovery & Atomic Claim                      │    25%     │
│ Cycle 3: Milestones & Gated Escrow                     │    15%     │
├────────────────────────────────────────────────────────┼────────────┤
│ TOTAL SYSTEM IMPLEMENTATION ESTIMATE                   │   ~28%     │
└────────────────────────────────────────────────────────┴────────────┘
```

### Breakdown by Layer:
- **Database Layer (Drizzle Schema, Types, Relational Definitions):** **95% Implemented.** All 5 core domain entities (`users`, `citizen_problems`, `university_projects`, `project_updates`, `escrow_ledger`), pgvector definition, and enums are in place.
- **Citizen Experience (UI + Feed + Create API + R2 Presigned Upload):** **80% Implemented.** Fully interactive citizen feed, client-side optimistic caching, form validation, geolocation, and direct insertion work.
- **AI Pipeline (Spam Scoring, pgvector Dedup, LLM Triage):** **5% Implemented.** Schemas exist in `src/lib/ai/`, but no runtime LLM invocations or vector similarity checks are executed during ingestion.
- **University Discovery & Workspace:** **10% Implemented.** `claim` API route exists; recommendation algorithm and UI pages are empty stubs.
- **Corporate Sponsorship & Gated Escrow:** **5% Implemented.** Schema defined; all API routes, verification triggers, and UI are missing.

---

## 3. Critical Divergences & Risks

### 1. [HIGH] Race Condition on Project Claim (`API_Claim`)
* **Location:** [`src/app/api/projects/claim/route.ts:43-80`](file:///d:/SIH%20Project%202026/src/app/api/projects/claim/route.ts#L43-L80)
* **Target Spec:** `UPDATE citizen_problems SET status='CLAIMED', claimed_by=... WHERE id=problemId AND status='OPEN'` $\rightarrow$ branch on affected rows (`0 -> ALREADY_CLAIMED`, `1 -> ok`).
* **Actual Code:** The route performs an un-isolated `findFirst` read, checks an existing project read, inserts into `university_projects`, and then performs an unqualified `UPDATE citizen_problems SET status='CLAIMED' WHERE id=problemId`.
* **Impact:** Two concurrent requests from different universities will both read `status='OPEN'`, both create projects, and overwrite each other. Furthermore, the route never verifies that `problem.status === 'OPEN'` before claiming.

### 2. [HIGH] Bypassed Spam Gate and Moderation Pipeline (`API_Submit`)
* **Location:** [`src/app/api/problems/create/route.ts:108-130`](file:///d:/SIH%20Project%202026/src/app/api/problems/create/route.ts#L108-L130)
* **Target Spec:** Submissions must pass through `LLM_Spam` (`p > 0.85 -> reject`, `0.4 < p <= 0.85 -> PENDING_MODERATION`, `p <= 0.4 -> continue to dedup`).
* **Actual Code:** Posts are inserted directly with `status: 'OPEN'`, skipping all AI scoring and moderation queues. The problem ID is enqueued to Redis (`queue:problem-processing`), but **no worker exists to consume this queue**.

### 3. [HIGH] Missing Deduplication Logic (`Model_BGE` + pgvector)
* **Location:** [`src/app/api/problems/create/route.ts`](file:///d:/SIH%20Project%202026/src/app/api/problems/create/route.ts)
* **Target Spec:** Generates embedding, computes cosine/L2 distance with existing problems; if similarity $> 0.92$, upvotes the existing issue instead of inserting a duplicate.
* **Actual Code:** No vector similarity query is executed. Every unique submission creates a distinct database row.

### 4. [MEDIUM] Auth & Role Middleware Gaps (`AuthGuard`)
* **Location:** [`src/middleware.ts:10-19`](file:///d:/SIH%20Project%202026/src/middleware.ts#L10-L19)
* **Target Spec:** Centralized auth middleware verifying JWT and enforcing role checks for `API_Submit`, `API_Claim`, `API_Milestone`, `API_Sponsor`.
* **Actual Code:** `src/middleware.ts` matcher only covers UI routes (`/feed`, `/problems/:id/claim`, etc.) for page redirects. API routes must manually parse session and enforce roles. Missing API routes have no baseline protection.

---

## 4. Not Implemented (By Cycle)

### Cycle 0: Org Profile & Service Area
- [ ] `ProfileSetupUI`: UI component to specify university/org coordinates and radius in km.
- [ ] `API_Profile` (`POST /api/users/profile`): Endpoint to update service area and radius.

### Cycle 1: Submission, Spam Gate & Deduplication
- [ ] `LLM_Spam`: Prompt execution with structured output for spam probability.
- [ ] Moderation branching logic (`p > 0.85` reject, `0.4 < p <= 0.85` hold).
- [ ] `Model_BGE` / Embedding generation wired into ingestion pipeline.
- [ ] pgvector nearest neighbor search query (`<->` / cosine similarity).
- [ ] Upvote-on-duplicate threshold (`sim > 0.92`).
- [ ] `LLM_Triage`: Automated domain classification and tag generation.
- [ ] `API_ModerationReview` (`POST /api/problems/moderate`): Admin approval/rejection endpoint.
- [ ] `AdminReviewUI`: Admin moderation queue interface.
- [ ] Background Redis Queue Worker: Consumer for `queue:problem-processing`.

### Cycle 2: Discovery & Atomic Claim
- [ ] `API_RecommendUni` (`GET /api/recommendations/university`): PostGIS spatial query combining `ST_DWithin` with university service radius, domain filtering, and vector similarity ranking.
- [ ] `UniDashboard`: University discovery UI to view recommended regional issues.
- [ ] Atomic claim rewrite (`UPDATE ... WHERE status='OPEN' RETURNING *`).
- [ ] `UniProjectPage`: University project workspace.

### Cycle 3: Milestones & Gated Escrow
- [ ] `API_Milestone` (`POST /api/projects/milestone`): Endpoint for submitting TRL milestones.
- [ ] `API_VerifyMilestone` (`POST /api/projects/verify-milestone`): Endpoint for reviewer milestone verification.
- [ ] `CorporateFeed` / Showcase UI.
- [ ] `API_RecommendCorp` (`GET /api/recommendations/corporate`): Verified project showcase feed.
- [ ] `API_Sponsor` (`POST /api/escrow/sponsor`): Escrow creation endpoint (`status='HELD'`).
- [ ] `API_ReleaseEscrow`: Milestone verification event listener / trigger to update `escrow_ledger` to `RELEASED` and credit project budget.

---

## 5. Assumptions & Unknowns

1. **AI SDK Key Availability:** `src/lib/ai/embeddings.ts` imports `@ai-sdk/google`, but `GOOGLE_GENERATIVE_AI_API_KEY` is not present in `.env.local`. Executing live embeddings will fail unless the environment variable is supplied.
2. **Embedding Model Discrepancy:** The target architecture specifies **BGE-M3** embeddings (1024 dimensions), whereas the stub in `src/lib/ai/embeddings.ts` references Google's `gemini-embedding-001`.
3. **Queue Architecture:** `src/lib/redis.ts` defines `enqueueProblemJob` pushing to Upstash Redis (`queue:problem-processing`). It is assumed this was intended for an asynchronous BullMQ/worker process (such as a standalone Node worker or serverless cron), which has not yet been authored.
4. **Test Coverage:** Only 1 unit test file exists ([`src/lib/__tests__/refactor-helpers.test.ts`](file:///d:/SIH%20Project%202026/src/lib/__tests__/refactor-helpers.test.ts)), which covers basic string helper validation and Redis key formatting. There are **no automated integration tests** for problem submission, claim concurrency, or escrow lifecycles.

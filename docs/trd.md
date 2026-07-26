# Pratikar Digital Hub — Technical Requirements Document (TRD)

**Prepared by:** Loobnity (Sam)
**Status:** Living document — schemas/endpoints get filled in as each module is actually built
**Companion docs:** `docs/prd.md` (product), `docs/srs.md` (functional spec), `docs/architecture.md` (system-level decisions)

This document is the implementation-level detail that `architecture.md` deliberately left out: exact schemas, API conventions, integration specifics, security implementation, and technical targets. If `architecture.md` says *what* talks to *what*, this says *how*.

---

## 1. Technology Stack (pinned)

| Layer | Choice | Version baseline |
|---|---|---|
| Frontend framework | Next.js (App Router) | 15.x |
| UI | React | 18.3.x |
| Backend framework | NestJS | 10.4.x |
| ORM | Prisma | 5.20.x |
| Database | PostgreSQL | 16.x |
| Cache / queue backend | Redis | 7.x |
| Job queue | BullMQ | 5.13.x |
| Mobile | React Native | latest stable at Phase 4 start |
| Package manager / monorepo | pnpm + Turborepo | pnpm 9.x |
| Language | TypeScript everywhere | 5.6.x, `strict: true` |

Rationale for each already covered in `architecture.md` — this table exists so version drift is visible at a glance.

---

## 2. Data Model

Field-level detail for the entities listed at a high level in `architecture.md` Section 5. This is the reference for the Prisma schema — not the schema itself (that's written directly in `apps/api/prisma/schema.prisma` once we start Auth's DB layer).

### 2.1 Identity & Access

**User**
`id, name, email (nullable), phone (nullable), role (enum), createdAt, updatedAt`
— exactly one of `email`/`phone` required at minimum; both can exist once profile is completed.

**Role** — enum, not a table (per `@pratikar/types`): `customer | support | content_manager | admin | super_admin`.
*(Open question — SRS Section 8, item 6 — whether "can review documents" becomes a sub-permission rather than folded into `content_manager`.)*

**OtpRequest**
`id, identifier, channel (email|sms), codeHash, attempts, consumedAt (nullable), expiresAt, createdAt`
— indexed on `(identifier, channel, consumedAt)` for the active-lookup query in the verify flow.

**Session**
`id, userId, refreshTokenHash, userAgent, ip, revokedAt (nullable), expiresAt, createdAt`
— indexed on `refreshTokenHash` (lookup) and `userId` (for "log out everywhere").

### 2.2 Documents & Review

**Template**
`id, title, category, priceInPaise, reviewPriceInPaise, fieldSchema (JSON), status (draft|published|archived), createdBy, createdAt, updatedAt`

**GeneratedDocument**
`id, userId, templateId, filledData (JSON), fileUrl (R2 key), status (generated|paid|downloaded), downloadedAt (nullable), createdAt`

**DocumentReview**
`id, generatedDocumentId, requestedByUserId, assignedToUserId (nullable, Content Manager), status (queued|in_review|returned), reviewedFileUrl (R2 key, nullable), notes, orderId (the paid add-on order), createdAt, updatedAt`
— `assignedToUserId` nullable until a Content Manager claims it from the queue (see Section 4.3 for the claim semantics — prevents two reviewers double-working the same submission).

### 2.3 Content Library & LMS

**ContentLibraryItem**
`id, title, category (enum: legal_practice|business_compliance|property_documentation|digital_career|checklists_reference), type (ebook|checklist), priceInPaise, fileUrl, status, createdAt`

**Course**
`id, title, description, priceInPaise, accessDurationDays (default 180), status, createdAt`

**CourseModule** — `id, courseId, title, order, videoAssetId (Cloudflare Stream UID)`

**Enrollment**
`id, userId, courseId, orderId, enrolledAt, expiresAt, completedAt (nullable)`
— `expiresAt = enrolledAt + accessDurationDays`.

**Certificate**
`id, enrollmentId, verificationCode (public, unique, indexed), issuedAt`
— `verificationCode` is what the public verification page (SRS 3.5) looks up; deliberately not the same as the internal `id`.

### 2.4 Commerce

**Order**
`id, userId, itemType (document|document_review|content_item|course), itemId, amount, gstAmount, status (pending|paid|failed|refunded), razorpayOrderId, razorpayPaymentId (nullable), createdAt, updatedAt`

**Invoice**
`id, orderId, invoiceNumber (sequential, GST-compliant format), gstin, pdfUrl, createdAt`

### 2.5 AI

**ChatbotConversation** — `id, userId (nullable — supports pre-login), messages (JSON array), createdAt`

**KnowledgeBaseDocument** — `id, sourceType (faq|template|course|policy), sourceId, content, embedding (vector), updatedAt`
— `embedding` implies a vector-capable Postgres extension (`pgvector`) rather than a separate vector DB, to avoid adding infra for this at MVP scale. Revisit if RAG retrieval quality/latency demands a dedicated vector store later.

### 2.6 Newly in-scope, not yet schemed

**Affiliate Management** and **Franchise Management** — no entities defined yet; blocked on the scoping pass noted in `docs/srs.md` Section 8 (items 4–5). Placeholder module folders exist in the repo scaffold; schema comes after requirements.

---

## 3. API Design Conventions

- **Style:** REST, resource-oriented (`/documents`, `/orders`, not RPC-style verbs in the path).
- **Auth:** access token as `Authorization: Bearer <jwt>` for API calls from the app after initial load; refresh token flows via httpOnly cookie (web) or request body (Android), per the Auth flow already designed.
- **Error format (uniform across all endpoints):**
  ```json
  { "error": { "code": "INVALID_OTP", "message": "The code you entered is incorrect." } }
  ```
  `code` is a stable machine-readable string (already using this convention in the Auth module: `OTP_EXPIRED_OR_NOT_FOUND`, `INVALID_OTP`, `TOO_MANY_ATTEMPTS`) — frontend should switch on `code`, never parse `message`.
- **Pagination:** cursor-based (`?cursor=<id>&limit=20`) for list endpoints expected to grow large (documents, orders, content library, chatbot logs) — offset pagination is fine for small, bounded admin lists (staff accounts).
- **Idempotency:** any endpoint that creates a payment-adjacent side effect (order creation, refund) accepts an `Idempotency-Key` header — prevents duplicate orders from a retried request (e.g. flaky mobile network).
- **Versioning:** not needed until there's an external API consumer (there isn't one — Android talks to the same API as web). Revisit if a public API is ever exposed.

---

## 4. Module-by-Module Technical Notes

*(Full endpoint list gets written when each module is actually built — this section captures the technical decisions that aren't obvious from the SRS alone.)*

### 4.1 Auth — technical detail already locked (see `apps/api/src/modules/auth` in the repo scaffold)
OTP: HMAC-SHA256 hash (not bcrypt — low-entropy 6-digit code, short TTL, speed > slow-hash resistance). Refresh tokens: opaque random, SHA-256 hashed at rest. Access tokens: JWT, 15 min, `{ sub, role }` payload only — no PII in the token.

### 4.2 Documents — generation pipeline
`docxtemplater` fills the template → LibreOffice headless (`soffice --convert-to pdf`) converts to PDF for preview → both DOCX and PDF stored in R2. This conversion step runs in a **BullMQ worker**, not inline in the request — LibreOffice headless conversion is slow (seconds, not ms) and would otherwise block the request thread and tie up a connection.

### 4.3 Document Review — queue claim semantics
To prevent two Content Managers reviewing the same submission simultaneously: claiming a queue item is a conditional update (`UPDATE document_review SET assignedToUserId = $1 WHERE id = $2 AND assignedToUserId IS NULL`), same atomic-update pattern used for OTP consumption in Auth — zero rows affected means someone else already claimed it, client should refresh the queue.

### 4.4 Payments — Razorpay integration specifics
- Webhook endpoint verifies the `X-Razorpay-Signature` header against the raw request body using the webhook secret — **never** trust a client-reported payment status.
- Reconciliation job (BullMQ, scheduled every few minutes) queries Razorpay's Orders API for any `Order` row stuck in `pending` for more than ~10 minutes, in case the webhook itself was dropped.
- Refund: `POST /orders/:id/refund` (Admin/Super Admin only, enforced by `RolesGuard`) → Razorpay Refund API → on webhook confirmation, `Order.status = refunded` and dependent entitlement (enrollment, review) is revoked in the same transaction.

### 4.5 Notifications — provider routing
`NotificationsModule` exposes a single internal `send(type, user, payload)` call; internally routes to Resend (email), MSG91 (SMS, gated on DLT per the open item in `architecture.md`), or FCM (Android push — added for the document-review-ready notification). Keeping this behind one internal interface means a provider swap later doesn't ripple through every module that sends notifications.

### 4.6 AI Modules — RAG pipeline
Knowledge base (`KnowledgeBaseDocument`) needs re-embedding whenever a template, course, or content item is created/edited — this is a BullMQ job triggered from those modules' create/update handlers, not a manual/batch process, since stale RAG content (recommending an archived course) is a real trust problem for the chatbot.

---

## 5. Security Implementation Detail

- **Encryption at rest:** R2 server-side encryption for all stored files (generated documents, reviewed documents, content library files, certificates).
- **Rate limiting:** `@nestjs/throttler` at the route level (already applied in `AuthController` — 5/min on OTP request, 10/min on verify); document-generation and review-request endpoints get similarly tight limits given their compute/human cost per call.
- **RBAC enforcement:** `RolesGuard` + `@Roles()` decorator (already scaffolded) on every admin-facing controller method — never rely on frontend route-hiding alone.
- **Audit log:** append-only `AuditLog` table (`id, actorUserId, action, targetType, targetId, metadata (JSON), createdAt`) — written on every admin mutation (refund issued, document reviewed, template edited, role changed). Not yet in Section 2 — add when the Admin module is actually built.
- **Input validation:** `class-validator` DTOs with `whitelist: true, forbidNonWhitelisted: true` globally (already set in `main.ts`) — unknown fields in a request body are rejected outright, not silently dropped.
- **CORS:** origin allowlist via `ALLOWED_ORIGINS` env var, credentials enabled (required for the refresh-token cookie).

---

## 6. Background Jobs (BullMQ queues)

| Queue | Job | Trigger |
|---|---|---|
| `document-generation` | Fill template, convert to PDF/DOCX, upload to R2 | Customer submits filled form |
| `payment-reconciliation` | Re-check `pending` orders against Razorpay | Scheduled, every few minutes |
| `knowledge-base-sync` | Re-embed a changed template/course/content item | Template/course/content create or update |
| `notification-dispatch` | Send email/SMS/push | Any `NotificationsModule.send()` call |
| `certificate-generation` | Generate certificate PDF + verification code | Course marked complete |
| `course-expiry-reminder` | Notify customer their 6-month window is closing | Scheduled, checks `Enrollment.expiresAt` |

All queues get a retry policy (exponential backoff, capped attempts) and a dead-letter path (failed jobs land somewhere visible in the admin dashboard, not silently dropped) — worth building this convention once in a shared BullMQ wrapper rather than per-queue.

---

## 7. Testing Strategy

Matched to blast radius, not uniform coverage (per the earlier discussion on solo-dev prioritization):

- **High-value tests (real unit + integration coverage):** OTP verify flow (attempt cap, atomic consume, replay protection), payment webhook verification, refund entitlement-revocation, RBAC guard behavior.
- **Light coverage:** CRUD admin endpoints (templates, content library, courses) — a smoke test per endpoint (does it return 200/403 correctly) is enough; the risk of a bug here is low and easily caught in manual QA.
- **E2E (Playwright, later):** the one true end-to-end path from Milestone 0 — generate → preview → pay → download — since that's the core trust-building interaction the whole product PRD leads with.

---

## 8. Environments & Configuration

Three environments (local/staging/production, per `architecture.md`). Key env vars per app (non-exhaustive, grows as modules are built):

**apps/api:** `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `OTP_HMAC_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `RESEND_API_KEY`, `MSG91_API_KEY`, `ALLOWED_ORIGINS`.

**apps/web / apps/admin:** `NEXT_PUBLIC_API_URL`.

All secrets live in Railway's/Vercel's environment variable stores per environment — never committed, `.env.example` files in the repo show the shape only.

---

## 9. Open Technical Questions

1. **Vector store choice** (Section 2.5) — `pgvector` assumed for MVP simplicity; revisit if RAG scale/latency demands a dedicated vector DB.
2. **Reviewer role modeling** (carried over from `docs/srs.md` Section 8, item 6) — affects the `Role` enum and `DocumentReview.assignedToUserId` constraints.
3. **Affiliate/Franchise schemas** — blocked on requirements (Section 2.6).
4. **Audit log retention** — how long does `AuditLog` need to be kept? Affects whether it needs archival/partitioning down the line.

---

## Next steps

With PRD, SRS, architecture, and TRD as the full reference set, the next concrete step is writing the actual `apps/api/prisma/schema.prisma` from Section 2 of this document — that unblocks every `TODO` already sitting in the Milestone 0 `AuthModule`/`UsersModule` code.

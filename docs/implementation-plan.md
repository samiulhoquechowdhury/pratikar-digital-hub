# Pratikar Digital Hub — Implementation Plan

**Prepared by:** Loobnity (Sam)
**Status:** Living document — re-sequence as reality intervenes
**Companion docs:** `docs/prd.md`, `docs/srs.md`, `docs/architecture.md`, `docs/trd.md`

This is the concrete, ordered path from where the project actually stands today to launch. It supersedes the abstract 5-phase split in the SRS/architecture docs with real sequencing and dependencies.

---

## Where things stand right now

- **Backend:** Auth (OTP, sessions, RBAC), Documents (templates, generation stub, one-time download, review queue), Content Library, LMS (enrollment, certificates, public verification), Payments (order creation, webhook, refund) — all wired to a complete Prisma schema, but **not yet run against a real database.**
- **Frontend:** Feature-based folder structure scaffolded for both `web` and `admin`; only the Auth feature has any real code (still a stub), everything else is an empty folder with a README.
- **Infra:** Decided but not provisioned — no Railway/Vercel projects, no Razorpay/MSG91/Resend accounts, no Postgres instance exists anywhere yet.
- **Docs:** PRD, SRS, architecture, TRD all current and in sync in `docs/`.

Nothing has actually run yet. That's the first gap to close — not more design, but making the walking skeleton (Section 2 below) real.

---

## Milestone 1 — Make it real (infra + first end-to-end path)

**Goal:** one complete request actually flows through a live system: sign up → generate one document → pay → download.

1. **Provision infra accounts:** Railway project (Postgres + Redis + API), Vercel project (web + admin), Cloudflare R2 bucket, Razorpay test account, Resend account. (MSG91 can wait — gated on client DLT status, still unconfirmed.)
2. **Local dev loop:** `pnpm install`, local Postgres via docker-compose, `prisma migrate dev` against the schema already written — this is where the schema gets its first real test, not `prisma validate` in a sandbox.
3. **Auth for real:** wire Resend into `AuthService.sendOtp` (email channel only, since SMS is gated). Build the actual `OtpForm` component in `apps/web` (currently a stub) against the real `/auth/otp/*` endpoints.
4. **One real template:** create a single `Template` row by hand (or a tiny seed script) — pick the simplest one from the confirmed taxonomy work still pending, or use a placeholder title now and rename later. Build the actual dynamic form renderer in `apps/web/features/documents` that reads `Template.fieldSchema` and renders inputs.
5. **Generation pipeline for real:** implement the `document-generation` BullMQ worker — docxtemplater fill + LibreOffice PDF conversion + R2 upload — replacing the stub in `DocumentsService.generate`.
6. **Payments for real:** implement the actual Razorpay order-creation and refund HTTP calls in `RazorpayService` (currently `throw new Error(...)` stubs), and stand up the webhook endpoint with real raw-body handling in `main.ts`.
7. **Prove it end-to-end:** sign up → pick the one template → fill the form → preview → pay (Razorpay test mode) → download. This is the milestone that de-risks the whole architecture — once this works, everything after is breadth, not new mechanisms.

**Blockers to resolve before/during this milestone:** none strictly block starting — DLT status only blocks SMS OTP, not email.

---

## Milestone 2 — Admin core

**Goal:** Content Manager and Admin can actually operate the system that Milestone 1 proved works.

1. `apps/admin` — Template CRUD screens (create/edit the dynamic `fieldSchema`, the trickiest UI in the whole admin panel since it's a form-builder-for-forms).
2. Review queue UI (list, claim, return) against the already-built `DocumentReview` endpoints.
3. Orders list + refund action (Admin/Super Admin) against the already-built `PaymentsService.refund`.
4. Basic user list (Support+) and role management (Super Admin) — endpoints already exist (`UsersController`).
5. **Audit log:** implement the `AuditLog` writes (schema exists, nothing writes to it yet) on every admin mutation from this milestone — refunds, template edits, role changes. Cheaper to bake in now than retrofit once there are three months of unaudited admin actions.

**Blocker worth resolving here:** reviewer role granularity (SRS Section 8, item 6) — affects whether the review-queue UI needs a "who can review" filter beyond just "is a Content Manager."

---

## Milestone 3 — Content Library & LMS, customer-facing

**Goal:** the other two revenue lines actually work end-to-end for a customer, not just their APIs.

1. Content Library browse/search UI + purchase flow (reuses the Payments order flow from Milestone 1 — same mechanism, different `itemType`).
2. LMS course catalog, video playback (Cloudflare Stream), enrollment purchase flow, progress tracking (needed before "mark complete" can be genuine rather than manually triggered).
3. Certificate display + the public verification page (`/certificates/verify/:code` already exists on the backend — this is purely a frontend page, no auth).
4. Customer Dashboard: My Documents, My Purchases, My Courses, order history/invoices — the aggregation screen tying Milestones 1–3 together.

**Blocker worth resolving here:** GST invoice format/GSTIN handling needs a real answer before `Invoice` generation is more than a stub — this is an accounting question, not an engineering one, and shouldn't be guessed at.

---

## Milestone 4 — AI Modules

**Goal:** the AI Document Generator and RAG chatbot, which is the riskiest engineering work in the product (per the PRD's risk section) — deliberately sequenced after the manual paths work, so there's a working fallback and a clear behavioral spec to build the AI against.

1. Knowledge base ingestion pipeline (`KnowledgeBaseDocument` + `pgvector`) — index templates, courses, content items, FAQ.
2. RAG chatbot: retrieval + generation over that knowledge base, site-wide widget.
3. AI Document Generator: conversational field collection feeding into the same `generate()` pipeline built in Milestone 1 — this is why Milestone 1's field-schema design matters, it has to serve both the manual form and this conversational flow without a rewrite.

**Recommendation:** budget real QA time here specifically — a wrong field collected by the AI produces a legally deficient document, the single worst failure mode this product has.

---

## Milestone 5 — Android App

Mirrors the web customer feature set (Milestones 1–4) in React Native. Sequenced last among the "core" milestones because it's mostly re-implementing already-proven flows against an API that's already been exercised by the web app — the risk here is UI/mobile-specific (push notifications, encrypted token storage), not business logic.

Push notifications (FCM) for the document-review-ready flow become real here, not before — the web app doesn't need them.

---

## Milestone 6 — Newly in-scope: Affiliate & Franchise

Blocked until the scoping pass happens — this needs its own requirements-gathering session (referral tracking, commission structure, payout mechanism for Affiliate; onboarding, territory management, revenue sharing for Franchise), the same way AI Modules got scoped earlier in this project. Don't start building against guesses here.

---

## Cross-cutting, ongoing (not a milestone — runs in parallel throughout)

- **Content population:** the 100 templates, 500 checklists, 50 e-books, 50 courses are data-entry work through the admin panel built in Milestone 2, not engineering work. Can proceed in parallel with Milestones 3 onward, doesn't block any later milestone, and shouldn't inflate the sense of remaining engineering effort.
- **`docs/TECH_DEBT.md`:** log every shortcut taken under deadline pressure as it happens, not retroactively.
- **Testing:** weighted by blast radius per `docs/trd.md` Section 7 — real coverage on Auth/Payments/RBAC as they're hardened in Milestone 1, lighter smoke-testing on admin CRUD in Milestone 2.

---

## Open blockers, consolidated

Pulled from across SRS/TRD so they're in one place instead of scattered:

1. Client's DLT registration status (blocks SMS OTP only)
2. Refund policy specifics, especially for one-time-download documents
3. Master document-template taxonomy (100 templates)
4. Reviewer role granularity (Content Manager vs. a distinct Reviewer permission)
5. GST invoice format/GSTIN requirements
6. Affiliate & Franchise requirements (full scoping pass needed)
7. Content-library re-download policy (one-time like documents, or unlimited?)

None of these block **starting** Milestone 1 — they block specific later pieces (refunds, GST invoices, the review UI's permission model, Milestones 3 and 6 respectively). Worth getting client answers on 1–5 during Milestone 1, since that's naturally when there's a lull for async back-and-forth.

---

## Next step

Start Milestone 1, item 2 — local Postgres + `prisma migrate dev` — since every other item in Milestone 1 depends on the schema actually existing as real tables, not just a `.prisma` file.

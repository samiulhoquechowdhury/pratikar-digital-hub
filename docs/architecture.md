# Pratikar Digital Hub — System Architecture

**Owner:** Loobnity (Sam) — solo build
**Status:** Living document, updated as we design feature by feature

---

## 1. Guiding principles

- **Solo-sustainable.** Every infra choice favors low ops burden over marginal cost savings, until traffic/revenue justifies otherwise.
- **Modular monolith, not microservices.** One NestJS app with strict module boundaries. Split into services only if a specific module genuinely needs independent scaling — not by default.
- **Phased, feature-flagged rollout.** Matches the existing 5-phase plan (MVP core → commerce/content → AI → Android → advanced admin). Every module ships behind a flag so incomplete features never block a release.
- **Security-first.** This platform touches legal documents and payments — encryption, audit trails, and RBAC are not optional add-ons, they're in the first cut of every module.

---

## 2. Hosting & infrastructure

| Layer | Choice | Why |
|---|---|---|
| Web app + admin dashboard | **Vercel** | Zero-ops Next.js hosting, git-push deploys, preview URLs per PR for client review |
| API (NestJS) + Postgres + Redis | **Railway** | Single dashboard, managed backups, scales on a slider, no server babysitting |
| Object storage (documents, uploads) | **Cloudflare R2** | S3-compatible, zero egress fees — matters a lot given PDF/DOCX downloads at volume |
| Video (LMS) | **Cloudflare Stream** | Already decided — adaptive streaming, no separate CDN needed |
| Future scale path | **Hetzner VPS + Coolify** | When Railway costs outgrow budget, move the same Docker containers to a self-hosted PaaS. Architecture doesn't change, only the deploy target |

## 3. Auth architecture

- Single source of truth: NestJS `AuthModule`, shared by web, admin, and the future Android app.
- **Login:** email/phone OTP, no password. OTP delivery via SMS/email provider (to be selected when we build this module).
- **Tokens:** short-lived access token (~15 min) + rotating refresh token (7–30 days).
  - Web: httpOnly, secure cookies.
  - Android: refresh token in encrypted storage (Keystore), access token in memory.
- **RBAC:** roles table — `customer`, `admin`, `super-admin` (extendable later for `instructor`, `content-editor`). Enforced via NestJS guards + decorators at the route level.
- **Rate limiting:** OTP request/verify endpoints throttled aggressively (this is the most abused endpoint type on any OTP system).

## 4. Module boundaries (NestJS)

Each domain is an isolated Nest module — own DTOs, own service layer, own tests — communicating through well-defined providers, not reaching into each other's internals.

- `AuthModule` — OTP issuance/verification, tokens, sessions
- `UsersModule` — profiles, roles
- `DocumentsModule` — 100 master templates, dynamic form builder, PDF/DOCX generation
- `PaymentsModule` — Razorpay integration, subscriptions, invoices
- `LmsModule` — courses, enrollments, certificates
- `ContentModule` — checklists, e-books
- `StoreModule` — digital store transactions
- `AdminModule` — internal dashboard operations, audit log access
- `NotificationsModule` — email/SMS/push dispatch
- `StorageModule` — R2 upload/download abstraction used by other modules

## 5. Background jobs (BullMQ + Redis)

Anything slow or unreliable gets queued rather than blocking a request:

- Document generation (docxtemplater → LibreOffice conversion — CPU-heavy, must not block the API thread)
- Certificate PDF generation on course completion
- Email/SMS notification dispatch
- Payment webhook reconciliation (Razorpay)
- Cloudflare Stream upload/processing webhooks

## 6. Data layer

- **Single PostgreSQL database**, logically separated by module/schema conventions rather than physically split databases — simpler for a solo dev, and cross-domain joins (user + purchases + certificates) are common and cheap this way.
- **Redis** serves three roles: cache, BullMQ queue backend, and rate-limit counters.

## 7. CI/CD & environments

- GitHub Actions: lint + test + build on every PR.
- Three environments: local (docker-compose), staging, production.
- Deploy to staging on merge to `develop`, to production on merge to `main` / tagged release.

## 8. Security baseline

- Encryption at rest for documents in R2 (server-side encryption).
- Audit log table for admin actions and document access — expected on a legal platform, and useful for support/dispute resolution.
- `class-validator` DTOs on every endpoint — no untyped request bodies.
- Rate limiting on auth and document-generation endpoints specifically (highest abuse/cost surface).

## 9. Observability

- Sentry for error tracking, frontend and backend.
- Uptime monitoring (Better Uptime or UptimeRobot) on the API and web app.
- Structured logging (pino) from day one — cheap now, expensive to retrofit later.

---

## Next steps

Work through the 5-phase feature matrix module by module, starting with Phase 1 (MVP core): `AuthModule` and `UsersModule` first, since every other module depends on them.

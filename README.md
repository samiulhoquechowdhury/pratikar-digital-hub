# Pratikar Digital Hub

Legal document generation platform + content library + LMS, for Pratikar
Digital Hub Pvt. Ltd. Built by Loobnity.

## Structure

```
apps/
  web/      Next.js — customer-facing app (feature-based structure)
  admin/    Next.js — internal admin dashboard (role-gated)
  api/      NestJS — modular monolith backend
packages/
  types/    Shared TypeScript types/DTOs (framework-agnostic)
  ui/       Shared design-system components (web + admin)
  utils/    Shared framework-agnostic helpers
  config/   Shared tsconfig + eslint presets
docs/
  architecture.md   System architecture (hosting, auth, modules, data flow)
  srs.md            Full functional spec, roles, payment flow
  CONTRIBUTING.md   Branch strategy, commit conventions, workflow
```

## Getting started

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
pnpm dev
```

- Web: http://localhost:3000
- Admin: http://localhost:3001
- API: http://localhost:4000

## Stack

Next.js · NestJS (modular monolith) · PostgreSQL · Redis + BullMQ ·
Cloudflare R2 · Cloudflare Stream · Razorpay · pnpm + Turborepo.

Full reasoning behind each choice is in `docs/architecture.md`.

## Status

**Milestone 0** — repo scaffold, feature-based frontend structure, NestJS
module boundaries, CI/CD, branch strategy. `AuthModule` (OTP request/verify)
is the first module being built out for real; everything else is a
placeholder folder with a README describing its eventual scope.

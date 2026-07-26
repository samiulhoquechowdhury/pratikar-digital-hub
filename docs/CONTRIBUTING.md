# Contributing / Workflow

Solo-dev project today, written as if more people join later — so the habits
need to hold up either way.

## Branch strategy

Three branch types, trunk-based with short-lived feature branches:

- **`main`** — always deployable. Every commit here is (or was) in production.
  Protected: no direct pushes, PR + passing CI required.
- **`develop`** — staging integration branch. Feature branches merge here
  first; merging to `develop` auto-deploys to staging (see
  `.github/workflows/deploy-staging.yml`).
- **`feature/<short-description>`** — one per unit of work (e.g.
  `feature/otp-verify-endpoint`, `feature/document-template-crud`). Branch off
  `develop`, PR back into `develop`. Keep these short-lived — days, not weeks.
  A feature branch that's alive for a month is a sign the unit of work was too
  big; split it.
- **`hotfix/<short-description>`** — for urgent production fixes only.
  Branches off `main`, PRs into **both** `main` and `develop` so the fix isn't
  silently lost on the next regular release.

Merging `develop` → `main` (a release) happens deliberately, not
automatically — tag it (`v0.x.0`) so there's a clear record of what shipped
when.

## Commit messages — Conventional Commits

```
feat(auth): add OTP verify endpoint with attempt-cap and atomic consume
fix(payments): correct webhook signature verification
docs(srs): resolve refund policy open question
chore(deps): bump @nestjs/core to 10.4.1
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`. Scope = the module
or feature folder touched (`auth`, `documents`, `payments`, `web/auth`, etc).

## Before opening a PR

```bash
pnpm lint
pnpm typecheck
pnpm test
```

All three run in CI anyway (`.github/workflows/ci.yml`), but catching it
locally first is faster than waiting on the pipeline.

## Adding a new feature (frontend)

1. Create the folder under `apps/web/src/features/<name>/` (or
   `apps/admin/src/features/<name>/`) following the structure in
   `apps/web/src/features/README.md`.
2. Only export from `index.ts` — nothing outside the feature imports from its
   internal folders directly.

## Adding a new module (backend)

1. Folder already exists under `apps/api/src/modules/<name>/` — replace its
   `README.md` placeholder with the real `<name>.module.ts`, `.controller.ts`,
   `.service.ts`, `dto/`, `entities/`.
2. Register the module in `apps/api/src/app.module.ts`.
3. If it introduces a new role-gated admin capability, update
   `docs/srs.md` Section 6 (Role × Capability Matrix) in the same PR.

## Keeping the docs honest

`docs/architecture.md` and `docs/srs.md` are living documents. If a PR changes
a decision recorded there (a new open question gets resolved, a policy
changes), update the doc in the same PR — not as a follow-up "someday" task.

# Feature-based structure

Each folder here is a self-contained vertical slice — one per SRS module
(`auth`, `documents`, `content-library`, `lms`, `payments`).

The SRS also lists a Customer Dashboard module, but there is no `dashboard`
folder: everything it shows belongs to another feature (documents, courses,
purchase history), so `app/dashboard/page.tsx` composes those three and owns no
data of its own. A folder there would only have held re-exports.

Convention for every feature folder:

```
feature-name/
├── components/   # UI components used only by this feature
├── hooks/        # React hooks scoped to this feature
├── api/          # API client functions + React Query hooks for this feature's endpoints
├── types.ts      # types specific to this feature (cross-feature types live in @pratikar/types)
└── index.ts      # public barrel export — this is the ONLY thing other features
                   # or app/ routes are allowed to import from. Never reach into
                   # another feature's internal folders directly (e.g. never
                   # `import { X } from "@/features/documents/components/Foo"`
                   # from outside the documents feature).
```

Rules of thumb:

- `app/` (Next.js App Router) stays thin — pages compose features, they don't
  contain business logic.
- `shared/` is for things used by 3+ features. If only two features need
  something, duplication is cheaper than a premature shared abstraction.
- A feature is allowed to depend on `shared/` and `@pratikar/*` packages, but
  should avoid depending on another feature directly. If `payments` needs
  something from `documents`, that's usually a sign it belongs in `shared/`
  or as a prop passed down from the page.

// Shared design-system components used by both apps/web and apps/admin, so the
// two Next.js apps never drift visually.
//
// Everything here styles itself with the semantic tokens in
// packages/config/tailwind-preset.js — never a raw palette step or a hex. Both
// apps must include this package in their Tailwind `content` globs, or these
// components ship without their styles.
export * from "./components/primitives";
export * from "./components/DataTable";

// Mirrors docs/srs.md Section 2 (User Roles) and Section 6 (Role x Capability Matrix).
// Any change here should be reflected back in the SRS and vice versa.
//
// Values MUST stay identical to the `Role` enum in apps/api/prisma/schema.prisma.
// These strings travel from the DB row -> JWT claim -> RolesGuard comparison
// unchanged, so a mismatch here silently fails every role-gated route rather
// than erroring anywhere visible.
//
// Declared as a const object + union (not a TS `enum`) so the values stay plain
// string literals, structurally assignable to and from Prisma's generated
// `Role` union without casts at the persistence boundary.
export const Role = {
  CUSTOMER: "CUSTOMER",
  SUPPORT: "SUPPORT",
  CONTENT_MANAGER: "CONTENT_MANAGER",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

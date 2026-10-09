import type { AuthenticatedUser } from "@pratikar/types";
import { Role } from "@pratikar/types";

/**
 * Who may enter the admin panel.
 *
 * Lives here rather than in AuthProvider because it is a policy, not a React
 * concern, and because it is now applied in two places that must agree: when
 * someone signs in, and when a session is restored from the refresh cookie on
 * reload. A staff check on only one of those paths is a hole — the cookie path
 * is the one nobody clicks through to notice.
 *
 * A UX gate, not a security boundary. Every route behind it is independently
 * role-guarded on the API, which rejects a non-staff token no matter what the
 * browser chooses to render.
 *
 * Support is in: the requirements give Support staff the customer accounts
 * and orders, to answer tickets (docs/srs.md 2 and 6), and the API has
 * granted it read access to both all along. What each role may open once
 * inside is decided per section — see sections.ts.
 */
export const STAFF_ROLES: readonly Role[] = [
  Role.SUPPORT,
  Role.CONTENT_MANAGER,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];

export const isStaff = (user: AuthenticatedUser | null): boolean =>
  user !== null && STAFF_ROLES.includes(user.role);

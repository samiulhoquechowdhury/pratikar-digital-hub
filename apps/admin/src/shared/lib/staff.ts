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
 * NOTE: Role.SUPPORT is deliberately absent, matching the behaviour that was
 * here before. It is worth questioning — the API grants SUPPORT read access to
 * orders and users (see PaymentsController and UsersController), so a support
 * agent can be authorised for data they have no screen to view. Widening this
 * is an access-control decision, not a cleanup, so it is flagged rather than
 * taken: docs/TECH_DEBT.md.
 */
export const STAFF_ROLES: readonly Role[] = [
  Role.CONTENT_MANAGER,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];

export const isStaff = (user: AuthenticatedUser | null): boolean =>
  user !== null && STAFF_ROLES.includes(user.role);

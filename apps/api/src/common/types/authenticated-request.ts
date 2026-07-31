import type { Role } from "@pratikar/types";
import type { Request } from "express";

/**
 * Shape JwtAuthGuard attaches to the request. Keep in sync with the `sub`/`role`
 * claims signed in AuthService.verifyOtp and SessionService.rotateSession.
 */
export interface RequestUser {
  id: string;
  role: Role;
}

/**
 * Express request after JwtAuthGuard has run. `user` is optional because the
 * type also describes the request on unguarded routes — guards populate it,
 * they don't change the static type.
 */
export type AuthenticatedRequest = Request & { user?: RequestUser };

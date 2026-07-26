import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@pratikar/types";

import { ROLES_KEY } from "../decorators/roles.decorator";

// Pairs with @Roles(...) — enforces docs/srs.md Section 6 (Role x Capability
// Matrix). Requires an upstream auth guard (JWT verification) to have already
// attached `request.user` — that guard isn't built yet (pending Milestone 0
// completion of AuthModule's token-verification middleware/guard).
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    return requiredRoles.includes(user.role);
  }
}

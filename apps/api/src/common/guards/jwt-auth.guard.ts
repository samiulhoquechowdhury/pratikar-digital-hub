import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@pratikar/types";
import type { Request } from "express";

import type { AuthenticatedRequest } from "../types/authenticated-request";

const VALID_ROLES = new Set<string>(Object.values(Role));

// Runs BEFORE RolesGuard on any protected route — populates request.user
// from the access token so RolesGuard has something to check against.
// Usage: @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN) ...
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException("NO_ACCESS_TOKEN");

    let payload: { sub: string; role: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        role: string;
      }>(token);
    } catch {
      throw new UnauthorizedException("INVALID_OR_EXPIRED_TOKEN");
    }

    // A signed token still can't be trusted to carry a role we recognise — an
    // unknown value here would sail past RolesGuard's `includes` check as a
    // silent deny, or worse, linger as a stale role after the enum changes.
    if (!VALID_ROLES.has(payload.role)) {
      throw new UnauthorizedException("INVALID_ROLE_CLAIM");
    }

    // Keep this shape in sync with the `sub`/`role` claims signed in
    // AuthService.verifyOtp and SessionService.rotateSession.
    request.user = { id: payload.sub, role: payload.role as Role };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) return undefined;
    return header.slice("Bearer ".length);
  }
}

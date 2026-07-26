import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

// Runs BEFORE RolesGuard on any protected route — populates request.user
// from the access token so RolesGuard has something to check against.
// Usage: @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN) ...
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException("NO_ACCESS_TOKEN");

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; role: string }>(token);
      // Keep this shape in sync with the `sub`/`role` claims signed in
      // AuthService.verifyOtp and SessionService.rotateSession.
      (request as Request & { user?: unknown }).user = { id: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException("INVALID_OR_EXPIRED_TOKEN");
    }
  }

  private extractToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) return undefined;
    return header.slice("Bearer ".length);
  }
}

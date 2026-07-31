import { createHash, randomBytes } from "node:crypto";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Role } from "@pratikar/types";

import { PrismaService } from "../../prisma/prisma.service";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async createSession(params: {
    userId: string;
    userAgent?: string;
    ip?: string;
  }): Promise<{ refreshToken: string }> {
    const refreshToken = randomBytes(48).toString("hex");

    await this.prisma.session.create({
      data: {
        userId: params.userId,
        refreshTokenHash: this.hash(refreshToken),
        userAgent: params.userAgent,
        ip: params.ip,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
      // Deliberately NOT revoking any existing session rows for this user —
      // multi-device login is the confirmed behavior (docs/srs.md 3.1).
    });

    return { refreshToken };
  }

  /**
   * Exchanges the refresh cookie for a fresh access token.
   *
   * The user is returned alongside it because this is how a browser restores a
   * session after a reload — the access token lives in memory only, so on
   * every page load the front end has nothing but the cookie and needs to know
   * who it belongs to. Sending the id back separately would only mean an
   * immediate second request for the same row.
   *
   * The role comes from the database on every rotation rather than being
   * carried over from the old token, so a revoked privilege takes effect
   * within the access token's lifetime instead of lasting 30 days.
   */
  async rotateSession(refreshToken: string): Promise<{
    accessToken: string;
    user: { id: string; name: string | null; role: Role };
  }> {
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: this.hash(refreshToken) },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("INVALID_REFRESH_TOKEN");
    }

    const accessToken = this.jwtService.sign(
      { sub: session.user.id, role: session.user.role },
      { expiresIn: "15m" },
    );

    return {
      accessToken,
      user: {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
      },
    };
  }

  async revoke(refreshToken: string, allDevices: boolean): Promise<void> {
    const tokenHash = this.hash(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
    });
    if (!session) return; // already gone — logout is idempotent

    if (allDevices) {
      await this.prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }
  }
}

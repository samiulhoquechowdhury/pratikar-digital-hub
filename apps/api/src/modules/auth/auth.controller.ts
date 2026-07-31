import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";

import { AuthService } from "./auth.service";
import { GoogleSignInDto } from "./dto/google-sign-in.dto";
import { OtpRequestDto } from "./dto/otp-request.dto";
import { OtpVerifyDto } from "./dto/otp-verify.dto";

// express types `Request.cookies` as `any`; read it through this instead so the
// refresh-token path stays type-checked. Populated by cookieParser() in main.ts.
const readRefreshTokenCookie = (req: Request): string | undefined => {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.refreshToken;
};

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Web: refresh token as an httpOnly cookie. Android: also present in the JSON
// body (see AuthService) for encrypted local storage there. Shared by every
// sign-in path so the two can't drift apart in security-relevant flags.
const setRefreshCookie = (res: Response, refreshToken: string): void => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Rate limited hard: this is the endpoint most vulnerable to abuse (SMS/email
  // bombing). Per-identifier + per-IP limiting happens inside AuthService;
  // this decorator is the coarse route-level backstop.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("otp/request")
  @HttpCode(200)
  async requestOtp(@Body() dto: OtpRequestDto): Promise<void> {
    await this.authService.requestOtp(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("otp/verify")
  @HttpCode(200)
  async verifyOtp(
    @Body() dto: OtpVerifyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(dto, {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    setRefreshCookie(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
      isNewUser: result.isNewUser,
    };
  }

  /**
   * "Sign in with Google". The body carries the ID token the browser got from
   * Google Identity Services — a JWT that only means anything to us because
   * it names our client id as its audience.
   *
   * Throttled like OTP verify: the token is unguessable, but this endpoint
   * does signature verification and a database write, and neither should be
   * available to an unauthenticated caller in unlimited quantity.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("google")
  @HttpCode(200)
  async google(
    @Body() dto: GoogleSignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.signInWithGoogle(dto.idToken, {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    setRefreshCookie(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
      isNewUser: result.isNewUser,
    };
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request) {
    return this.authService.refreshSession(readRefreshTokenCookie(req));
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Body("allDevices") allDevices: boolean, @Req() req: Request) {
    return this.authService.logout(readRefreshTokenCookie(req), allDevices);
  }
}

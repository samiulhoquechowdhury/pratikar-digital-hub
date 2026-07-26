import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";

import { AuthService } from "./auth.service";
import { OtpRequestDto } from "./dto/otp-request.dto";
import { OtpVerifyDto } from "./dto/otp-verify.dto";

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

    // Web: refresh token as httpOnly cookie. Android: also present in the
    // JSON body (see AuthService) for encrypted local storage there.
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
      user: result.user,
      isNewUser: result.isNewUser,
    };
  }

  @Post("refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request) {
    return this.authService.refreshSession(req.cookies?.refreshToken);
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@Body("allDevices") allDevices: boolean, @Req() req: Request) {
    return this.authService.logout(req.cookies?.refreshToken, allDevices);
  }
}

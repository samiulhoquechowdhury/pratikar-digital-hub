import { BadRequestException, GoneException, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "../../prisma/prisma.service";
import { UsersService } from "../users/users.service";
import { OtpRequestDto } from "./dto/otp-request.dto";
import { OtpVerifyDto } from "./dto/otp-verify.dto";
import { OtpService } from "./otp.service";
import { SessionService } from "./session.service";

// TODO: swap for real providers once wired up — MSG91 (SMS, pending client DLT
// registration) and Resend (email, no external dependency, can ship first).
interface OtpSender {
  send(identifier: string, code: string): Promise<void>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
  ) {}

  async requestOtp(dto: OtpRequestDto): Promise<void> {
    const code = this.otpService.generateCode();
    const codeHash = this.otpService.hash(code, dto.identifier);

    await this.prisma.otpRequest.create({
      data: {
        identifier: dto.identifier,
        channel: dto.channel,
        codeHash,
        expiresAt: new Date(Date.now() + this.otpService.ttlMs),
      },
    });

    // TODO: rate limit per-identifier and per-IP here (route-level @Throttle is
    // only a coarse backstop, per auth.controller.ts).

    await this.sendOtp(dto.channel, dto.identifier, code);
  }

  async verifyOtp(
    dto: OtpVerifyDto,
    context: { userAgent?: string; ip?: string },
  ) {
    // 1. Look up the active OtpRequest row (not expired, not consumed).
    const record = await this.prisma.otpRequest.findFirst({
      where: {
        identifier: dto.identifier,
        channel: dto.channel,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      throw new GoneException("OTP_EXPIRED_OR_NOT_FOUND");
    }

    // 2. Attempt cap checked BEFORE hash comparison — closes the timing
    // side-channel and forces a fresh /otp/request once exhausted.
    if (record.attempts >= this.otpService.maxAttempts) {
      await this.prisma.otpRequest.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
      throw new HttpException("TOO_MANY_ATTEMPTS", HttpStatus.TOO_MANY_REQUESTS);
    }

    // 3. Constant-time hash comparison.
    const isValid = this.otpService.verifyHash(dto.otp, dto.identifier, record.codeHash);

    if (!isValid) {
      await this.prisma.otpRequest.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException("INVALID_OTP"); // never reveal identifier validity
    }

    // 4. Atomic consume — single conditional UPDATE, not read-then-write, to
    // close the double-submit race (e.g. a double-tap on mobile).
    const consumed = await this.prisma.otpRequest.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (consumed.count === 0) {
      throw new BadRequestException("INVALID_OTP");
    }

    // 5. Resolve or create the user — first successful OTP verify IS signup.
    const { user, isNewUser } = await this.usersService.findOrCreateByIdentifier(
      dto.identifier,
      dto.channel,
    );

    // 6. Issue tokens. Access token short-lived JWT; refresh token opaque,
    // stored hashed, multi-device-safe (session created, none revoked).
    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: "15m" },
    );
    const { refreshToken } = await this.sessionService.createSession({
      userId: user.id,
      userAgent: context.userAgent,
      ip: context.ip,
    });

    return { accessToken, refreshToken, user, isNewUser };
  }

  async refreshSession(refreshToken: string | undefined) {
    if (!refreshToken) throw new BadRequestException("NO_REFRESH_TOKEN");
    return this.sessionService.rotateSession(refreshToken);
  }

  async logout(refreshToken: string | undefined, allDevices: boolean) {
    if (refreshToken) await this.sessionService.revoke(refreshToken, allDevices);
  }

  private async sendOtp(channel: "email" | "sms", identifier: string, code: string) {
    const sender: OtpSender = {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      send: async (_id, _c) => {
        // TODO: channel === "email" -> Resend ; channel === "sms" -> MSG91
      },
    };
    await sender.send(identifier, code);
  }
}


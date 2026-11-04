import {
  BadRequestException,
  GoneException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { normalizeIndianMobile, type Role } from "@pratikar/types";

import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SmsService } from "../notifications/sms.service";
import { UsersService } from "../users/users.service";

import { OtpRequestDto } from "./dto/otp-request.dto";
import { OtpVerifyDto } from "./dto/otp-verify.dto";
import { GoogleAuthService } from "./google-auth.service";
import { checkOtpRateLimit, OTP_RATE_LIMITED_MESSAGE } from "./otp-rate-limit";
import { OtpService } from "./otp.service";
import { SessionService } from "./session.service";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
    private readonly sessionService: SessionService,
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly smsService: SmsService,
  ) {}

  /**
   * The identifier as accounts are stored: an email lower-cased and trimmed,
   * a phone as "+91" and ten digits. Request and verify both go through
   * this, so a code sent to "98765 43210" verifies for "+919876543210".
   */
  private canonicalIdentifier(channel: "email" | "sms", raw: string): string {
    if (channel === "email") return raw.trim().toLowerCase();
    const phone = normalizeIndianMobile(raw);
    if (!phone) throw new BadRequestException("INVALID_PHONE");
    return phone;
  }

  async requestOtp(dto: OtpRequestDto, ip?: string): Promise<void> {
    const identifier = this.canonicalIdentifier(dto.channel, dto.identifier);
    // Before anything is written or sent. Every send costs money and lands in
    // someone's inbox, so the limit has to come first — a row created and
    // then rejected would still have consumed a slot in the window.
    await this.enforceOtpRateLimit(identifier, ip);

    const code = this.otpService.generateCode();
    const codeHash = this.otpService.hash(code, identifier);

    await this.prisma.otpRequest.create({
      data: {
        identifier,
        channel: dto.channel,
        codeHash,
        expiresAt: new Date(Date.now() + this.otpService.ttlMs),
        ip: ip ?? null,
      },
    });

    await this.sendOtp(dto.channel, identifier, code);
  }

  async verifyOtp(
    dto: OtpVerifyDto,
    context: { userAgent?: string; ip?: string },
  ) {
    const identifier = this.canonicalIdentifier(dto.channel, dto.identifier);
    // 1. Look up the active OtpRequest row (not expired, not consumed).
    const record = await this.prisma.otpRequest.findFirst({
      where: {
        identifier,
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
      throw new HttpException(
        "TOO_MANY_ATTEMPTS",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 3. Constant-time hash comparison.
    const isValid = this.otpService.verifyHash(
      dto.otp,
      identifier,
      record.codeHash,
    );

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
    const { user, isNewUser } =
      await this.usersService.findOrCreateByIdentifier(identifier, dto.channel);

    // 6. Issue tokens.
    return { ...(await this.issueSession(user, context)), isNewUser };
  }

  /**
   * Google sign-in. Deliberately joins the OTP flow at step 6: once Google has
   * verified the address, we know exactly what a correct OTP would have told
   * us, so the same account resolution and the same session are issued. No
   * second class of login, no separate token shape.
   */
  async signInWithGoogle(
    idToken: string,
    context: { userAgent?: string; ip?: string },
  ) {
    const profile = await this.googleAuthService.verify(idToken);

    const { user, isNewUser } =
      await this.usersService.findOrCreateByIdentifier(profile.email, "email", {
        name: profile.name,
      });

    return { ...(await this.issueSession(user, context)), isNewUser };
  }

  async refreshSession(refreshToken: string | undefined) {
    if (!refreshToken) throw new BadRequestException("NO_REFRESH_TOKEN");
    return this.sessionService.rotateSession(refreshToken);
  }

  async logout(refreshToken: string | undefined, allDevices: boolean) {
    if (refreshToken)
      await this.sessionService.revoke(refreshToken, allDevices);
  }

  /**
   * Access token is a short-lived JWT; the refresh token is opaque and stored
   * hashed. Creating a session never revokes the others, so signing in on a
   * phone doesn't sign you out on a laptop.
   */
  private async issueSession(
    user: { id: string; name: string | null; role: Role },
    context: { userAgent?: string; ip?: string },
  ) {
    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: "15m" },
    );
    const { refreshToken } = await this.sessionService.createSession({
      userId: user.id,
      userAgent: context.userAgent,
      ip: context.ip,
    });

    return { accessToken, refreshToken, user };
  }

  /**
   * Refuses a send that would exceed the limits in otp-rate-limit.ts.
   *
   * Counts rows rather than keeping a counter in Redis: OtpRequest already
   * records every request, the table is indexed for exactly these two
   * windows, and Postgres is shared across instances — where the in-memory
   * route throttle is not. OTP volume is low by nature, so a query here costs
   * nothing worth optimising.
   *
   * The identifier is rate limited whether or not an account exists for it.
   * Anything else would turn this endpoint into an account-existence oracle.
   */
  private async enforceOtpRateLimit(
    identifier: string,
    ip?: string,
  ): Promise<void> {
    const since = new Date(Date.now() - 3_600_000);

    const [forIdentifier, forIp] = await Promise.all([
      this.prisma.otpRequest.findMany({
        where: { identifier, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      ip
        ? this.prisma.otpRequest.findMany({
            where: { ip, createdAt: { gte: since } },
            select: { createdAt: true },
          })
        : Promise.resolve([]),
    ]);

    const decision = checkOtpRateLimit(
      {
        identifierTimestamps: forIdentifier.map((r) => r.createdAt),
        ipTimestamps: forIp.map((r) => r.createdAt),
      },
      new Date(),
    );
    if (decision.allowed) return;

    // Logged with the reason, which the caller is deliberately not told —
    // an operator investigating abuse needs to know which limit fired.
    this.logger.warn(
      `OTP rate limit hit (${decision.reason}) for ${identifier}` +
        (ip ? ` from ${ip}` : ""),
    );

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: OTP_RATE_LIMITED_MESSAGE,
        retryAfterSeconds: decision.retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  /**
   * Delivers the code. A phone gets it by SMS through MSG91, from the
   * DLT-registered "login-otp" template; an email (the admin panel's staff
   * login) through Resend.
   *
   * Sent directly, not through the notification queue: the person is
   * waiting on this screen, and a send that fails has to say so now rather
   * than retry in the background. Outside production, with MSG91 not set
   * up, the code goes to the log so sign-in can still be tested; in
   * production that would be a code nobody receives, so it refuses.
   */
  private async sendOtp(
    channel: "email" | "sms",
    identifier: string,
    code: string,
  ) {
    const minutes = Math.round(this.otpService.ttlMs / 60_000);
    if (channel === "sms") {
      if (!this.smsService.canSend("login-otp")) {
        if (process.env.NODE_ENV === "production") {
          this.logger.error(
            "Phone sign-in attempted but MSG91_API_KEY / MSG91_TEMPLATE_LOGIN_OTP are not set.",
          );
          throw new ServiceUnavailableException("SMS_NOT_CONFIGURED");
        }
        this.logger.warn(
          `MSG91 not configured — sign-in code for ${identifier}: ${code}`,
        );
        return;
      }
      try {
        await this.smsService.send(identifier, "login-otp", {
          otp: code,
          minutes: String(minutes),
        });
      } catch (error) {
        this.logger.error(
          `Sign-in SMS to ${identifier.slice(0, 6)}… failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        throw new ServiceUnavailableException("OTP_SEND_FAILED");
      }
      return;
    }
    await this.notificationsService.sendEmail(
      identifier,
      "Your Pratikar Digital Hub verification code",
      `<p>Your verification code is <strong>${code}</strong>. It expires in ${minutes} minutes.</p>`,
    );
  }
}

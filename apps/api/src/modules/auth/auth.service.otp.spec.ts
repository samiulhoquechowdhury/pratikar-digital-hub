import {
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import { normalizeIndianMobile } from "@pratikar/types";

import type { PrismaService } from "../../prisma/prisma.service";
import type { NotificationsService } from "../notifications/notifications.service";
import type { SmsService } from "../notifications/sms.service";
import type { UsersService } from "../users/users.service";

import { AuthService } from "./auth.service";
import type { GoogleAuthService } from "./google-auth.service";
import { OtpService } from "./otp.service";
import type { SessionService } from "./session.service";

const build = (sms: { canSend: boolean; send?: jest.Mock }) => {
  const prisma = {
    otpRequest: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({}),
    },
  };
  const smsService = {
    canSend: jest.fn().mockReturnValue(sms.canSend),
    send: sms.send ?? jest.fn().mockResolvedValue(undefined),
  };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    {} as UsersService,
    new OtpService(),
    {} as SessionService,
    {} as JwtService,
    { sendEmail: jest.fn() } as unknown as NotificationsService,
    {} as GoogleAuthService,
    smsService as unknown as SmsService,
  );
  return { service, prisma, smsService };
};

describe("normalizeIndianMobile", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["98765 43210", "+919876543210"],
    ["+91-98765-43210", "+919876543210"],
    ["919876543210", "+919876543210"],
    ["09876543210", "+919876543210"],
  ])("reads %s as one account", (typed, stored) => {
    expect(normalizeIndianMobile(typed)).toBe(stored);
  });

  it.each(["12345", "5876543210", "+1 415 555 0100", "abc"])(
    "refuses %s",
    (typed) => {
      expect(normalizeIndianMobile(typed)).toBeNull();
    },
  );
});

describe("AuthService — phone sign-in codes", () => {
  const env = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = env;
  });

  it("stores and texts the code under the normalised number", async () => {
    const { service, prisma, smsService } = build({ canSend: true });
    await service.requestOtp({ identifier: "98765 43210", channel: "sms" });

    const [stored] = prisma.otpRequest.create.mock.calls[0] as [
      { data: { identifier: string } },
    ];
    expect(stored.data.identifier).toBe("+919876543210");
    const [to, template, variables] = smsService.send.mock.calls[0] as [
      string,
      string,
      { otp: string },
    ];
    expect([to, template]).toEqual(["+919876543210", "login-otp"]);
    expect(variables.otp).toMatch(/^\d{6}$/);
  });

  it("refuses a number that isn't an Indian mobile, before anything is stored", async () => {
    const { service, prisma } = build({ canSend: true });
    await expect(
      service.requestOtp({ identifier: "12345", channel: "sms" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.otpRequest.create).not.toHaveBeenCalled();
  });

  it("says so when MSG91 refuses, instead of leaving someone waiting", async () => {
    const { service } = build({
      canSend: true,
      send: jest.fn().mockRejectedValue(new Error("401")),
    });
    await expect(
      service.requestOtp({ identifier: "9876543210", channel: "sms" }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("in production, refuses rather than send nothing when MSG91 isn't set up", async () => {
    process.env.NODE_ENV = "production";
    const { service } = build({ canSend: false });
    await expect(
      service.requestOtp({ identifier: "9876543210", channel: "sms" }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("outside production, without MSG91, still lets sign-in be tested", async () => {
    process.env.NODE_ENV = "development";
    const { service, smsService } = build({ canSend: false });
    await expect(
      service.requestOtp({ identifier: "9876543210", channel: "sms" }),
    ).resolves.toBeUndefined();
    expect(smsService.send).not.toHaveBeenCalled();
  });
});

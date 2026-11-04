import type { Request, Response } from "express";

import { AuthController } from "./auth.controller";
import type { AuthService } from "./auth.service";

const session = {
  accessToken: "access",
  refreshToken: "refresh",
  user: { id: "u1" },
  isNewUser: false,
};

const build = () => {
  const authService = {
    verifyOtp: jest.fn().mockResolvedValue(session),
    signInWithGoogle: jest.fn().mockResolvedValue(session),
    refreshSession: jest.fn().mockResolvedValue({ accessToken: "next" }),
    logout: jest.fn().mockResolvedValue(undefined),
  };
  return {
    controller: new AuthController(authService as unknown as AuthService),
    authService,
  };
};

const request = (
  headers: Record<string, string> = {},
  cookies: Record<string, string> = {},
) => ({ headers, cookies, ip: "127.0.0.1" }) as unknown as Request;
const cookie = jest.fn();
const response = () => ({ cookie }) as unknown as Response;

const otp = { identifier: "a@b.co", channel: "email" as const, otp: "123456" };

describe("AuthController — the Android app's session", () => {
  it("keeps the refresh token out of the website's response body", async () => {
    const { controller } = build();
    const res = response();
    const body = await controller.verifyOtp(otp, request(), res);

    expect(body).not.toHaveProperty("refreshToken");
    expect(cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh",
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it("hands the app its refresh token, which has no cookie jar", async () => {
    const { controller } = build();
    const app = request({ "x-pratikar-client": "android" });

    expect(await controller.verifyOtp(otp, app, response())).toMatchObject({
      refreshToken: "refresh",
    });
    expect(
      await controller.google({ idToken: "t" }, app, response()),
    ).toMatchObject({ refreshToken: "refresh" });
  });

  it("refreshes from the body when there's no cookie", async () => {
    const { controller, authService } = build();
    await controller.refresh({ refreshToken: "from-app" }, request());
    expect(authService.refreshSession).toHaveBeenCalledWith("from-app");
  });

  it("prefers the cookie when both are sent", async () => {
    const { controller, authService } = build();
    await controller.refresh(
      { refreshToken: "from-body" },
      request({}, { refreshToken: "from-cookie" }),
    );
    expect(authService.refreshSession).toHaveBeenCalledWith("from-cookie");
  });

  it("signs the app out with the token it sends", async () => {
    const { controller, authService } = build();
    await controller.logout({ refreshToken: "from-app" }, request());
    expect(authService.logout).toHaveBeenCalledWith("from-app", false);
  });
});

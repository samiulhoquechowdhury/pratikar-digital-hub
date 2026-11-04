import type { PrismaService } from "../../prisma/prisma.service";

import { AppPushService } from "./app-push.service";

const build = (tokens: { id: string; token: string }[]) => {
  const prisma = {
    appPushToken: {
      findMany: jest.fn().mockResolvedValue(tokens),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      upsert: jest.fn().mockResolvedValue({}),
    },
  };
  return {
    service: new AppPushService(prisma as unknown as PrismaService),
    prisma,
  };
};

const answer = (tickets: unknown[], ok = true) =>
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve({ data: tickets }),
  } as Response);

const message = {
  title: "Ready",
  body: "Your document is ready",
  href: "/dashboard/documents/d1",
};

afterEach(() => jest.restoreAllMocks());

describe("AppPushService", () => {
  it("sends nothing to someone without the app", async () => {
    const { service } = build([]);
    const fetchSpy = answer([]);
    expect(await service.sendToUser("u1", message)).toBe(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends the website path along, for the app to open", async () => {
    const { service } = build([{ id: "t1", token: "ExponentPushToken[a]" }]);
    const fetchSpy = answer([{ status: "ok" }]);

    expect(await service.sendToUser("u1", message)).toBe(1);
    const body = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string) as {
      to: string;
      data: unknown;
    }[];
    expect(body[0]).toMatchObject({
      to: "ExponentPushToken[a]",
      data: { href: "/dashboard/documents/d1" },
    });
  });

  it("forgets a phone that uninstalled the app", async () => {
    const { service, prisma } = build([
      { id: "t1", token: "ExponentPushToken[a]" },
      { id: "t2", token: "ExponentPushToken[b]" },
    ]);
    answer([
      { status: "ok" },
      { status: "error", details: { error: "DeviceNotRegistered" } },
    ]);

    expect(await service.sendToUser("u1", message)).toBe(1);
    expect(prisma.appPushToken.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["t2"] } },
    });
  });

  it("throws for a retry only when nothing got through", async () => {
    const { service } = build([{ id: "t1", token: "ExponentPushToken[a]" }]);
    answer([], false);
    await expect(service.sendToUser("u1", message)).rejects.toThrow(
      /failed for all 1 devices/,
    );
  });

  it("re-registering a phone moves it to the new account", async () => {
    const { service, prisma } = build([]);
    await service.register("u2", "ExponentPushToken[a]", "android");
    expect(prisma.appPushToken.upsert).toHaveBeenCalledWith({
      where: { token: "ExponentPushToken[a]" },
      create: {
        userId: "u2",
        token: "ExponentPushToken[a]",
        platform: "android",
      },
      update: { userId: "u2", platform: "android" },
    });
  });
});

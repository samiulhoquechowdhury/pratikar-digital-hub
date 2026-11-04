import type { PrismaService } from "../../prisma/prisma.service";
import type { AuditService } from "../audit/audit.service";

import { IntegrationsService } from "./integrations.service";

const build = () => {
  const rows = new Map<string, { key: string; ciphertext: string }>();
  const prisma = {
    integrationSecret: {
      findMany: jest.fn(() => Promise.resolve([...rows.values()])),
      upsert: jest.fn(
        ({ create }: { create: { key: string; ciphertext: string } }) => {
          rows.set(create.key, create);
          return Promise.resolve();
        },
      ),
      deleteMany: jest.fn(({ where }: { where: { key: string } }) => {
        rows.delete(where.key);
        return Promise.resolve();
      }),
    },
  };
  const audit = { record: jest.fn() };
  const service = new IntegrationsService(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );
  return { service, rows, audit };
};

describe("IntegrationsService", () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it("uses the server's value until one is saved, then the saved one", async () => {
    process.env.RESEND_API_KEY = "re_from_env";
    const { service } = build();
    expect(service.get("RESEND_API_KEY")).toBe("re_from_env");
    expect(service.source("RESEND_API_KEY")).toBe("server");

    await service.set("RESEND_API_KEY", "re_from_admin", "admin-1");
    expect(service.get("RESEND_API_KEY")).toBe("re_from_admin");
    expect(service.source("RESEND_API_KEY")).toBe("admin");

    await service.clear("RESEND_API_KEY", "admin-1");
    expect(service.get("RESEND_API_KEY")).toBe("re_from_env");
  });

  it("stores keys encrypted, and reads them back after a restart", async () => {
    const { service, rows } = build();
    await service.set("RAZORPAY_KEY_SECRET", "super-secret-value", "admin-1");
    const stored = rows.get("RAZORPAY_KEY_SECRET")!.ciphertext;
    expect(stored).not.toContain("super-secret");

    const fresh = new IntegrationsService(
      {
        integrationSecret: {
          findMany: () => Promise.resolve([...rows.values()]),
        },
      } as never,
      {} as never,
    );
    await fresh.onModuleInit();
    fresh.onModuleDestroy();
    expect(fresh.get("RAZORPAY_KEY_SECRET")).toBe("super-secret-value");
  });

  it("never shows a secret back, only its last four characters", async () => {
    const { service } = build();
    await service.set("ANTHROPIC_API_KEY", "sk-ant-abcdefgh1234", "admin-1");
    await service.set("RAZORPAY_KEY_ID", "rzp_test_PUBLIC", "admin-1");
    const fields = service.list().flatMap((i) => i.fields);
    expect(fields.find((f) => f.key === "ANTHROPIC_API_KEY")!.preview).toBe(
      "••••1234",
    );
    expect(fields.find((f) => f.key === "RAZORPAY_KEY_ID")!.preview).toBe(
      "rzp_test_PUBLIC",
    );
  });

  it("records that a key changed, never the key", async () => {
    const { service, audit } = build();
    await service.set("MSG91_API_KEY", "msg91-secret", "admin-1");
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain(
      "msg91-secret",
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: "MSG91_API_KEY",
        actorUserId: "admin-1",
      }),
    );
  });

  it("refuses to save in production without an encryption key", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.INTEGRATIONS_ENCRYPTION_KEY;
    const { service } = build();
    await expect(service.set("MSG91_API_KEY", "x", "admin-1")).rejects.toThrow(
      "ENCRYPTION_KEY_NOT_SET",
    );
  });

  it("refuses names it doesn't know", async () => {
    const { service } = build();
    await expect(service.set("DATABASE_URL", "x", "admin-1")).rejects.toThrow(
      "UNKNOWN_SETTING",
    );
  });
});

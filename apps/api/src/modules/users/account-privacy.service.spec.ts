import { ConflictException, ForbiddenException } from "@nestjs/common";

import type { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

import { AccountPrivacyService } from "./account-privacy.service";

const CUSTOMER = {
  id: "u1",
  role: "CUSTOMER",
  email: "asha@example.com",
  phone: "+919876543210",
  deletedAt: null,
};

/** A prisma double whose transaction runs against the same object. */
function build({
  user = CUSTOMER,
  activeReviews = 0,
  pendingPayments = 0,
  removeFails = false,
} = {}) {
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(user), update: jest.fn() },
    documentReview: {
      count: jest.fn().mockResolvedValue(activeReviews),
      updateMany: jest.fn(),
    },
    order: { count: jest.fn().mockResolvedValue(pendingPayments) },
    generatedDocument: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "d1",
          fileUrl: "documents/d1.docx",
          pdfFileUrl: "documents/d1.pdf",
          reviews: [
            {
              id: "r1",
              reviewedFileUrl: "reviews/r1/x.docx",
              reviewedPdfUrl: "reviews/r1/x.pdf",
            },
          ],
        },
        // A row pointing outside the customer's own files must never
        // cause a library form to be deleted.
        {
          id: "d2",
          fileUrl: "library/FORM.docx",
          pdfFileUrl: null,
          reviews: [],
        },
      ]),
      updateMany: jest.fn(),
    },
    session: { deleteMany: jest.fn() },
    pushSubscription: { deleteMany: jest.fn() },
    notification: { deleteMany: jest.fn() },
    chatbotConversation: { deleteMany: jest.fn() },
    otpRequest: { deleteMany: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  // The transaction runs its callback against the same double, so a write
  // made "inside" it is visible on the mocks above.
  const db = {
    ...prisma,
    $transaction: jest.fn((cb: (tx: typeof prisma) => unknown) => cb(prisma)),
  };
  const storage = {
    remove: jest.fn((_key: string) =>
      removeFails ? Promise.reject(new Error("r2 down")) : Promise.resolve(),
    ),
  };
  const service = new AccountPrivacyService(
    db as unknown as PrismaService,
    new AuditService(db as unknown as PrismaService),
    storage as never,
  );
  return { service, prisma, storage };
}

const argOf = <T>(mock: jest.Mock): T => (mock.mock.calls[0] as [T])[0];

describe("AccountPrivacyService.deleteAccount", () => {
  it("clears every personal field and marks the account deleted", async () => {
    const { service, prisma } = build();

    await service.deleteAccount("u1");

    const { data } = argOf<{ data: Record<string, unknown> }>(
      prisma.user.update,
    );
    expect(data).toMatchObject({
      name: null,
      email: null,
      phone: null,
      addressLine: null,
      city: null,
      stateCode: null,
      pincode: null,
    });
    expect(data.deletedAt).toBeInstanceOf(Date);
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
    });
    expect(prisma.otpRequest.deleteMany).toHaveBeenCalledWith({
      where: { identifier: { in: ["asha@example.com", "+919876543210"] } },
    });
  });

  it("empties the documents but keeps the rows orders point at", async () => {
    const { service, prisma } = build();

    await service.deleteAccount("u1");

    const { data } = argOf<{ data: Record<string, unknown> }>(
      prisma.generatedDocument.updateMany,
    );
    expect(data).toMatchObject({
      filledData: {},
      fileUrl: "",
      pdfFileUrl: null,
    });
  });

  it("deletes the customer's own files, and nothing from the library", async () => {
    const { service, storage } = build();

    await service.deleteAccount("u1");

    const removed = storage.remove.mock.calls.map(([key]) => key);
    expect(removed).toEqual(
      expect.arrayContaining([
        "documents/d1.docx",
        "documents/d1.pdf",
        "documents/d1/preview-1.png",
        "reviews/r1/x.docx",
        "reviews/r1/x.pdf",
      ]),
    );
    expect(removed).not.toContain("library/FORM.docx");
  });

  // Orders and invoices are the tax record.
  it("never touches orders or invoices", async () => {
    const { service, prisma } = build();

    await service.deleteAccount("u1");

    expect(Object.keys(prisma.order)).toEqual(["count"]);
  });

  it("records the erasure in the audit log", async () => {
    const { service, prisma } = build();

    await service.deleteAccount("u1");

    expect(
      argOf<{ data: { action: string } }>(prisma.auditLog.create).data.action,
    ).toBe("ACCOUNT_DELETED");
  });

  it("refuses a staff account", async () => {
    const { service, prisma } = build({ user: { ...CUSTOMER, role: "ADMIN" } });

    await expect(service.deleteAccount("u1")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("waits while an advocate is reviewing a paid document", async () => {
    const { service, prisma } = build({ activeReviews: 1 });

    await expect(service.deleteAccount("u1")).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("waits while a payment may still be confirmed", async () => {
    const { service } = build({ pendingPayments: 1 });

    await expect(service.deleteAccount("u1")).rejects.toThrow(
      "PAYMENT_IN_PROGRESS",
    );
  });

  // The account is erased either way; a leftover file is logged.
  it("still erases the account when a file delete fails", async () => {
    const { service, prisma } = build({ removeFails: true });

    await expect(service.deleteAccount("u1")).resolves.toBeUndefined();
    expect(prisma.user.update).toHaveBeenCalled();
  });
});

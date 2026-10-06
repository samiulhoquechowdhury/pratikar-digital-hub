import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Role } from "@pratikar/types";

import type { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

import { customDraftReviewPrice, documentTitle } from "./custom-draft";
import { DocumentsService } from "./documents.service";

/**
 * The first argument of a mock's nth call. Read back rather than matched with
 * expect.objectContaining, which is typed `any` and trips no-unsafe-assignment.
 */
const argOf = <T>(mock: jest.Mock, call = 0): T =>
  (mock.mock.calls[call] as [T])[0];

/** A service over a hand-built prisma double; returns its collaborators too. */
function build(prisma: Record<string, unknown>, aiConfigured = true) {
  const tx = {
    documentReview: prisma.documentReview,
    auditLog: { create: jest.fn() },
  };
  const db = {
    ...prisma,
    $transaction: jest.fn((cb: (client: unknown) => unknown) => cb(tx)),
  };
  const queue = { add: jest.fn() };
  const storage = {
    signUrl: jest.fn((key: string) => `signed:${key}`),
    upload: jest.fn(),
    read: jest.fn(),
  };
  const notifier = { notifyUser: jest.fn() };
  const service = new DocumentsService(
    db as unknown as PrismaService,
    new AuditService(db as unknown as PrismaService),
    { send: jest.fn(), sendToStaff: jest.fn() } as never,
    storage as never,
    queue as never,
    { reindex: jest.fn() } as never,
    { isConfigured: aiConfigured } as never,
    notifier as never,
  );
  return { service, queue, storage, notifier, db };
}

const brief = {
  documentType: "Leave and licence agreement",
  details: "Flat 4B, Kothrud, Pune. Licensor Asha Rao, licensee Vikram Sen.",
  stateCode: "27",
};

describe("custom drafts", () => {
  it("creates a CUSTOM document and queues the draft", async () => {
    const create = jest.fn().mockResolvedValue({ id: "doc-1" });
    const { service, queue } = build({
      generatedDocument: { count: jest.fn().mockResolvedValue(0), create },
    });

    await expect(service.draftCustom("u1", brief)).resolves.toEqual({
      id: "doc-1",
    });
    expect(argOf<{ data: object }>(create).data).toMatchObject({
      userId: "u1",
      kind: "CUSTOM",
      title: "Leave and licence agreement",
      fileUrl: "",
    });
    expect(queue.add).toHaveBeenCalledWith("draft", {
      generatedDocumentId: "doc-1",
    });
  });

  it("says so when no model is configured, before creating anything", async () => {
    const create = jest.fn();
    const { service } = build(
      { generatedDocument: { count: jest.fn(), create } },
      false,
    );

    await expect(service.draftCustom("u1", brief)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("caps drafts per day — each one is a paid model call", async () => {
    const { service } = build({
      generatedDocument: {
        count: jest.fn().mockResolvedValue(10),
        create: jest.fn(),
      },
    });

    await expect(service.draftCustom("u1", brief)).rejects.toBeInstanceOf(
      HttpException,
    );
  });

  const draftDoc = (over: Record<string, unknown> = {}) => ({
    id: "doc-1",
    userId: "u1",
    kind: "CUSTOM",
    fileUrl: "documents/doc-1.docx",
    draft: { title: "T", blocks: [] },
    revisionCount: 0,
    reviews: [],
    ...over,
  });

  it("queues a revision with the customer's instruction", async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const { service, queue } = build({
      generatedDocument: {
        findUnique: jest.fn().mockResolvedValue(draftDoc()),
        updateMany,
      },
    });

    await service.reviseCustom("doc-1", "u1", "  Make the deposit ₹50,000 ");

    expect(argOf<{ where: object }>(updateMany).where).toMatchObject({
      revisionCount: 0,
    });
    expect(queue.add).toHaveBeenCalledWith("draft", {
      generatedDocumentId: "doc-1",
      instruction: "Make the deposit ₹50,000",
    });
  });

  // The advocate is working from this draft; it must hold still.
  it("refuses a revision once a review has been bought", async () => {
    const { service, queue } = build({
      generatedDocument: {
        findUnique: jest
          .fn()
          .mockResolvedValue(draftDoc({ reviews: [{ status: "QUEUED" }] })),
        updateMany: jest.fn(),
      },
    });

    await expect(
      service.reviseCustom("doc-1", "u1", "x"),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("refuses a revision past the limit", async () => {
    const { service } = build({
      generatedDocument: {
        findUnique: jest.fn().mockResolvedValue(draftDoc({ revisionCount: 5 })),
        updateMany: jest.fn(),
      },
    });

    await expect(
      service.reviseCustom("doc-1", "u1", "x"),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("never sells the unreviewed draft as a download", async () => {
    const update = jest.fn();
    const { service } = build({
      generatedDocument: {
        findUnique: jest.fn().mockResolvedValue(draftDoc({ status: "PAID" })),
        update,
      },
    });

    await expect(
      service.consumeDownload("doc-1", "u1", Role.CUSTOMER),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(update).not.toHaveBeenCalled();
  });
});

describe("returning a review", () => {
  const review = (over: Record<string, unknown> = {}) => ({
    id: "rev-1",
    status: "IN_REVIEW",
    assignedToUserId: "adv-1",
    requestedByUserId: "u1",
    generatedDocumentId: "doc-1",
    generatedDocument: {
      fileUrl: "documents/doc-1.docx",
      pdfFileUrl: "documents/doc-1.pdf",
      title: "Leave and licence agreement",
      template: null,
    },
    requestedBy: { name: "Asha" },
    ...over,
  });

  const buildReturn = (row = review()) => {
    const update = jest
      .fn()
      .mockImplementation(({ data }: { data: object }) =>
        Promise.resolve({ ...row, ...data }),
      );
    return {
      update,
      ...build({
        documentReview: {
          findUnique: jest.fn().mockResolvedValue(row),
          update,
        },
      }),
    };
  };

  it("approving as drafted hands over the drafted files", async () => {
    const { service, update } = buildReturn();

    await service.returnReview("rev-1", { approveAsDrafted: true }, "adv-1");

    const call = argOf<{ where: object; data: object }>(update);
    expect(call.where).toEqual({ id: "rev-1" });
    expect(call.data).toMatchObject({
      status: "RETURNED",
      reviewedFileUrl: "documents/doc-1.docx",
      reviewedPdfUrl: "documents/doc-1.pdf",
    });
  });

  // A typed key could point at any object in the bucket.
  it("only accepts a file uploaded for this review", async () => {
    const { service, update } = buildReturn();

    await expect(
      service.returnReview(
        "rev-1",
        { reviewedFileUrl: "documents/someone-else.docx" },
        "adv-1",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it("uses an uploaded PDF as its own PDF", async () => {
    const { service, update } = buildReturn();

    await service.returnReview(
      "rev-1",
      { reviewedFileUrl: "reviews/rev-1/reviewed-1.pdf" },
      "adv-1",
    );

    expect(argOf<{ data: object }>(update).data).toMatchObject({
      reviewedFileUrl: "reviews/rev-1/reviewed-1.pdf",
      reviewedPdfUrl: "reviews/rev-1/reviewed-1.pdf",
    });
  });

  it("refuses a reviewer who didn't claim it", async () => {
    const { service } = buildReturn();

    await expect(
      service.returnReview("rev-1", { approveAsDrafted: true }, "adv-2"),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("tells the customer on every channel that it's ready", async () => {
    const { service, notifier } = buildReturn();

    await service.returnReview("rev-1", { approveAsDrafted: true }, "adv-1");

    const [userId, message] = notifier.notifyUser.mock.calls[0] as [
      string,
      { title: string; href: string; email: { type: string }; sms: object },
    ];
    expect(userId).toBe("u1");
    expect(message.title).toBe("Your document is ready to download");
    expect(message.href).toBe("/dashboard/documents/doc-1");
    expect(message.email.type).toBe("review-ready");
    expect(message.sms).toEqual({
      template: "document-ready",
      variables: { title: "Leave and licence agreement" },
    });
  });
});

describe("the reviewed download", () => {
  it("signs the reviewed file and its PDF for the owner", async () => {
    const findFirst = jest.fn().mockResolvedValue({
      reviewedFileUrl: "reviews/rev-1/r.docx",
      reviewedPdfUrl: "reviews/rev-1/r.pdf",
    });
    const { service } = build({ documentReview: { findFirst } });

    await expect(service.reviewedDownload("doc-1", "u1")).resolves.toEqual({
      fileUrl: "signed:reviews/rev-1/r.docx",
      pdfUrl: "signed:reviews/rev-1/r.pdf",
    });
    // Scoped to the owner in the query itself.
    expect(argOf<{ where: object }>(findFirst).where).toMatchObject({
      status: "RETURNED",
      generatedDocument: { userId: "u1" },
    });
  });
});

describe("custom draft helpers", () => {
  it("prices the review from the environment, never at zero", () => {
    expect(customDraftReviewPrice("79900")).toBe(79_900);
    expect(customDraftReviewPrice("0")).toBe(49_900);
    expect(customDraftReviewPrice("abc")).toBe(49_900);
    expect(customDraftReviewPrice(undefined)).toBe(49_900);
  });

  it("titles a document from its template, else its draft", () => {
    expect(documentTitle({ template: { title: "Rent" }, title: null })).toBe(
      "Rent",
    );
    expect(documentTitle({ template: null, title: "Will" })).toBe("Will");
    expect(documentTitle({ template: null, title: null })).toBe(
      "Custom document",
    );
  });
});

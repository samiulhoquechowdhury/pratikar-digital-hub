import type { MyDocument } from "../api/documentsApi";

import { documentStage } from "./documentStage";

const doc = (patch: Partial<MyDocument> = {}): MyDocument => ({
  id: "d1",
  kind: "CUSTOM",
  templateId: null,
  title: "Will",
  status: "GENERATED",
  createdAt: "2026-10-01T00:00:00Z",
  downloadedAt: null,
  ready: true,
  filledData: {},
  priceInPaise: null,
  reviewPriceInPaise: 49_900,
  template: null,
  brief: null,
  summary: null,
  missingDetails: [],
  basedOn: [],
  revisionCount: 0,
  draftError: null,
  review: null,
  ...patch,
});

const review = (status: "QUEUED" | "IN_REVIEW" | "RETURNED") => ({
  id: "r1",
  status,
  notes: null,
  createdAt: "2026-10-01T00:00:00Z",
  returnedAt: null,
  hasPdf: true,
});

describe("documentStage — custom drafts", () => {
  it("is drafting until the file exists", () => {
    expect(documentStage(doc({ ready: false })).label).toBe("Drafting…");
    expect(documentStage(doc({ ready: false })).inProgress).toBe(true);
  });

  it("says when drafting failed, and that it's the customer's move", () => {
    const s = documentStage(doc({ ready: false, draftError: "No" }));
    expect(s).toMatchObject({ tone: "danger", needsAction: true });
  });

  it("asks for a review once drafted", () => {
    expect(documentStage(doc()).label).toBe("Draft ready · send for review");
  });

  it("follows the review through to the download", () => {
    expect(documentStage(doc({ review: review("QUEUED") })).label).toBe(
      "Queued for review",
    );
    expect(documentStage(doc({ review: review("IN_REVIEW") })).label).toBe(
      "Advocate reviewing",
    );
    expect(documentStage(doc({ review: review("RETURNED") })).label).toBe(
      "Ready to download",
    );
  });
});

describe("documentStage — template documents", () => {
  const tpl = (patch: Partial<MyDocument> = {}) =>
    doc({ kind: "TEMPLATE", templateId: "t1", ...patch });

  it("follows payment and download", () => {
    expect(documentStage(tpl()).label).toBe("Awaiting payment");
    expect(documentStage(tpl({ status: "PAID" })).label).toBe(
      "Ready to download",
    );
    expect(documentStage(tpl({ status: "DOWNLOADED" })).label).toBe(
      "Downloaded",
    );
  });

  // The review is the newer news.
  it("lets an active review outrank the download state", () => {
    expect(
      documentStage(tpl({ status: "DOWNLOADED", review: review("IN_REVIEW") }))
        .label,
    ).toBe("Advocate reviewing");
  });
});

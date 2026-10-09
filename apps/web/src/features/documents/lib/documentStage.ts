import type { MyDocument } from "../api/documentsApi";

export type StageTone = "warning" | "success" | "neutral" | "brand" | "danger";

export interface DocumentStage {
  /** What the customer reads on the badge. */
  label: string;
  tone: StageTone;
  /** Waiting on the customer — counted on the dashboard. */
  needsAction: boolean;
  /** Something is happening on our side; worth checking back on its own. */
  inProgress: boolean;
}

const stage = (
  label: string,
  tone: StageTone,
  needsAction = false,
  inProgress = false,
): DocumentStage => ({ label, tone, needsAction, inProgress });

/**
 * Where a document is, in the customer's terms — one answer from its kind,
 * status, file and latest review.
 *
 * A custom draft's path is draft → advocate review → download, and the
 * review is the purchase. A template document is paid for and downloaded,
 * with a review on the side; an active or returned review outranks the
 * download state, because it's the newer news.
 */
export function documentStage(doc: MyDocument): DocumentStage {
  const review = doc.review;

  if (doc.kind === "CUSTOM") {
    if (!doc.ready) {
      return doc.draftError
        ? stage("Couldn't draft", "danger", true)
        : stage(
            doc.revisionCount > 0 ? "Revising…" : "Drafting…",
            "brand",
            false,
            true,
          );
    }
    if (!review) return stage("Draft ready · send for review", "warning", true);
    if (review.status === "RETURNED")
      return stage("Ready to download", "success", true);
    return stage(
      review.status === "IN_REVIEW"
        ? "Advocate reviewing"
        : "Queued for review",
      "brand",
      false,
      true,
    );
  }

  if (!doc.ready) return stage("Preparing…", "brand", false, true);
  if (review?.status === "QUEUED" || review?.status === "IN_REVIEW") {
    return stage(
      review.status === "IN_REVIEW"
        ? "Advocate reviewing"
        : "Queued for review",
      "brand",
      false,
      true,
    );
  }
  if (review?.status === "RETURNED")
    return stage("Reviewed copy ready", "success", true);

  switch (doc.status) {
    case "GENERATED":
      return stage("Awaiting payment", "warning", true);
    case "PAID":
      return stage("Ready to download", "success", true);
    case "REFUNDED":
      return stage("Refunded", "neutral");
    default:
      return stage("Downloaded", "neutral");
  }
}

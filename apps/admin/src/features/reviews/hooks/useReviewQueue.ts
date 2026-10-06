"use client";

import { useCallback, useEffect, useState } from "react";

import {
  reviewsApi,
  type QueuedReview,
  type ReturnInput,
} from "../api/reviewsApi";

export function useReviewQueue() {
  const [reviews, setReviews] = useState<QueuedReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setReviews(await reviewsApi.listQueue());
      setError(null);
    } catch {
      setError("Couldn't load the review queue.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Claiming races by design: two reviewers can open the queue and click the
   * same row. The API's conditional update rejects the loser with
   * ALREADY_CLAIMED, so surface that and refresh rather than pretending it
   * worked.
   */
  const claim = async (id: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await reviewsApi.claim(id);
      await load();
    } catch (err) {
      setActionError(
        err instanceof Error && err.message.includes("ALREADY_CLAIMED")
          ? "Someone else claimed that review first."
          : "Couldn't claim that review.",
      );
      await load();
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Returns a review: uploads the reviewed file first when there is one,
   * then sends it back — which is what notifies the customer.
   */
  const returnReview = async (
    id: string,
    input: { file?: File; approveAsDrafted?: boolean; notes?: string },
  ) => {
    setBusyId(id);
    setActionError(null);
    try {
      const body: ReturnInput = { notes: input.notes };
      if (input.approveAsDrafted) {
        body.approveAsDrafted = true;
      } else if (input.file) {
        body.reviewedFileUrl = (
          await reviewsApi.uploadFile(id, input.file)
        ).key;
      }
      await reviewsApi.return(id, body);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setActionError(
        message.includes("WORD_OR_PDF_ONLY")
          ? "Upload a Word (.docx) or PDF file."
          : message.includes("FILE_TOO_LARGE") || message.includes("413")
            ? "That file is over 15 MB."
            : "Couldn't return that review.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return {
    reviews,
    isLoading,
    error,
    actionError,
    busyId,
    claim,
    returnReview,
    reload: load,
  };
}

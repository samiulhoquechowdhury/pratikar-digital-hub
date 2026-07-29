"use client";

import { useCallback, useEffect, useState } from "react";

import { reviewsApi, type QueuedReview } from "../api/reviewsApi";

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

  const returnReview = async (
    id: string,
    reviewedFileUrl: string,
    notes?: string,
  ) => {
    setBusyId(id);
    setActionError(null);
    try {
      await reviewsApi.return(id, reviewedFileUrl, notes);
      await load();
    } catch {
      setActionError("Couldn't return that review.");
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

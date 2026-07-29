"use client";

import { useState } from "react";

import { useReviewQueue } from "../hooks/useReviewQueue";

import { useAuth } from "@/shared/providers/AuthProvider";

function ReturnForm({
  reviewId,
  disabled,
  onSubmit,
}: {
  reviewId: string;
  disabled: boolean;
  onSubmit: (url: string, notes?: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(url.trim(), notes.trim() || undefined);
      }}
    >
      <label htmlFor={`url-${reviewId}`}>Reviewed file key</label>
      <input
        id={`url-${reviewId}`}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="documents/reviewed-xyz.docx"
      />
      <label htmlFor={`notes-${reviewId}`}>Notes (optional)</label>
      <textarea
        id={`notes-${reviewId}`}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button type="submit" disabled={disabled || !url.trim()}>
        Return to customer
      </button>
    </form>
  );
}

export function ReviewQueue() {
  const { user } = useAuth();
  const {
    reviews,
    isLoading,
    error,
    actionError,
    busyId,
    claim,
    returnReview,
  } = useReviewQueue();

  if (isLoading) return <p>Loading review queue…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (reviews.length === 0) return <p>Nothing in the queue.</p>;

  return (
    <div>
      {actionError && <p role="alert">{actionError}</p>}
      <ul>
        {reviews.map((review) => {
          const mine = review.assignedToUserId === user?.id;
          const claimedByOther = review.assignedToUserId !== null && !mine;

          return (
            <li key={review.id}>
              <h3>{review.generatedDocument.template.title}</h3>
              <p>
                {review.status} · requested{" "}
                {new Date(review.createdAt).toLocaleString()}
              </p>

              {review.status === "QUEUED" && (
                <button
                  type="button"
                  onClick={() => void claim(review.id)}
                  disabled={busyId === review.id}
                >
                  {busyId === review.id ? "Claiming…" : "Claim"}
                </button>
              )}

              {claimedByOther && <p>Claimed by another reviewer.</p>}

              {mine && review.status === "IN_REVIEW" && (
                <ReturnForm
                  reviewId={review.id}
                  disabled={busyId === review.id}
                  onSubmit={(url, notes) =>
                    void returnReview(review.id, url, notes)
                  }
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

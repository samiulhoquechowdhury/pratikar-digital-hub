"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Loading,
  Textarea,
} from "@pratikar/ui";
import { useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { useReviewQueue } from "../hooks/useReviewQueue";

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** How long a customer has been waiting — the number that decides priority. */
function waitingFor(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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
      className="max-w-prose space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(url.trim(), notes.trim() || undefined);
      }}
    >
      <Field
        label="Reviewed file key"
        htmlFor={`url-${reviewId}`}
        hint="The storage key of the marked-up file you've uploaded — not a URL."
      >
        <Input
          id={`url-${reviewId}`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="documents/reviewed-xyz.docx"
        />
      </Field>

      <Field label="Notes (optional)" htmlFor={`notes-${reviewId}`}>
        <Textarea
          id={`notes-${reviewId}`}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything the customer should read before signing."
        />
      </Field>

      <Button type="submit" disabled={disabled || !url.trim()}>
        Return to customer
      </Button>
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

  if (isLoading) return <Loading label="Loading review queue…" />;
  if (error) {
    return (
      <Alert tone="danger" role="alert">
        {error}
      </Alert>
    );
  }
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="Nothing in the queue"
        description="Documents appear here when a customer pays for a lawyer review."
      />
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <Alert tone="danger" role="alert">
          {actionError}
        </Alert>
      )}

      <ul className="space-y-4">
        {reviews.map((review) => {
          const mine = review.assignedToUserId === user?.id;
          const claimedByOther = review.assignedToUserId !== null && !mine;

          return (
            <li key={review.id}>
              <Card
                // The one you can act on gets the emphasis. On a shared queue
                // that's the difference between a work list and a wall of rows.
                className={`p-6 ${mine ? "border-brand-border ring-1 ring-brand-border" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base">
                      {review.generatedDocument.template.title}
                    </h3>
                    <p className="mt-1 text-sm text-ink-subtle">
                      Requested {formatWhen(review.createdAt)} ·{" "}
                      {waitingFor(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mine && <Badge tone="brand">Yours</Badge>}
                    <Badge
                      tone={review.status === "QUEUED" ? "warning" : "neutral"}
                    >
                      {review.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-5 border-t border-line pt-5">
                  {review.status === "QUEUED" && (
                    <>
                      <p className="mb-3 text-sm text-ink-muted">
                        Claiming assigns this to you so nobody duplicates the
                        work.
                      </p>
                      <Button
                        type="button"
                        onClick={() => void claim(review.id)}
                        disabled={busyId === review.id}
                      >
                        {busyId === review.id ? "Claiming…" : "Claim"}
                      </Button>
                    </>
                  )}

                  {claimedByOther && (
                    <Alert tone="info">
                      Claimed by another reviewer. Nothing for you to do here.
                    </Alert>
                  )}

                  {mine && review.status === "IN_REVIEW" && (
                    <ReturnForm
                      reviewId={review.id}
                      disabled={busyId === review.id}
                      onSubmit={(url, notes) =>
                        void returnReview(review.id, url, notes)
                      }
                    />
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

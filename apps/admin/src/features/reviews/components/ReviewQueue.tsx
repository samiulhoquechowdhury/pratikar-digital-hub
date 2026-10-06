"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  SkeletonList,
  Textarea,
} from "@pratikar/ui";
import { useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { reviewsApi, reviewTitle, type ReviewFiles } from "../api/reviewsApi";
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

/** The customer's document and what it was made from, loaded on request. */
function CaseFile({ reviewId }: { reviewId: string }) {
  const [files, setFiles] = useState<ReviewFiles | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  const open = () => {
    setState("loading");
    reviewsApi
      .files(reviewId)
      .then((result) => {
        setFiles(result);
        setState("idle");
      })
      .catch(() => setState("error"));
  };

  if (!files) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={open}
          loading={state === "loading"}
        >
          Open the document
        </Button>
        {state === "error" && (
          <Alert tone="danger">Couldn&apos;t load the document.</Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-card bg-surface-sunken p-4">
      <div className="flex flex-wrap gap-2">
        {files.docxUrl && (
          <a
            href={files.docxUrl}
            className="text-sm font-semibold text-primary underline"
          >
            Download Word
          </a>
        )}
        {files.pdfUrl && (
          <a
            href={files.pdfUrl}
            className="text-sm font-semibold text-primary underline"
          >
            Download PDF
          </a>
        )}
        <span className="text-xs text-ink-subtle">
          Links work for a few minutes.
        </span>
      </div>

      {files.brief && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            What the customer asked for
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {files.brief.documentType}
            {files.brief.stateCode ? ` · state ${files.brief.stateCode}` : ""}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {files.brief.details}
          </p>
        </div>
      )}

      {files.missingDetails.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Left blank in the draft
          </p>
          <ul className="mt-1 list-disc pl-5 text-sm text-ink">
            {files.missingDetails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {files.filledData && Object.keys(files.filledData).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            The customer&apos;s answers
          </p>
          <dl className="mt-1 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            {Object.entries(files.filledData).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-ink-muted">{key}</dt>
                <dd className="text-ink">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function ReturnForm({
  reviewId,
  disabled,
  onSubmit,
}: {
  reviewId: string;
  disabled: boolean;
  onSubmit: (input: {
    file?: File;
    approveAsDrafted?: boolean;
    notes?: string;
  }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const trimmed = () => notes.trim() || undefined;

  return (
    <form
      className="max-w-prose space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (file) onSubmit({ file, notes: trimmed() });
      }}
    >
      <Field
        label="Reviewed document"
        htmlFor={`file-${reviewId}`}
        hint="Your corrected Word (.docx) or PDF file, up to 15 MB. The customer downloads exactly this."
      >
        <input
          id={`file-${reviewId}`}
          type="file"
          accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-ink file:mr-3 file:rounded-control file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
        />
      </Field>

      <Field
        label="Notes for the customer (optional)"
        htmlFor={`notes-${reviewId}`}
      >
        <Textarea
          id={`notes-${reviewId}`}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What you changed, and anything to check before signing."
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={disabled || !file}>
          Upload and return to customer
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => onSubmit({ approveAsDrafted: true, notes: trimmed() })}
        >
          Approve draft as it is
        </Button>
      </div>
      <p className="text-xs text-ink-subtle">
        Returning tells the customer by email, SMS and notification that their
        document is ready to download.
      </p>
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

  if (isLoading)
    return <SkeletonList rows={5} label="Loading the review queue…" />;
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
        description="Documents appear here when a customer pays for an advocate review."
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
                    <h3 className="text-base">{reviewTitle(review)}</h3>
                    <p className="mt-1 text-sm text-ink-subtle">
                      Requested {formatWhen(review.createdAt)} ·{" "}
                      {waitingFor(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.generatedDocument.kind === "CUSTOM" && (
                      <Badge tone="neutral">AI draft</Badge>
                    )}
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
                        loading={busyId === review.id}
                        loadingLabel="Claiming…"
                      >
                        Claim
                      </Button>
                    </>
                  )}

                  {claimedByOther && (
                    <Alert tone="info">
                      Claimed by another reviewer. Nothing for you to do here.
                    </Alert>
                  )}

                  {mine && review.status === "IN_REVIEW" && (
                    <div className="space-y-5">
                      <CaseFile reviewId={review.id} />
                      <ReturnForm
                        reviewId={review.id}
                        disabled={busyId === review.id}
                        onSubmit={(input) =>
                          void returnReview(review.id, input)
                        }
                      />
                    </div>
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

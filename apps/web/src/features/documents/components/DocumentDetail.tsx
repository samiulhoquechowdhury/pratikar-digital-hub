"use client";

import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  Skeleton,
  Textarea,
} from "@pratikar/ui";
import {
  ArrowLeft,
  BadgeCheck,
  Download,
  FilePenLine,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PushOptIn } from "@/features/notifications";
import { BuyButton } from "@/features/payments";
import { Icon } from "@/shared/components/Icon";

import { documentsApi, type MyDocument } from "../api/documentsApi";
import { documentStage } from "../lib/documentStage";

import { DocumentPreview } from "./DocumentPreview";
import { GeneratedDocumentActions } from "./GeneratedDocumentActions";

/** Mirrors DRAFT_LIMITS.instruction in the API. */
const MAX_INSTRUCTION = 1000;

/** Checking back: quickly while the AI drafts, slowly while an advocate works. */
const DRAFTING_POLL_MS = 4000;
const REVIEW_POLL_MS = 30_000;

/**
 * One of the customer's documents, on its own page — where every
 * notification about it lands.
 *
 * The page follows the document through its stages: drafting, the free
 * preview (with changes, for a custom draft), the advocate review, and the
 * download. It checks back on its own while something is happening on our
 * side, so a customer who leaves it open sees it move.
 */
export function DocumentDetail({ documentId }: { documentId: string }) {
  const [doc, setDoc] = useState<MyDocument | null>(null);
  const [loadError, setLoadError] = useState<"missing" | "failed" | null>(null);

  const load = useCallback(async () => {
    try {
      setDoc(await documentsApi.getMine(documentId));
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error && error.message.includes("404")
          ? "missing"
          : "failed",
      );
    }
  }, [documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stage = doc ? documentStage(doc) : null;

  // Poll while something is happening on our side, at the pace it happens.
  useEffect(() => {
    if (!doc || !stage?.inProgress) return;
    const timer = window.setTimeout(
      () => void load(),
      doc.ready ? REVIEW_POLL_MS : DRAFTING_POLL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [doc, stage?.inProgress, load]);

  if (loadError === "missing") {
    return (
      <Alert tone="warning">
        We couldn&apos;t find that document in your account.{" "}
        <Link href="/dashboard/documents" className="font-semibold underline">
          See all your documents
        </Link>
      </Alert>
    );
  }
  if (loadError && !doc) {
    return (
      <Alert tone="danger" role="alert">
        Couldn&apos;t load this document. Please reload the page.
      </Alert>
    );
  }
  if (!doc || !stage) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-[28rem] w-full" />
      </div>
    );
  }

  const custom = doc.kind === "CUSTOM";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <Icon icon={ArrowLeft} size="xs" /> My documents
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-2xl">{doc.title}</h2>
            <p className="mt-1 text-sm text-ink-subtle">
              {custom ? "AI draft" : "From a template"} · started{" "}
              {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <Badge tone={stage.tone}>{stage.label}</Badge>
        </div>
      </div>

      {custom && <Steps doc={doc} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          {doc.ready ? (
            // Keyed on the revision, so a new draft loads fresh pages.
            <DocumentPreview
              key={doc.revisionCount}
              documentId={doc.id}
              title={doc.title}
            />
          ) : doc.draftError ? (
            <Card className="p-6">
              <Alert tone="danger">{doc.draftError}</Alert>
              <div className="mt-4">
                <ButtonLink href="/documents/custom" size="sm">
                  Start a new draft
                </ButtonLink>
              </div>
            </Card>
          ) : (
            <Drafting revising={doc.revisionCount > 0} />
          )}
        </div>

        <div className="space-y-4">
          {custom && doc.ready && doc.draftError && (
            <Alert tone="warning">{doc.draftError}</Alert>
          )}

          {custom && doc.ready && <DraftNotes doc={doc} />}

          {custom && doc.ready && !doc.review && (
            <ReviseBox doc={doc} onRevised={load} />
          )}

          {!custom && doc.ready && (
            <GeneratedDocumentActions
              documentId={doc.id}
              template={{
                title: doc.title,
                priceInPaise: doc.priceInPaise ?? 0,
                reviewPriceInPaise: doc.reviewPriceInPaise,
              }}
              initialStatus={doc.status}
              showReview={false}
            />
          )}

          {doc.ready && <ReviewPanel doc={doc} onChange={load} />}
        </div>
      </div>
    </div>
  );
}

/** Drafted → reviewed → downloaded, with where this document is now. */
function Steps({ doc }: { doc: MyDocument }) {
  const current = !doc.ready ? 0 : doc.review?.status === "RETURNED" ? 2 : 1;
  const steps = [
    { icon: Sparkles, label: "AI draft" },
    { icon: BadgeCheck, label: "Advocate review" },
    { icon: Download, label: "Download" },
  ];
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((step, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <li
            key={step.label}
            aria-current={isCurrent ? "step" : undefined}
            className={`flex items-center gap-2 rounded-card border px-3 py-2.5 text-sm ${
              isCurrent
                ? "border-brand-border bg-brand-subtle font-semibold text-ink"
                : isDone
                  ? "border-line bg-surface text-ink"
                  : "border-line bg-surface text-ink-subtle"
            }`}
          >
            <Icon
              icon={step.icon}
              size="sm"
              className={
                isDone ? "text-success-text" : isCurrent ? "text-gold-ink" : ""
              }
            />
            <span className="truncate">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Drafting({ revising }: { revising: boolean }) {
  return (
    <Card className="grid min-h-[24rem] place-items-center p-8 text-center">
      <div role="status">
        <Icon
          icon={Loader2}
          size="lg"
          className="mx-auto animate-spin text-primary motion-reduce:animate-none"
        />
        <p className="mt-4 text-base font-semibold text-ink">
          {revising ? "Making your changes…" : "Drafting your document…"}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">
          This usually takes a minute or two. You can leave this page — it will
          be in My documents when it&apos;s ready.
        </p>
      </div>
    </Card>
  );
}

/** The draft's summary and the blanks still to fill. */
function DraftNotes({ doc }: { doc: MyDocument }) {
  if (!doc.summary && doc.missingDetails.length === 0) return null;
  return (
    <Card className="p-5">
      {doc.summary && (
        <p className="text-sm leading-relaxed text-ink">{doc.summary}</p>
      )}
      {doc.missingDetails.length > 0 && (
        <div className={doc.summary ? "mt-4" : ""}>
          <p className="text-sm font-semibold text-ink">
            Left blank for you to complete
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {doc.missingDetails.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-subtle">
            Add them below and the draft is updated — or tell the advocate in
            your review.
          </p>
        </div>
      )}
    </Card>
  );
}

/** Ask the AI for a change, before the draft goes to review. */
function ReviseBox({
  doc,
  onRevised,
}: {
  doc: MyDocument;
  onRevised: () => Promise<void>;
}) {
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MAX_REVISIONS = 5;
  const left = MAX_REVISIONS - doc.revisionCount;

  const submit = async () => {
    if (!instruction.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await documentsApi.revise(doc.id, instruction.trim());
      setInstruction("");
      await onRevised();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message.includes("REVISION_LIMIT_REACHED")
          ? "You've used all the changes for this draft. An advocate can make further changes in the review."
          : "Couldn't make that change. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <Icon icon={FilePenLine} className="text-primary" />
        Ask for changes
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        Fill in a blank, change a term, add a clause — in your own words.
      </p>
      <Textarea
        aria-label="What should change?"
        className="mt-3"
        rows={3}
        value={instruction}
        maxLength={MAX_INSTRUCTION}
        disabled={left <= 0}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="e.g. The licensor's address is 12 MG Road, Pune. Make the notice period one month."
      />
      {error && (
        <div className="mt-3">
          <Alert tone="danger" role="alert">
            {error}
          </Alert>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-ink-subtle">
          {left > 0
            ? `${left} change${left === 1 ? "" : "s"} left`
            : "No changes left"}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => void submit()}
          disabled={!instruction.trim() || left <= 0}
          loading={busy}
          loadingLabel="Sending…"
        >
          Update draft
        </Button>
      </div>
    </Card>
  );
}

/**
 * The advocate review: buy it, follow it, and download what comes back.
 * For a custom draft this is the whole purchase — the reviewed copy is the
 * download; for a template document it's an extra on top.
 */
function ReviewPanel({
  doc,
  onChange,
}: {
  doc: MyDocument;
  onChange: () => Promise<void>;
}) {
  const review = doc.review;
  const [justPaid, setJustPaid] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const custom = doc.kind === "CUSTOM";

  const download = async () => {
    setDownloading(true);
    setError(null);
    try {
      const { fileUrl, pdfUrl: pdf } = await documentsApi.reviewedDownload(
        doc.id,
      );
      setPdfUrl(pdf);
      window.location.href = fileUrl;
    } catch {
      setError("Couldn't start the download. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (review?.status === "RETURNED") {
    return (
      <Card className="border-success-text/30 p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Icon icon={BadgeCheck} className="text-success-text" />
          Reviewed by an advocate
        </h3>
        {review.returnedAt && (
          <p className="mt-1 text-xs text-ink-subtle">
            Returned{" "}
            {new Date(review.returnedAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {review.notes && (
          <div className="mt-3 rounded-control bg-surface-sunken p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              Advocate&apos;s notes
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {review.notes}
            </p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            onClick={() => void download()}
            loading={downloading}
            loadingLabel="Preparing…"
          >
            <Icon icon={Download} />
            Download reviewed document
          </Button>
          {pdfUrl && (
            <ButtonLink href={pdfUrl} variant="secondary">
              PDF
            </ButtonLink>
          )}
        </div>
        {error && (
          <div className="mt-3">
            <Alert tone="danger" role="alert">
              {error}
            </Alert>
          </div>
        )}
        <p className="mt-3 text-xs text-ink-subtle">
          You can download your reviewed document again any time from here.
        </p>
      </Card>
    );
  }

  if (review || justPaid) {
    return (
      <Card className="p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Icon icon={BadgeCheck} className="text-primary" />
          {review?.status === "IN_REVIEW"
            ? "An advocate is reviewing it"
            : "Waiting for an advocate"}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          We&apos;ll tell you by email, SMS and in your notifications the moment
          it&apos;s ready to download.
        </p>
        <div className="mt-4">
          <PushOptIn compact />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <Icon icon={BadgeCheck} className="text-primary" />
        {custom ? "Send for advocate review" : "Add an advocate review"}
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        {custom
          ? "A practising advocate checks and corrects your draft. Once reviewed, it's ready to download as Word and PDF."
          : "An advocate checks this document and sends back a reviewed copy with comments."}
      </p>
      {custom && (
        <p className="mt-2 text-xs text-ink-subtle">
          Happy with the draft? Changes stop once it&apos;s sent.
        </p>
      )}
      <div className="mt-4">
        <BuyButton
          itemType="DOCUMENT_REVIEW"
          itemId={doc.id}
          label={`Advocate review: ${doc.title}`}
          priceInPaise={doc.reviewPriceInPaise}
          onPaid={() => {
            setJustPaid(true);
            void onChange();
          }}
        />
      </div>
    </Card>
  );
}

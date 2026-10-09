"use client";

import type { Template } from "@pratikar/types";
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  SkeletonForm,
} from "@pratikar/ui";
import { grossPaise } from "@pratikar/utils";
import { PencilLine, Sparkles, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Icon } from "@/shared/components/Icon";
import {
  Breadcrumbs,
  ProductHeading,
  ProductLayout,
  ProductSection,
  PurchaseCard,
} from "@/shared/components/ProductPage";
import { formatPrice } from "@/shared/lib/format";
import { templateCategoryLabel } from "@/shared/lib/labels";
import { useAuth } from "@/shared/providers/AuthProvider";

import { useGenerateDocument } from "../hooks/useGenerateDocument";
import { useSavedDetails, type SavedDetails } from "../hooks/useSavedDetails";
import { useTemplate } from "../hooks/useTemplate";

import { DocumentFillChat } from "./DocumentFillChat";
import { DocumentPreview } from "./DocumentPreview";
import { DynamicTemplateForm, type FilledData } from "./DynamicTemplateForm";
import { GeneratedDocumentActions } from "./GeneratedDocumentActions";

/**
 * The flow as it actually runs: generating is free, payment unlocks the
 * download. There is no preview step — a preview PDF is produced but never
 * shown to the customer — so none is promised here.
 */
const STEPS = [
  {
    title: "Answer the questions",
    body: "Plain language, one field at a time. Generating is free.",
  },
  {
    title: "Check the preview",
    body: "See every page, watermarked. Change any answer and generate again, free.",
  },
  {
    title: "Pay and download",
    body: "Word and PDF, ready to print and sign. One download, so keep the files safe.",
  },
];

interface TemplateGeneratorProps {
  templateId: string;
  /** The template as the page fetched it on the server, when it could. */
  initialTemplate?: Template;
}

/**
 * A template's page: what the document is, what you'll be asked, and — once
 * signed in — the form itself.
 *
 * Public, so a visitor can see exactly what they'd be answering before they
 * make an account. The form stays behind sign-in because the answers are
 * saved to the account the document belongs to.
 */
export function TemplateGenerator({
  templateId,
  initialTemplate,
}: TemplateGeneratorProps) {
  const { user, isRestoring } = useAuth();
  const pathname = usePathname();
  const {
    template,
    isLoading,
    error: templateError,
  } = useTemplate(templateId, initialTemplate);
  const {
    generate,
    isSubmitting,
    error: generateError,
    result,
    answers,
    edit,
  } = useGenerateDocument(templateId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
        <SkeletonForm fields={5} label="Loading this template…" />
      </div>
    );
  }

  if (templateError || !template) {
    return (
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          title="This template isn't available"
          description="It may have been unpublished, or the link may be wrong."
          action={<ButtonLink href="/documents">All templates</ButtonLink>}
        />
      </div>
    );
  }

  const questions = template.fieldSchema.length;

  const priceCard = (
    <PurchaseCard>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums text-ink">
          {formatPrice(grossPaise(template.priceInPaise))}
        </span>
        <span className="text-sm text-ink-subtle">incl. GST</span>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        Generating and previewing are free — you pay only to download.
        {template.reviewPriceInPaise > 0 &&
          ` Advocate review ${formatPrice(
            grossPaise(template.reviewPriceInPaise),
          )} extra, if you want one.`}
      </p>

      <ol className="mt-6 space-y-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-ink">{step.title}</p>
              <p className="text-sm text-ink-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {!user && (
        <ButtonLink
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className={`mt-6 w-full ${isRestoring ? "pointer-events-none opacity-60" : ""}`}
        >
          Sign in to start
        </ButtonLink>
      )}
    </PurchaseCard>
  );

  return (
    <ProductLayout
      header={
        <>
          <Breadcrumbs
            trail={[{ href: "/documents", label: "Documents" }]}
            current={template.title}
          />

          <ProductHeading
            kind="document"
            title={template.title}
            description="Answer a few plain-language questions and get the finished document as a Word file and a PDF, ready to print and sign."
            meta={[
              templateCategoryLabel(template.category),
              `${questions} ${questions === 1 ? "question" : "questions"}`,
              "Word + PDF",
            ]}
          />
        </>
      }
      aside={priceCard}
    >
      {result ? (
        <ProductSection title="Your document">
          <div className="space-y-6">
            <DocumentPreview documentId={result.id} title={template.title} />
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface px-5 py-4">
              <p className="max-w-md text-sm text-ink-muted">
                Spotted a mistake? Change your answers and generate again —
                it&apos;s free until you pay.
              </p>
              <Button variant="secondary" onClick={edit}>
                <Icon icon={PencilLine} />
                Edit answers
              </Button>
            </div>
            <GeneratedDocumentActions
              documentId={result.id}
              template={template}
              initialStatus={result.status}
            />
          </div>
        </ProductSection>
      ) : user ? (
        <FillOptions
          template={template}
          initialAnswers={answers}
          onSubmit={generate}
          isSubmitting={isSubmitting}
          error={generateError}
        />
      ) : (
        <ProductSection title="What you'll be asked">
          {questions > 0 ? (
            <ol className="divide-y divide-line rounded-card border border-line">
              {template.fieldSchema.map((field, index) => (
                <li
                  key={field.key}
                  className="flex items-center gap-4 px-5 py-3.5 text-base"
                >
                  <span className="w-6 shrink-0 text-sm tabular-nums text-ink-subtle">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-ink">{field.label}</span>
                  {!field.required && (
                    <span className="text-sm text-ink-subtle">Optional</span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-ink-muted">
              Nothing to fill in — the document is ready as it is.
            </p>
          )}
        </ProductSection>
      )}
    </ProductLayout>
  );
}

type FillMode = "form" | "chat";

/**
 * The two ways to answer a template's questions: the form, or a conversation
 * with the AI that fills the same fields. Both end in the form — the chat
 * hands its answers over for checking, and only the form generates.
 */
function FillOptions({
  template,
  initialAnswers,
  onSubmit,
  isSubmitting,
  error,
}: {
  template: Template;
  /** The answers behind a document being edited, to start the form from. */
  initialAnswers: FilledData | null;
  onSubmit: (answers: FilledData) => void | Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [mode, setMode] = useState<FillMode>("form");

  // Arriving from the assistant's "Fill in by chat" link opens the chat tab.
  // Read once from the address rather than through useSearchParams, which
  // would need a Suspense boundary around the whole product page.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("fill") === "chat") {
      setMode("chat");
    }
  }, []);
  const [handedOver, setHandedOver] = useState<FilledData | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const saved = useSavedDetails(template);
  // Profile details by default; the last document's answers on request.
  const [startFrom, setStartFrom] = useState<"profile" | "previous">("profile");
  // A fresh form each time answers arrive from the chat, so it starts from
  // them rather than keeping whatever it held before.
  const [formKey, setFormKey] = useState(0);

  const tab = (value: FillMode, label: string, icon?: LucideIcon) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => setMode(value)}
      className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
        mode === value
          ? "border-primary text-ink"
          : "border-transparent text-ink-muted hover:text-ink"
      }`}
    >
      {icon && <Icon icon={icon} className="text-primary" />}
      {label}
    </button>
  );

  return (
    <div className="mt-12">
      {!aiUnavailable && (
        <div
          role="tablist"
          aria-label="How to answer"
          className="mb-6 flex gap-6 border-b border-line"
        >
          {tab("form", "Fill in the form")}
          {tab("chat", "Answer by chat", Sparkles)}
        </div>
      )}

      {mode === "chat" && !aiUnavailable ? (
        <DocumentFillChat
          template={template}
          onReview={(answers) => {
            setHandedOver(answers);
            setFormKey((k) => k + 1);
            setMode("form");
          }}
          onUnavailable={() => {
            setAiUnavailable(true);
            setMode("form");
          }}
        />
      ) : !saved.loaded && !handedOver && !initialAnswers ? (
        <SkeletonForm fields={4} label="Loading the form…" />
      ) : (
        <DynamicTemplateForm
          key={formKey}
          template={template}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
          initialValues={
            handedOver ??
            initialAnswers ??
            (startFrom === "previous" && saved.previous
              ? saved.previous.answers
              : saved.fromProfile)
          }
          notice={
            aiUnavailable ? (
              <Alert tone="info">
                Answering by chat isn&apos;t available right now — the form
                below does the same job.
              </Alert>
            ) : handedOver ? (
              <Alert tone="warning">
                These answers came from your conversation. AI can mishear, so
                check each one — especially names, amounts and dates — before
                you generate.
              </Alert>
            ) : initialAnswers ? undefined : (
              <SavedDetailsNotice
                saved={saved}
                startFrom={startFrom}
                onChange={(next) => {
                  setStartFrom(next);
                  setFormKey((k) => k + 1);
                }}
              />
            )
          }
        />
      )}
    </div>
  );
}

/**
 * Says where the form's starting values came from, and offers the other
 * start: the customer's last answers to this template, or their profile.
 * Nothing at all when there's nothing saved.
 */
function SavedDetailsNotice({
  saved,
  startFrom,
  onChange,
}: {
  saved: SavedDetails;
  startFrom: "profile" | "previous";
  onChange: (next: "profile" | "previous") => void;
}) {
  const profileCount = Object.keys(saved.fromProfile).length;
  if (!saved.previous && profileCount === 0) return undefined;

  const lastDate = saved.previous
    ? new Date(saved.previous.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <Alert tone="info">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {startFrom === "previous"
            ? `Filled in with your answers from ${lastDate}. Change anything that's different this time.`
            : profileCount > 0
              ? `We've filled in ${profileCount} ${profileCount === 1 ? "detail" : "details"} from your profile — check ${profileCount === 1 ? "it" : "them"} before you generate.`
              : `You made this document before, on ${lastDate}.`}
        </span>
        {saved.previous && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              onChange(startFrom === "previous" ? "profile" : "previous")
            }
          >
            {startFrom === "previous"
              ? profileCount > 0
                ? "Use my profile details instead"
                : "Start fresh instead"
              : "Use my last answers"}
          </Button>
        )}
      </div>
    </Alert>
  );
}

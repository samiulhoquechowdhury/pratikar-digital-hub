"use client";

import { GST_STATE_NAMES } from "@pratikar/types";
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  Field,
  Input,
  Select,
  Textarea,
} from "@pratikar/ui";
import { formatPaise, grossPaise } from "@pratikar/utils";
import { BadgeCheck, Download, FilePenLine, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Icon } from "@/shared/components/Icon";
import { useAuth } from "@/shared/providers/AuthProvider";

import { documentsApi, type DraftPricing } from "../api/documentsApi";

/** Mirrors DRAFT_LIMITS in the API's draft-custom.dto.ts. */
export const DRAFT_LIMITS = {
  documentType: 120,
  details: 4000,
  minDetails: 20,
};

/**
 * Starting points, not a menu: tapping one fills in the document type, and
 * the customer still describes their own situation. Anything can be typed.
 */
const SUGGESTIONS = [
  "Leave and licence agreement",
  "Affidavit",
  "Legal notice for unpaid dues",
  "Partnership deed",
  "Power of attorney",
  "Non-disclosure agreement",
  "Will",
  "Employment agreement",
];

const STATES = Object.entries(GST_STATE_NAMES).sort(([, a], [, b]) =>
  a.localeCompare(b),
);

const STEPS = [
  {
    icon: Sparkles,
    title: "AI drafts it",
    body: "From your description, in the format of our advocate-written documents. Preview it free and ask for changes.",
  },
  {
    icon: BadgeCheck,
    title: "An advocate reviews it",
    body: "A practising advocate checks and corrects the draft for you.",
  },
  {
    icon: Download,
    title: "You download it",
    body: "We notify you the moment it's ready — Word and PDF.",
  },
];

/** What a failed request means to the customer. */
function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("AI_NOT_CONFIGURED"))
    return "AI drafting is unavailable right now. Please try again later.";
  if (message.includes("DRAFT_LIMIT_REACHED") || message.includes("429"))
    return "You've started a lot of drafts today. Please try again tomorrow, or finish one you've started.";
  return "Couldn't start your draft. Please try again.";
}

/**
 * Describe a document, and the AI drafts it. Any document — the templates
 * are suggestions, not the limit. The draft is free to preview; the
 * advocate review is what's paid for, and what unlocks the download.
 */
export function CustomDraftForm() {
  const { user, isRestoring } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [documentType, setDocumentType] = useState(
    () => params.get("type")?.slice(0, DRAFT_LIMITS.documentType) ?? "",
  );
  const [stateCode, setStateCode] = useState("");
  const [details, setDetails] = useState("");
  const [pricing, setPricing] = useState<DraftPricing | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    documentsApi
      .draftPricing()
      .then(setPricing)
      .catch(() => setPricing(null));
  }, []);

  const tooShort = details.trim().length < DRAFT_LIMITS.minDetails;
  const canSubmit = documentType.trim().length >= 3 && !tooShort && !submitting;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { id } = await documentsApi.draftCustom({
        documentType: documentType.trim(),
        details: details.trim(),
        ...(stateCode ? { stateCode } : {}),
      });
      router.push(`/dashboard/documents/${id}`);
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  };

  const reviewPrice = pricing
    ? formatPaise(grossPaise(pricing.reviewPriceInPaise))
    : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="p-6 sm:p-8">
        {pricing && !pricing.available && (
          <div className="mb-6">
            <Alert tone="warning">
              AI drafting is unavailable right now. You can still browse our
              ready-made document templates.
            </Alert>
          </div>
        )}

        <form onSubmit={(e) => void submit(e)} className="space-y-6">
          <Field
            label="What document do you need?"
            htmlFor="draft-type"
            hint="Name it the way you would to a lawyer."
          >
            <Input
              id="draft-type"
              value={documentType}
              maxLength={DRAFT_LIMITS.documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="e.g. Leave and licence agreement for a flat"
            />
          </Field>

          <div className="-mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setDocumentType(suggestion)}
                aria-pressed={documentType === suggestion}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  documentType === suggestion
                    ? "border-primary bg-primary text-ink-inverse"
                    : "border-line-strong bg-surface text-ink-muted hover:border-brand-border hover:text-ink"
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <Field
            label="State (optional)"
            htmlFor="draft-state"
            hint="Where it will be signed — it decides the stamp-paper and jurisdiction wording."
          >
            <Select
              id="draft-state"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
            >
              <option value="">Not sure / leave blank</option>
              {STATES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Describe the details"
            htmlFor="draft-details"
            hint={`Who the parties are, amounts, dates, places and any terms you want. ${details.length}/${DRAFT_LIMITS.details}`}
          >
            <Textarea
              id="draft-details"
              rows={9}
              value={details}
              maxLength={DRAFT_LIMITS.details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                "e.g. I, Asha Rao of Kothrud, Pune, am giving my 2BHK flat (Flat 4B, Sai Residency) on leave and licence to Vikram Sen for 11 months from 1 November 2026. Rent ₹25,000 a month, deposit ₹1,00,000, 2 months' notice either side, no pets."
              }
            />
          </Field>

          {error && (
            <Alert tone="danger" role="alert">
              {error}
            </Alert>
          )}

          {!user && !isRestoring ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-muted">
                Sign in to draft — your document is saved to your account.
              </p>
              <ButtonLink href={`/login?next=${encodeURIComponent(pathname)}`}>
                Sign in to continue
              </ButtonLink>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <Button
                type="submit"
                disabled={!canSubmit || pricing?.available === false}
                loading={submitting}
                loadingLabel="Starting your draft…"
              >
                <Icon icon={FilePenLine} />
                Draft my document
              </Button>
              <p className="text-sm text-ink-muted">
                Free to draft and preview.
              </p>
            </div>
          )}
        </form>
      </Card>

      <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <Card className="p-6">
          <h2 className="text-base font-semibold">How it works</h2>
          <ol className="mt-4 space-y-5">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-subtle text-primary">
                  <Icon icon={step.icon} size="sm" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {index + 1}. {step.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-ink-muted">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
        {reviewPrice && (
          <Card className="p-6">
            <p className="text-sm text-ink-muted">Advocate review</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
              {reviewPrice}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              incl. GST · paid only once you&apos;re happy with the draft
            </p>
          </Card>
        )}
      </aside>
    </div>
  );
}

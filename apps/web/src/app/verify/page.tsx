"use client";

import { Button, Field, Input } from "@pratikar/ui";
import {
  BadgeCheck,
  CalendarCheck,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/shared/components/Icon";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";

/**
 * Entry point for someone holding a certificate code but not a link — the
 * likely case when the code was read off a printed or PDF certificate.
 */
const VERIFIES = [
  {
    icon: UserCheck,
    title: "Who it was issued to",
    body: "The name on the certificate, as the learner's account holds it.",
  },
  {
    icon: GraduationCap,
    title: "Which course, and the score",
    body: "The course completed and the quiz result it was earned with.",
  },
  {
    icon: CalendarCheck,
    title: "When it was issued",
    body: "The date the course was finished.",
  },
];

export default function VerifyEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <>
      <PageIntro
        eyebrow="Verify"
        title="Verify a certificate"
        description="Confirm that a certificate was genuinely issued by Pratikar Digital Hub. No account needed."
      />
      <PageSection className="pb-8">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-card border border-line bg-surface p-6 shadow-raised sm:p-8">
            <p className="mb-6 flex items-center gap-2 text-sm text-ink-muted">
              <Icon icon={BadgeCheck} className="text-primary" />
              Every certificate carries a unique verification code.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = code.trim();
                if (trimmed)
                  router.push(`/verify/${encodeURIComponent(trimmed)}`);
              }}
              className="space-y-5"
            >
              <Field
                label="Verification code"
                htmlFor="code"
                hint="Printed on the certificate. Case-sensitive."
              >
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="e.g. a1b2c3d4e5f6a7b8"
                  className="font-mono"
                />
              </Field>

              <Button
                type="submit"
                disabled={!code.trim()}
                className="w-full sm:w-auto"
              >
                Verify
              </Button>
            </form>
          </div>

          <aside className="rounded-card bg-surface-inverse p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-ink-inverse">
              What a verification confirms
            </h2>
            <ul className="mt-5 space-y-4">
              {VERIFIES.map((point) => (
                <li key={point.title} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-control bg-surface-inverse-raised text-brand"
                  >
                    <Icon icon={point.icon} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink-inverse">
                      {point.title}
                    </span>
                    <span className="block text-sm text-ink-inverse-muted">
                      {point.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-line-inverse pt-5 text-xs text-ink-inverse-muted">
              If a code isn&apos;t recognised, the certificate wasn&apos;t
              issued by us — or the code was typed with a mistake.
            </p>
          </aside>
        </div>
      </PageSection>
    </>
  );
}

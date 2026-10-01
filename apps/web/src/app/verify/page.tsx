"use client";

import { Button, Field, Input } from "@pratikar/ui";
import { BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/shared/components/Icon";
import { PageIntro, PageSection } from "@/shared/components/PageIntro";

/**
 * Entry point for someone holding a certificate code but not a link — the
 * likely case when the code was read off a printed or PDF certificate.
 */
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
        <div className="max-w-xl rounded-card border border-line p-6 shadow-raised sm:p-8">
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
      </PageSection>
    </>
  );
}

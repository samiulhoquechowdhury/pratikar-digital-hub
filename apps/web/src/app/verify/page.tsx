"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Button,
  Card,
  Field,
  Input,
  PageBody,
  PageHeader,
} from "@/shared/components/ui";

/**
 * Entry point for someone holding a certificate code but not a link — the
 * likely case when the code was read off a printed or PDF certificate.
 */
export default function VerifyEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <>
      <PageHeader
        title="Verify a certificate"
        description="Confirm that a certificate was genuinely issued by us. No account needed."
      />
      <PageBody>
        <Card className="max-w-xl p-6">
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

            <Button type="submit" disabled={!code.trim()}>
              Verify
            </Button>
          </form>
        </Card>
      </PageBody>
    </>
  );
}

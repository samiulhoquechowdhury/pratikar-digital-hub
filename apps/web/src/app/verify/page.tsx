"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Entry point for someone holding a certificate code but not a link — the
 * likely case when the code was read off a printed or PDF certificate.
 */
export default function VerifyEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <main>
      <h1>Verify a certificate</h1>
      <p>
        Enter the verification code printed on the certificate to confirm it was
        issued by us.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = code.trim();
          if (trimmed) router.push(`/verify/${encodeURIComponent(trimmed)}`);
        }}
      >
        <label htmlFor="code">Verification code</label>
        <input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" disabled={!code.trim()}>
          Verify
        </button>
      </form>
    </main>
  );
}

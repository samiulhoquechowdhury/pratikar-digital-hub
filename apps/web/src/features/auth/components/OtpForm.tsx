"use client";

import { Button, Field, Input } from "@pratikar/ui";
import { useEffect, useState } from "react";

import { useOtpFlow } from "../hooks/useOtpFlow";

/**
 * Two-step sign-in: identifier (email/phone) then the 6-digit code. A
 * successful verify IS signup — there is no separate registration step, which
 * is why the copy avoids promising an account that doesn't exist yet.
 *
 * Only the email channel actually delivers right now; SMS is gated on the
 * client's DLT registration (docs/implementation-plan.md, Open blockers #1).
 * A phone number still reaches the backend, it just won't receive anything.
 */
export function OtpForm({
  onVerified,
}: {
  onVerified?: (isNewUser: boolean) => void;
}) {
  const {
    step,
    identifier,
    isSubmitting,
    error,
    isNewUser,
    requestOtp,
    verifyOtp,
    reset,
  } = useOtpFlow();
  const [identifierInput, setIdentifierInput] = useState("");
  const [otpInput, setOtpInput] = useState("");

  // Handing over in an effect rather than from inside verifyOtp keeps the hook
  // free of navigation concerns — the same flow gets reused outside this page.
  useEffect(() => {
    if (step === "verified") onVerified?.(isNewUser);
  }, [step, isNewUser, onVerified]);

  if (step === "verified") {
    return (
      <p role="status" className="text-sm text-ink-muted">
        {isNewUser ? "Account created — signing you in…" : "Signing you in…"}
      </p>
    );
  }

  if (step === "enter-otp") {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void verifyOtp(otpInput);
        }}
      >
        <p className="text-sm text-ink-muted">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-ink">{identifier}</span>.
        </p>

        <Field
          label="Verification code"
          htmlFor="otp-code"
          error={error ?? undefined}
        >
          <Input
            id="otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            // Wide tracking makes six digits read as six digits rather than as
            // one number, which is how people check them against a phone.
            className="text-center text-lg tracking-[0.5em]"
            autoFocus
          />
        </Field>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Verifying…" : "Verify and continue"}
        </Button>

        <button
          type="button"
          onClick={reset}
          disabled={isSubmitting}
          className="w-full text-sm font-medium text-primary hover:text-primary-hover disabled:opacity-60"
        >
          Use a different email or phone
        </button>
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void requestOtp(identifierInput);
      }}
    >
      <Field
        label="Email or phone"
        htmlFor="otp-identifier"
        hint="We'll send a one-time code — there's no password to remember."
        error={error ?? undefined}
      >
        <Input
          id="otp-identifier"
          type="text"
          autoComplete="email"
          value={identifierInput}
          onChange={(e) => setIdentifierInput(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending…" : "Send me a code"}
      </Button>
    </form>
  );
}

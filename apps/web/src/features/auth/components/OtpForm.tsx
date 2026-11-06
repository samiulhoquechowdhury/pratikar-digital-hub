"use client";

import { formatIndianMobile } from "@pratikar/types";
import { Button, Field, Input } from "@pratikar/ui";
import { useEffect, useState } from "react";

import { useOtpFlow } from "../hooks/useOtpFlow";

/**
 * Two-step sign-in: a mobile number, then the 6-digit code texted to it.
 * A successful verify IS sign-up — there is no separate registration step,
 * which is why the copy avoids promising an account that doesn't exist yet.
 */
export function OtpForm({
  onVerified,
}: {
  onVerified?: (isNewUser: boolean) => void;
}) {
  const flow = useOtpFlow();
  const [phoneInput, setPhoneInput] = useState("");
  const [otpInput, setOtpInput] = useState("");

  // Handing over in an effect rather than from inside verifyOtp keeps the hook
  // free of navigation concerns — the same flow gets reused outside this page.
  useEffect(() => {
    if (flow.step === "verified") onVerified?.(flow.isNewUser);
  }, [flow.step, flow.isNewUser, onVerified]);

  // Demo mode: the code is known, so it's filled in — still submitted by hand.
  useEffect(() => {
    if (flow.step === "enter-otp" && flow.demoCode) setOtpInput(flow.demoCode);
  }, [flow.step, flow.demoCode]);

  if (flow.step === "verified") {
    return (
      <p role="status" className="text-sm text-ink-muted">
        {flow.isNewUser
          ? "Account created — signing you in…"
          : "Signing you in…"}
      </p>
    );
  }

  if (flow.step === "enter-otp") {
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void flow.verifyOtp(otpInput);
        }}
      >
        <p className="text-sm text-ink-muted">
          {flow.demoCode ? "Signing in as " : "We texted a 6-digit code to "}
          <span className="font-medium text-ink">
            {formatIndianMobile(flow.identifier)}
          </span>
          .
        </p>

        {flow.demoCode ? (
          <p
            role="status"
            className="rounded-lg border border-warning-border bg-warning-subtle px-3 py-2 text-sm text-warning-text"
          >
            Demo mode: text messages aren&apos;t set up yet, so every number
            uses the code {flow.demoCode}. It&apos;s filled in for you.
          </p>
        ) : null}

        <Field
          label="Verification code"
          htmlFor="otp-code"
          error={flow.error ?? undefined}
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

        <Button type="submit" disabled={flow.isSubmitting} className="w-full">
          {flow.isSubmitting ? "Verifying…" : "Verify and continue"}
        </Button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button"
            onClick={() => {
              setOtpInput("");
              flow.reset();
            }}
            disabled={flow.isSubmitting}
            className="font-medium text-primary hover:text-primary-hover disabled:opacity-60"
          >
            Change number
          </button>
          <button
            type="button"
            onClick={() => void flow.resend()}
            disabled={flow.resendIn > 0 || flow.isSubmitting}
            className="font-medium text-primary hover:text-primary-hover disabled:text-ink-subtle"
          >
            {flow.resendIn > 0
              ? `Resend code in ${flow.resendIn}s`
              : "Resend code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void flow.requestOtp(phoneInput);
      }}
    >
      <Field
        label="Mobile number"
        htmlFor="otp-phone"
        hint="We'll text you a 6-digit code — there's no password to remember."
        error={flow.error ?? undefined}
      >
        <div className="flex gap-2">
          <span className="inline-flex shrink-0 items-center rounded-control border border-line-strong bg-surface-sunken px-3 text-ink">
            +91
          </span>
          <Input
            id="otp-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={14}
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="98765 43210"
            className="min-w-0 flex-1"
          />
        </div>
      </Field>

      <Button type="submit" disabled={flow.isSubmitting} className="w-full">
        {flow.isSubmitting ? "Sending…" : "Send me a code"}
      </Button>
    </form>
  );
}

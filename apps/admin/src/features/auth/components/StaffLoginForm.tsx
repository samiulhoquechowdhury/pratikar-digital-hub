"use client";

import { Alert, Button, Field, Input } from "@pratikar/ui";
import { useState } from "react";

import { useStaffLogin } from "../hooks/useStaffLogin";

// Two-step form: identifier -> OTP, same endpoints as the storefront. Only the
// email channel actually delivers right now (SMS is gated on the client's DLT
// registration — docs/implementation-plan.md).
export function StaffLoginForm() {
  const {
    step,
    identifier,
    isSubmitting,
    error,
    accessDeniedFor,
    requestOtp,
    verifyOtp,
    reset,
  } = useStaffLogin();
  const [identifierInput, setIdentifierInput] = useState("");
  const [otpInput, setOtpInput] = useState("");

  if (accessDeniedFor) {
    return (
      <div className="space-y-4">
        {/*
          The credentials were correct — the account simply isn't staff. Saying
          so plainly stops someone retyping a password they got right, and
          naming the role tells a Super Admin exactly what to change.
        */}
        <Alert tone="warning" role="alert">
          That account is signed in as {accessDeniedFor.role}, which has no
          admin access. Use a staff account.
        </Alert>
        <Button variant="secondary" onClick={reset}>
          Try a different account
        </Button>
      </div>
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
        <Field
          label="Verification code"
          htmlFor="staff-otp"
          hint={`Sent to ${identifier}.`}
        >
          <Input
            id="staff-otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value)}
            placeholder="000000"
            autoComplete="one-time-code"
            autoFocus
            className="text-center font-mono text-lg tracking-[0.4em]"
          />
        </Field>

        {error && (
          <Alert tone="danger" role="alert">
            {error}
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Verifying…" : "Verify"}
          </Button>
          <Button variant="ghost" onClick={reset} disabled={isSubmitting}>
            Use a different account
          </Button>
        </div>
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
      <Field label="Work email or phone" htmlFor="staff-identifier">
        <Input
          id="staff-identifier"
          type="text"
          value={identifierInput}
          onChange={(e) => setIdentifierInput(e.target.value)}
          placeholder="you@pratikar.example"
          autoComplete="username"
          autoFocus
        />
      </Field>

      {error && (
        <Alert tone="danger" role="alert">
          {error}
        </Alert>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending…" : "Send code"}
      </Button>
    </form>
  );
}

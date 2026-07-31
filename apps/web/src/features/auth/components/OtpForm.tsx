"use client";

import Link from "next/link";
import { useState } from "react";

import { useOtpFlow } from "../hooks/useOtpFlow";

// Two-step form: identifier (email/phone) -> OTP code. Only the email channel
// actually delivers right now (SMS/MSG91 is gated on the client's DLT
// registration — docs/implementation-plan.md Open blockers #1); submitting a
// phone number still reaches the backend, it just won't receive anything yet.
export function OtpForm() {
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

  if (step === "verified") {
    return (
      <div>
        <p>
          {isNewUser ? "Account created — you're signed in." : "Signed in."}
        </p>
        <p>
          <Link href="/documents">Browse templates</Link>
        </p>
      </div>
    );
  }

  if (step === "enter-otp") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void verifyOtp(otpInput);
        }}
      >
        <p>Enter the 6-digit code sent to {identifier}.</p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value)}
          placeholder="000000"
          autoFocus
        />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Verifying…" : "Verify"}
        </button>
        <button type="button" onClick={reset} disabled={isSubmitting}>
          Use a different email or phone
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void requestOtp(identifierInput);
      }}
    >
      <label htmlFor="otp-identifier">Email or phone</label>
      <input
        id="otp-identifier"
        type="text"
        value={identifierInput}
        onChange={(e) => setIdentifierInput(e.target.value)}
        placeholder="you@example.com"
        autoFocus
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send code"}
      </button>
    </form>
  );
}

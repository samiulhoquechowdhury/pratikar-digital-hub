"use client";

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
      <div>
        <p role="alert">
          That account is signed in as {accessDeniedFor.role}, which has no
          admin access. Use a staff account.
        </p>
        <button type="button" onClick={reset}>
          Try a different account
        </button>
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
          Use a different account
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
      <label htmlFor="staff-identifier">Work email or phone</label>
      <input
        id="staff-identifier"
        type="text"
        value={identifierInput}
        onChange={(e) => setIdentifierInput(e.target.value)}
        placeholder="you@pratikar.example"
        autoFocus
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send code"}
      </button>
    </form>
  );
}

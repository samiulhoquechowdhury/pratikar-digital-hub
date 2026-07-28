"use client";

import type { OtpChannel } from "@pratikar/types";
import { useState } from "react";

import { authApi } from "../api/authApi";

import { useAuth } from "@/shared/providers/AuthProvider";

export type OtpStep = "enter-identifier" | "enter-otp" | "verified";

const detectChannel = (identifier: string): OtpChannel =>
  identifier.includes("@") ? "email" : "sms";

/**
 * State machine: "enter-identifier" -> "enter-otp" -> "verified", against the
 * live /auth/otp/* endpoints (docs/srs.md Section 3.1). A successful verify
 * IS signup — there's no separate registration step.
 */
export function useOtpFlow() {
  const { login } = useAuth();
  const [step, setStep] = useState<OtpStep>("enter-identifier");
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<OtpChannel>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const requestOtp = async (rawIdentifier: string) => {
    const trimmed = rawIdentifier.trim();
    if (!trimmed) {
      setError("Enter an email address or phone number.");
      return;
    }

    const detectedChannel = detectChannel(trimmed);
    setIsSubmitting(true);
    setError(null);

    try {
      await authApi.requestOtp({
        identifier: trimmed,
        channel: detectedChannel,
      });
      setIdentifier(trimmed);
      setChannel(detectedChannel);
      setStep("enter-otp");
    } catch {
      // Never reveal whether the identifier exists — mirrors the backend's
      // INVALID_OTP messaging, which deliberately doesn't distinguish cases.
      setError("Couldn't send a code to that address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await authApi.verifyOtp({ identifier, channel, otp });
      login(result);
      setIsNewUser(result.isNewUser);
      setStep("verified");
    } catch {
      setError("That code didn't work. Check it and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setStep("enter-identifier");
    setIdentifier("");
    setError(null);
  };

  return {
    step,
    identifier,
    channel,
    isSubmitting,
    error,
    isNewUser,
    requestOtp,
    verifyOtp,
    reset,
  };
}

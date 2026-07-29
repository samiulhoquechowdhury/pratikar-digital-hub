"use client";

import type { OtpChannel } from "@pratikar/types";
import { useState } from "react";

import { authApi } from "../api/authApi";

import { useAuth } from "@/shared/providers/AuthProvider";

export type LoginStep = "enter-identifier" | "enter-otp";

const detectChannel = (identifier: string): OtpChannel =>
  identifier.includes("@") ? "email" : "sms";

/**
 * Same OTP endpoints as the storefront (apps/web useOtpFlow) — staff don't get
 * a separate credential system. The difference is what happens on success:
 * AuthProvider refuses to admit a non-staff role, so this hook surfaces that
 * rejection rather than reporting a successful login.
 */
export function useStaffLogin() {
  const { login, accessDeniedFor } = useAuth();
  const [step, setStep] = useState<LoginStep>("enter-identifier");
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<OtpChannel>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestOtp = async (rawIdentifier: string) => {
    const trimmed = rawIdentifier.trim();
    if (!trimmed) {
      setError("Enter your work email address or phone number.");
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
      // deliberately undifferentiated INVALID_OTP messaging.
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
      login(await authApi.verifyOtp({ identifier, channel, otp }));
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
    isSubmitting,
    error,
    accessDeniedFor,
    requestOtp,
    verifyOtp,
    reset,
  };
}

import { normalizeIndianMobile } from "@pratikar/types";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

import { authApi } from "./authApi";

export type OtpStep = "enter-identifier" | "enter-otp" | "verified";

/** Seconds before another code can be asked for. */
export const RESEND_AFTER_SECONDS = 30;

function sendError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429)
      return "Too many codes asked for. Please wait a little and try again.";
    if (error.code === "INVALID_PHONE")
      return "Enter a 10-digit Indian mobile number.";
    if (error.status === 503)
      return "We couldn't send the text just now. Please try again in a minute.";
  }
  return "Couldn't send a code to that number. Check your connection and try again.";
}

/**
 * Sign-in by mobile number — the website's useOtpFlow, against the same
 * endpoints, with the code texted through MSG91. A successful verify IS
 * sign-up; there's no separate registration step.
 */
export function useOtpFlow() {
  const { login } = useAuth();
  const [step, setStep] = useState<OtpStep>("enter-identifier");
  const [identifier, setIdentifier] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const send = async (phone: string) => {
    const result = await authApi.requestOtp({
      identifier: phone,
      channel: "sms",
    });
    // Demo mode (no SMS provider yet): nothing is texted; this is the code.
    setDemoCode(result?.demoCode ?? null);
    setResendIn(RESEND_AFTER_SECONDS);
  };

  const requestOtp = async (raw: string) => {
    const phone = normalizeIndianMobile(raw);
    if (!phone) {
      setError("Enter a 10-digit Indian mobile number.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await send(phone);
      setIdentifier(phone);
      setStep("enter-otp");
    } catch (cause) {
      setError(sendError(cause));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || !identifier) return;
    setError(null);
    try {
      await send(identifier);
    } catch (cause) {
      setError(sendError(cause));
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
      const session = await authApi.verifyOtp({
        identifier,
        channel: "sms",
        otp,
      });
      await login(session);
      setIsNewUser(session.isNewUser);
      setStep("verified");
    } catch (cause) {
      setError(
        cause instanceof ApiError &&
          (cause.status === 410 || cause.status === 429)
          ? "That code has expired. Ask for a new one."
          : "That code didn't work. Check it and try again.",
      );
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
    isNewUser,
    resendIn,
    demoCode,
    requestOtp,
    resend,
    verifyOtp,
    reset,
  };
}

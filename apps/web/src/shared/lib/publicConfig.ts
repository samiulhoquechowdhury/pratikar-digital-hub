"use client";

import { useEffect, useState } from "react";

import { apiClient } from "./apiClient";

/**
 * The public identifiers of the services the site uses, from the API — so a
 * Super Admin changing them in Integrations needs no rebuild of the site.
 * The NEXT_PUBLIC_ values are the fallback while the API is unreachable.
 */
export interface PublicConfig {
  razorpayKeyId: string | null;
  googleClientId: string | null;
}

const FALLBACK: PublicConfig = {
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || null,
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || null,
};

let pending: Promise<PublicConfig> | null = null;

/** Asked once per page load and shared. */
export function getPublicConfig(): Promise<PublicConfig> {
  pending ??= apiClient
    .get<PublicConfig>("/config/public")
    .then((config) => ({
      razorpayKeyId: config.razorpayKeyId ?? FALLBACK.razorpayKeyId,
      googleClientId: config.googleClientId ?? FALLBACK.googleClientId,
    }))
    .catch(() => {
      pending = null; // try again next time
      return FALLBACK;
    });
  return pending;
}

/** The config for a component; the build-time fallback until it arrives. */
export function usePublicConfig(): PublicConfig {
  const [config, setConfig] = useState(FALLBACK);
  useEffect(() => {
    let live = true;
    void getPublicConfig().then((next) => {
      if (live) setConfig(next);
    });
    return () => {
      live = false;
    };
  }, []);
  return config;
}

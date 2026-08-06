"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/shared/providers/AuthProvider";

import { authApi } from "../api/authApi";
import {
  googleClientId,
  isGoogleSignInEnabled,
  loadGoogleIdentity,
} from "../lib/googleIdentity";

// Google's widest supported button. The container is capped to match so the
// rendered iframe and the OTP form below it line up.
const BUTTON_WIDTH = 400;

/**
 * "Continue with Google", rendered by Google itself.
 *
 * Using renderButton rather than a hand-built button is deliberate: it keeps
 * the mark, wording and localisation compliant with Google's branding terms
 * without us tracking their changes, and the credential arrives through their
 * callback rather than through anything we could get wrong.
 *
 * Renders nothing when no client id is configured, so a developer without
 * Google credentials sees a working OTP form rather than a broken button.
 */
export function GoogleSignInButton({
  onSignedIn,
}: {
  onSignedIn?: (isNewUser: boolean) => void;
}) {
  const { login } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  // The callback closes over `login`; a ref keeps GIS initialised once while
  // still calling the current one.
  const handleCredential = useRef<(credential: string) => void>(
    () => undefined,
  );
  handleCredential.current = (credential: string) => {
    setError(null);
    authApi
      .signInWithGoogle({ idToken: credential })
      .then((session) => {
        login(session);
        onSignedIn?.(session.isNewUser);
      })
      .catch(() => {
        // The API's reasons (unverified address, wrong audience, expired
        // token) are all things the user can only respond to the same way.
        setError("We couldn't sign you in with Google. Please try again.");
      });
  };

  useEffect(() => {
    if (!isGoogleSignInEnabled) return;

    let cancelled = false;

    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !containerRef.current) return;

        google.accounts.id.initialize({
          client_id: googleClientId,
          auto_select: false,
          callback: (response) => {
            if (response.credential)
              handleCredential.current(response.credential);
          },
        });

        google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "center",
          width: BUTTON_WIDTH,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Google sign-in is unavailable right now. Use a code instead.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isGoogleSignInEnabled) return null;

  return (
    <div>
      {/* Google renders into an iframe of its own, so this wrapper only
          controls placement — never the button's appearance. */}
      <div
        ref={containerRef}
        className="flex min-h-[44px] justify-center [color-scheme:light]"
      />
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}

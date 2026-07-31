/**
 * Loader for Google Identity Services.
 *
 * GIS has to come from accounts.google.com — it is signed-in-state-aware and
 * Google does not support self-hosting it, so this is the one third-party
 * script on the site. It is loaded lazily, only on screens that actually offer
 * Google sign-in, so the rest of the site carries no cost for it.
 */

const GIS_SRC = "https://accounts.google.com/gsi/client";

/** Only the slice of the GIS surface we use. */
interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
        // Off deliberately: One Tap pops up unprompted, and an auth prompt the
        // user didn't ask for on a page about legal paperwork reads as a scam.
        auto_select?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: Record<string, string | number>,
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

export const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

/** Whether to offer Google sign-in at all. Unset id means the button is hidden. */
export const isGoogleSignInEnabled = googleClientId.length > 0;

// Module-level so a user moving between /login and a modal doesn't re-fetch it.
let loader: Promise<GoogleIdentityApi> | null = null;

export function loadGoogleIdentity(): Promise<GoogleIdentityApi> {
  if (loader) return loader;

  loader = new Promise<GoogleIdentityApi>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Google Identity Services requires a browser"));
      return;
    }

    if (window.google) {
      resolve(window.google);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GIS_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");

    const onLoad = () => {
      if (window.google) resolve(window.google);
      else reject(new Error("Google Identity Services loaded but is missing"));
    };

    script.addEventListener("load", onLoad);
    script.addEventListener("error", () => {
      // Reset so a later attempt can retry: a blocked or flaky first load
      // shouldn't disable the button for the rest of the session.
      loader = null;
      reject(new Error("Could not load Google Identity Services"));
    });

    if (!existing) {
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return loader;
}

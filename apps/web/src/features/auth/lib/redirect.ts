/** Where sign-in sends you when there's no usable `?next=`. */
export const DEFAULT_SIGNED_IN_PATH = "/dashboard";

/**
 * Sanitises the `?next=` parameter on the sign-in pages.
 *
 * An unchecked value here is an open redirect: a link to
 * pratikar.example/login?next=https://evil.example carries our domain's
 * credibility all the way to somebody else's login form, which is exactly the
 * shape of a phishing campaign against our own users. Only same-site absolute
 * paths are allowed through.
 */
export function safeRedirectPath(next: string | null | undefined): string {
  if (!next) return DEFAULT_SIGNED_IN_PATH;

  // "//evil.example" is protocol-relative: browsers treat it as a different
  // origin even though it starts with a slash.
  if (!next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_SIGNED_IN_PATH;
  }

  // "/\evil.example" is the same trick with a backslash, which some browsers
  // normalise to a forward slash.
  if (next.startsWith("/\\")) return DEFAULT_SIGNED_IN_PATH;

  return next;
}

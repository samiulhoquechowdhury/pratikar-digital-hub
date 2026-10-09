/**
 * The site's public origin — the one place anything builds an absolute URL
 * from: canonical links, share previews, the sitemap, and the address a
 * certificate's QR code points at.
 *
 * It has to be the real deployed origin in production. A share card or a
 * printed QR code carrying "localhost" is useless the moment it leaves the
 * machine that made it.
 */
export const siteOrigin = (): string => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  // In the browser the current origin is right often enough to be a useful
  // fallback in development.
  if (typeof window !== "undefined") return window.location.origin;

  // The customer site's dev port. (This once said 3001 — the admin panel —
  // so a certificate QR generated locally opened the wrong app.)
  return "http://localhost:3000";
};

/** An absolute URL on this site, from a path like "/courses/abc". */
export const absoluteUrl = (path: string): string =>
  `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;

export const SITE_NAME = "Pratikar Digital Hub";

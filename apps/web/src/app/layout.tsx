import type { Metadata } from "next";
import { Cinzel, Inter, Source_Serif_4 } from "next/font/google";

import { AssistantLauncher } from "@/features/assistant";
import { SiteFooter } from "@/shared/components/SiteFooter";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { SITE_NAME, siteOrigin } from "@/shared/lib/site";
import { AuthProvider } from "@/shared/providers/AuthProvider";

import "./globals.css";

// next/font self-hosts and inlines the font, so there's no runtime request to
// Google — one less third party, and no layout shift while it loads.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

/**
 * The display face, used only on page and section titles.
 *
 * A single sans across an entire legal-services product reads as generic —
 * Inter is the safe default precisely because it is everywhere. A serif on the
 * headings does the work the subject actually asks for: contracts, statutes
 * and certificates are set in serif, and the association is what carries
 * authority. Source Serif rather than a traditional book face because the
 * interface around it is Swiss-plain, and a bookish serif would fight it.
 *
 * Restraint is the point. Body copy, labels, tables and every control stay
 * Inter, so the serif marks hierarchy instead of decorating the page.
 */
const displaySerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

/** The logo's wordmark face — "PRATIKAR" only, so one weight is enough. */
const brandFont = Cinzel({
  subsets: ["latin"],
  display: "swap",
  weight: ["600"],
  variable: "--font-brand",
});

/**
 * Site-wide defaults every page's own metadata builds on. metadataBase is
 * what turns the relative canonical and share-image paths pages declare into
 * absolute URLs — search engines and link previews need the full address.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Pratikar Digital Hub — legal documents, courses and guides",
    template: "%s — Pratikar Digital Hub",
  },
  description:
    "Generate ready-to-sign legal documents, take courses with a verifiable certificate, and download guides and checklists — written for people who aren't lawyers.",
  applicationName: SITE_NAME,
  // No canonical here: a layout's canonical is inherited by every page that
  // doesn't set its own, and "/" would mark them all as copies of the home
  // page. Each page declares its own.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${displaySerif.variable} ${brandFont.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          {/*
            Keyboard users land here first: the nav repeats on every page, so
            without this they tab through all of it before reaching content.
          */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-brand"
          >
            Skip to content
          </a>

          <SiteHeader />

          <main id="main" className="flex-1">
            {children}
          </main>

          <SiteFooter />

          {/*
            Last in the tree so it sits above the page without a z-index
            contest, and after the footer in the tab order — the assistant is
            an aside, and a keyboard user shouldn't meet it before the content
            they came for.
          */}
          <AssistantLauncher />
        </AuthProvider>
      </body>
    </html>
  );
}

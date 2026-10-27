import type { Metadata } from "next";
import { Cinzel, Plus_Jakarta_Sans, Source_Sans_3 } from "next/font/google";

import { AssistantLauncher } from "@/features/assistant";
import { AnnouncementBar } from "@/shared/components/AnnouncementBar";
import { SiteChrome } from "@/shared/components/SiteChrome";
import { SiteFooter } from "@/shared/components/SiteFooter";
import { SiteHeader } from "@/shared/components/SiteHeader";
import { SITE_NAME, siteOrigin } from "@/shared/lib/site";
import { AuthProvider } from "@/shared/providers/AuthProvider";

import "./globals.css";

// next/font self-hosts and inlines the font, so there's no runtime request to
// Google — one less third party, and no layout shift while it loads.

/**
 * Body, labels and controls: Source Sans 3 — the humanist sans Coursera's
 * own face descends from. Built for reading on screens, with clear
 * numerals for prices and counts.
 */
const sans = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

/**
 * Titles and big numbers: a confident geometric sans that keeps its
 * shape at banner sizes, where a text face starts to look thin.
 */
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
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
      className={`${sans.variable} ${display.variable} ${brandFont.variable}`}
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

          {/*
            Sign-in and sign-up pages leave all of this out (SiteChrome).
            The assistant comes last so it sits above the page without a
            z-index contest, and after the footer in the tab order — it's an
            aside, and a keyboard user shouldn't meet it before the content
            they came for.
          */}
          <SiteChrome
            header={
              <>
                <AnnouncementBar />
                <SiteHeader />
              </>
            }
            footer={<SiteFooter />}
            floating={<AssistantLauncher />}
          >
            {children}
          </SiteChrome>
        </AuthProvider>
      </body>
    </html>
  );
}

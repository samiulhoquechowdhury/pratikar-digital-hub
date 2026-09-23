import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";

import { AssistantLauncher } from "@/features/assistant";
import { SiteFooter } from "@/shared/components/SiteFooter";
import { SiteHeader } from "@/shared/components/SiteHeader";
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

export const metadata: Metadata = {
  title: {
    default: "Pratikar Digital Hub",
    template: "%s — Pratikar Digital Hub",
  },
  description: "Legal documents, courses, and resources.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${displaySerif.variable}`}>
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

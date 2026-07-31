import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AuthProvider } from "@/shared/providers/AuthProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Pratikar Admin",
    template: "%s — Pratikar Admin",
  },
  // Staff tooling should never be indexed, whatever robots.txt happens to say.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

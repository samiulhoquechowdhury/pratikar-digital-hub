import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pratikar Digital Hub",
  description: "Legal documents, courses, and resources.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

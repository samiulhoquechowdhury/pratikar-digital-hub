import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AccountShell } from "@/features/dashboard";

export const metadata: Metadata = {
  title: { template: "%s · Your account", default: "Your account" },
  // Private pages: nothing here is for a search engine.
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}

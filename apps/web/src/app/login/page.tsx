import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel } from "@/features/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  // AuthPanel reads ?next= through useSearchParams, which Next requires to sit
  // inside a Suspense boundary so the rest of the route can still prerender.
  return (
    <Suspense>
      <AuthPanel mode="signin" />
    </Suspense>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthPanel } from "@/features/auth";

export const metadata: Metadata = { title: "Create an account" };

/**
 * A separate route from /login even though the mechanics are identical:
 * "Sign up" and "Log in" are the two buttons people look for in a header, and
 * sending both to one page that says "Sign in" makes the site feel closed to
 * newcomers. Only the copy differs.
 */
export default function SignupPage() {
  return (
    <Suspense>
      <AuthPanel mode="signup" />
    </Suspense>
  );
}

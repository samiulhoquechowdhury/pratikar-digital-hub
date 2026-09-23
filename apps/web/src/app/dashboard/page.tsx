import { DashboardView } from "@/features/dashboard";

export const metadata = { title: "Your account" };

// The page is a shell: the account is one thing to load and one thing to lay
// out, so it lives in features/dashboard rather than being assembled here.
export default function DashboardPage() {
  return <DashboardView />;
}

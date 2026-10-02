import { AccountPageHeader, AccountSettings } from "@/features/dashboard";

export const metadata = { title: "Account settings" };

export default function SettingsPage() {
  return (
    <>
      <AccountPageHeader
        title="Account settings"
        description="Your name, how you sign in, and signing out."
      />
      <AccountSettings />
    </>
  );
}

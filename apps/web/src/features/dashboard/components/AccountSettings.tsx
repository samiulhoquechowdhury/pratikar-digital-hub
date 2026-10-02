"use client";

import { Alert, Button, Field, Input, Skeleton } from "@pratikar/ui";
import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Icon } from "@/shared/components/Icon";
import { apiClient } from "@/shared/lib/apiClient";
import { useAuth } from "@/shared/providers/AuthProvider";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

const accountApi = {
  me: () => apiClient.get<Profile>("/users/me"),
  updateName: (name: string) => apiClient.patch<Profile>("/users/me", { name }),
};

/**
 * Who the account belongs to, and how to leave it.
 *
 * Only the name is editable: email and phone are how the account signs in,
 * so changing them needs a code sent to the new address — which is a flow of
 * its own, not a text box.
 */
export function AccountSettings() {
  const router = useRouter();
  const { updateUser, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    accountApi
      .me()
      .then((loaded) => {
        setProfile(loaded);
        setName(loaded.name ?? "");
      })
      .catch(() => setLoadError(true));
  }, []);

  const save = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setSaveError("Enter the name you'd like on invoices and certificates.");
      return;
    }
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    accountApi
      .updateName(trimmed)
      .then((updated) => {
        setProfile(updated);
        setName(updated.name ?? "");
        updateUser({ name: updated.name });
        setSaved(true);
      })
      .catch(() => setSaveError("Couldn't save your name. Please try again."))
      .finally(() => setSaving(false));
  };

  const signOut = async (allDevices: boolean) => {
    await logout(allDevices);
    router.push("/");
  };

  return (
    <div className="space-y-8">
      <section
        aria-labelledby="profile-title"
        className="rounded-card border border-line bg-surface p-6"
      >
        <h3 id="profile-title" className="text-lg font-semibold">
          Profile
        </h3>
        {loadError ? (
          <div className="mt-4">
            <Alert tone="danger" role="alert">
              Couldn&apos;t load your profile. Please reload the page.
            </Alert>
          </div>
        ) : !profile ? (
          <div className="mt-4 space-y-3" role="status" aria-busy="true">
            <span className="sr-only">Loading your profile…</span>
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-5 w-64" />
          </div>
        ) : (
          <>
            <form onSubmit={save} className="mt-4 max-w-md space-y-4">
              <Field
                label="Full name"
                htmlFor="profile-name"
                hint="Shown on your invoices and course certificates."
                error={saveError ?? undefined}
              >
                <Input
                  id="profile-name"
                  value={name}
                  maxLength={80}
                  autoComplete="name"
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                />
              </Field>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                {saved && (
                  <span role="status" className="text-sm text-success-text">
                    Saved
                  </span>
                )}
              </div>
            </form>

            <dl className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
              <Detail label="Email" value={profile.email} />
              <Detail label="Phone" value={profile.phone} />
              <Detail
                label="Member since"
                value={new Date(profile.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            </dl>
            <p className="mt-4 text-xs text-ink-muted">
              Your email and phone are how you sign in. To change either,
              contact support from the Contact page.
            </p>
          </>
        )}
      </section>

      <section
        aria-labelledby="security-title"
        className="rounded-card border border-line bg-surface p-6"
      >
        <h3
          id="security-title"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Icon icon={ShieldCheck} className="text-primary" />
          Signing in
        </h3>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          Signing in on a new device keeps your other devices signed in. If
          you&apos;ve used a shared or lost device, sign out everywhere.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => void signOut(false)}>
            <Icon icon={LogOut} />
            Sign out
          </Button>
          <Button variant="danger" onClick={() => void signOut(true)}>
            Sign out of all devices
          </Button>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink">{value ?? "Not added"}</dd>
    </div>
  );
}

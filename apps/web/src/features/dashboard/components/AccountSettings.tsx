"use client";

import { GST_STATE_NAMES } from "@pratikar/types";
import { Alert, Button, Field, Input, Select, Skeleton } from "@pratikar/ui";
import { Bell, LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { PushOptIn } from "@/features/notifications";
import { Icon } from "@/shared/components/Icon";
import { apiClient } from "@/shared/lib/apiClient";
import { useAuth } from "@/shared/providers/AuthProvider";

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  addressLine: string | null;
  city: string | null;
  stateCode: string | null;
  pincode: string | null;
}

/** What the form edits — every field a string while it's being typed. */
interface Draft {
  name: string;
  addressLine: string;
  city: string;
  stateCode: string;
  pincode: string;
}

const draftOf = (profile: Profile): Draft => ({
  name: profile.name ?? "",
  addressLine: profile.addressLine ?? "",
  city: profile.city ?? "",
  stateCode: profile.stateCode ?? "",
  pincode: profile.pincode ?? "",
});

/** States by name, for the dropdown. */
const STATES = Object.entries(GST_STATE_NAMES).sort(([, a], [, b]) =>
  a.localeCompare(b),
);

const accountApi = {
  me: () => apiClient.get<Profile>("/users/me"),
  // Empty boxes are sent as null, which clears the field on the server.
  update: (draft: Draft) =>
    apiClient.patch<Profile>("/users/me", {
      name: draft.name.trim(),
      addressLine: draft.addressLine.trim() || null,
      city: draft.city.trim() || null,
      stateCode: draft.stateCode || null,
      pincode: draft.pincode.trim() || null,
    }),
};

/**
 * Who the account belongs to, where to bill them, and how to leave.
 *
 * The name and billing address are editable. The state matters most: it
 * decides whether an invoice carries IGST or CGST + SGST. Email and phone
 * are how the account signs in, so changing them needs a code sent to the
 * new address — which is a flow of its own, not a text box.
 */
export function AccountSettings() {
  const router = useRouter();
  const { updateUser, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>(
    {},
  );

  useEffect(() => {
    accountApi
      .me()
      .then((loaded) => {
        setProfile(loaded);
        setDraft(draftOf(loaded));
      })
      .catch(() => setLoadError(true));
  }, []);

  const change = (field: keyof Draft, value: string) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaved(false);
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const problems: Partial<Record<keyof Draft, string>> = {};
    if (!draft.name.trim()) {
      problems.name = "Enter the name you'd like on invoices and certificates.";
    }
    if (draft.pincode.trim() && !/^[1-9]\d{5}$/.test(draft.pincode.trim())) {
      problems.pincode = "Enter a 6-digit PIN code.";
    }
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    setSaved(false);
    setSaveError(null);
    accountApi
      .update(draft)
      .then((updated) => {
        setProfile(updated);
        setDraft(draftOf(updated));
        updateUser({ name: updated.name });
        setSaved(true);
      })
      .catch(() =>
        setSaveError("Couldn't save your details. Please try again."),
      )
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
            <form onSubmit={save} className="mt-4 space-y-5" noValidate>
              <div className="max-w-md">
                <Field
                  label="Full name"
                  htmlFor="profile-name"
                  hint="Shown on your invoices and course certificates."
                  error={errors.name}
                >
                  <Input
                    id="profile-name"
                    value={draft?.name ?? ""}
                    maxLength={80}
                    autoComplete="name"
                    onChange={(event) => change("name", event.target.value)}
                  />
                </Field>
              </div>

              <fieldset className="space-y-4 border-t border-line pt-5">
                <legend className="text-base font-semibold text-ink">
                  Billing address
                </legend>
                <p className="-mt-2 text-sm text-ink-muted">
                  Printed on your invoices. Your state decides how GST is
                  charged — leave it blank and invoices are billed as within our
                  state.
                </p>
                <div className="max-w-xl">
                  <Field label="Address" htmlFor="profile-address">
                    <Input
                      id="profile-address"
                      value={draft?.addressLine ?? ""}
                      maxLength={200}
                      autoComplete="street-address"
                      placeholder="House, street, area"
                      onChange={(event) =>
                        change("addressLine", event.target.value)
                      }
                    />
                  </Field>
                </div>
                <div className="grid max-w-xl gap-4 sm:grid-cols-[1fr_1fr_8rem]">
                  <Field label="City" htmlFor="profile-city">
                    <Input
                      id="profile-city"
                      value={draft?.city ?? ""}
                      maxLength={80}
                      autoComplete="address-level2"
                      onChange={(event) => change("city", event.target.value)}
                    />
                  </Field>
                  <Field label="State" htmlFor="profile-state">
                    <Select
                      id="profile-state"
                      value={draft?.stateCode ?? ""}
                      autoComplete="address-level1"
                      onChange={(event) =>
                        change("stateCode", event.target.value)
                      }
                    >
                      <option value="">Choose…</option>
                      {STATES.map(([code, label]) => (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="PIN code"
                    htmlFor="profile-pincode"
                    error={errors.pincode}
                  >
                    <Input
                      id="profile-pincode"
                      value={draft?.pincode ?? ""}
                      inputMode="numeric"
                      maxLength={6}
                      autoComplete="postal-code"
                      onChange={(event) =>
                        change("pincode", event.target.value)
                      }
                    />
                  </Field>
                </div>
              </fieldset>

              {saveError && (
                <Alert tone="danger" role="alert">
                  {saveError}
                </Alert>
              )}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
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
        id="notifications"
        aria-labelledby="notifications-title"
        className="scroll-mt-28 rounded-card border border-line bg-surface p-6"
      >
        <h3
          id="notifications-title"
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <Icon icon={Bell} className="text-primary" />
          Notifications
        </h3>
        <p className="mt-2 max-w-xl text-sm text-ink-muted">
          When an advocate finishes reviewing your document we tell you by
          email, by SMS to your phone number, in the bell at the top of the site
          — and, if you turn it on, with a notification on this device.
        </p>
        <div className="mt-5">
          <PushOptIn />
        </div>
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

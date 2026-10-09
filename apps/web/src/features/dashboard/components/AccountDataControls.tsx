"use client";

import { Alert, Button, Field, Input } from "@pratikar/ui";
import { Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/shared/components/Icon";
import { apiClient } from "@/shared/lib/apiClient";
import { useAuth } from "@/shared/providers/AuthProvider";

/** What the customer types to confirm. Mirrors DeleteAccountDto. */
const CONFIRM_WORD = "DELETE";

/** Why the server said no, in the customer's words. */
export function deleteErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("REVIEW_IN_PROGRESS"))
    return "An advocate is still reviewing one of your documents. You can delete your account once it's returned — or contact support to cancel the review.";
  if (message.includes("PAYMENT_IN_PROGRESS"))
    return "A payment you started is still being confirmed. Please try again in an hour.";
  if (message.includes("STAFF_ACCOUNT"))
    return "Staff accounts are removed by an administrator, not from here.";
  if (message.includes("429"))
    return "Too many attempts. Please try again later.";
  return "Couldn't delete your account. Please try again, or contact support.";
}

/** Saves an object as a .json download, named for today. */
function saveJson(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pratikar-my-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * The customer's rights over their data under the DPDP Act, as the privacy
 * policy promises them: a copy of everything held about them, and erasure.
 * Self-service, so neither waits on an email to the Grievance Officer.
 */
export function AccountDataControls() {
  const router = useRouter();
  const { logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const download = async () => {
    setExporting(true);
    setExportError(false);
    try {
      saveJson(await apiClient.get("/users/me/export"));
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  };

  const erase = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.del("/users/me", { confirm: CONFIRM_WORD });
      // The server has already ended every session; this clears the tab.
      await logout();
      router.push("/");
    } catch (error) {
      setDeleteError(deleteErrorMessage(error));
      setDeleting(false);
    }
  };

  return (
    <section
      id="your-data"
      aria-labelledby="data-title"
      className="scroll-mt-28 rounded-card border border-line bg-surface p-6"
    >
      <h3 id="data-title" className="text-lg font-semibold">
        Your data
      </h3>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <p className="max-w-xl text-sm text-ink-muted">
          Download a copy of everything we hold about you — your profile,
          orders, documents and their answers, courses and notifications — as a
          file.
        </p>
        <Button
          variant="secondary"
          onClick={() => void download()}
          loading={exporting}
          loadingLabel="Preparing…"
        >
          <Icon icon={Download} />
          Download my data
        </Button>
        {exportError && (
          <div className="w-full">
            <Alert tone="danger" role="alert">
              Couldn&apos;t prepare your data. Please try again.
            </Alert>
          </div>
        )}
      </div>

      <div className="pt-6">
        <h4 className="text-base font-semibold text-ink">Delete my account</h4>
        <ul className="mt-2 max-w-xl list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>
            Your name, email, phone and address, your documents and their files,
            and your notifications are erased.
          </li>
          <li>
            Invoices and payment records are kept, without your details, for as
            long as tax law requires.
          </li>
          <li>
            Your course certificates stay valid but no longer show your name.
          </li>
          <li>This can&apos;t be undone. Download anything you need first.</li>
        </ul>

        {!confirming ? (
          <div className="mt-4">
            <Button variant="danger" onClick={() => setConfirming(true)}>
              <Icon icon={Trash2} />
              Delete my account
            </Button>
          </div>
        ) : (
          <form
            className="mt-4 max-w-sm space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (typed === CONFIRM_WORD) void erase();
            }}
          >
            <Field
              label={`Type ${CONFIRM_WORD} to confirm`}
              htmlFor="confirm-delete"
            >
              <Input
                id="confirm-delete"
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
              />
            </Field>
            {deleteError && (
              <Alert tone="danger" role="alert">
                {deleteError}
              </Alert>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                variant="danger"
                disabled={typed !== CONFIRM_WORD}
                loading={deleting}
                loadingLabel="Deleting…"
              >
                Permanently delete
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setConfirming(false);
                  setTyped("");
                  setDeleteError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

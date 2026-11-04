import { GST_STATE_NAMES } from "@pratikar/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { File, Paths } from "expo-file-system";
import { router, Stack } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { OptionPicker } from "@/components/OptionPicker";
import { Text } from "@/components/Typography";
import { Button, Field, Notice, StateView } from "@/components/ui";
import type { CustomerProfile } from "@/features/documents/prefill";
import { api } from "@/lib/api";
import { confirmAction, IS_WEB } from "@/lib/platform";
import { colors, radius, space, text } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

/** What the customer types to confirm. Mirrors DeleteAccountDto. */
const CONFIRM_WORD = "DELETE";

const STATES = [
  { value: "", label: "Not set" },
  ...Object.entries(GST_STATE_NAMES)
    .sort(([, a], [, b]) => a.localeCompare(b))
    .map(([value, label]) => ({ value, label })),
];

function deleteErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("REVIEW_IN_PROGRESS"))
    return "An advocate is still reviewing one of your documents. You can delete your account once it's returned — or contact support to cancel the review.";
  if (message.includes("PAYMENT_IN_PROGRESS"))
    return "A payment you started is still being confirmed. Please try again in an hour.";
  return "Couldn't delete your account. Please try again, or contact support.";
}

/**
 * Profile and privacy: name and billing address (they go on invoices and
 * certificates), a copy of everything held, and erasing the account. Email
 * and phone aren't editable — they're how the account signs in.
 */
export default function SettingsScreen() {
  const { updateUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<CustomerProfile>("/users/me"),
  });

  const [name, setName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [pincode, setPincode] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const p = profile.data;
    if (!p) return;
    setName(p.name ?? "");
    setAddressLine(p.addressLine ?? "");
    setCity(p.city ?? "");
    setStateCode(p.stateCode ?? "");
    setPincode(p.pincode ?? "");
  }, [profile.data]);

  if (profile.isPending) return <StateView loading />;
  if (profile.isError || !profile.data) {
    return (
      <StateView
        title="Couldn't load your details"
        action={
          <Button label="Try again" onPress={() => void profile.refetch()} />
        }
      />
    );
  }

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.patch("/users/me", {
        name,
        addressLine,
        city,
        stateCode,
        pincode,
      });
      updateUser({ name: name.trim() });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setSaved(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      setError(
        message.includes("pincode")
          ? "The PIN code should be 6 digits."
          : message.includes("name")
            ? "Enter your name — it goes on invoices and certificates."
            : "Couldn't save your details. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    setExportError(false);
    try {
      const data = await api.get<unknown>("/users/me/export");
      if (IS_WEB) {
        // The browser preview saves it as a download, as the website does.
        const link = document.createElement("a");
        link.href = URL.createObjectURL(
          new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          }),
        );
        link.download = "pratikar-my-data.json";
        link.click();
        URL.revokeObjectURL(link.href);
        return;
      }
      const file = new File(Paths.cache, "pratikar-my-data.json");
      if (file.exists) file.delete();
      file.create();
      // Written before the share sheet opens, or it shares an empty file.
      await file.write(JSON.stringify(data, null, 2));
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Your Pratikar data",
      });
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
      await api.del("/users/me", { confirm: CONFIRM_WORD });
      await logout();
      router.replace("/");
    } catch (e) {
      setDeleteError(deleteErrorMessage(e));
      setDeleting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Profile and privacy" }} />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={text.heading}>Your details</Text>
          <Text style={text.small}>
            Signed in as {profile.data.email ?? profile.data.phone}. To change
            it, contact support.
          </Text>
          <Field
            label="Full name"
            value={name}
            onChangeText={setName}
            maxLength={80}
            autoComplete="name"
            hint="It goes on your invoices and certificates."
          />
          <Field
            label="Street address"
            value={addressLine}
            onChangeText={setAddressLine}
            maxLength={200}
            autoComplete="street-address"
          />
          <Field
            label="City"
            value={city}
            onChangeText={setCity}
            maxLength={80}
          />
          <OptionPicker
            label="State"
            options={STATES}
            value={stateCode}
            onChange={setStateCode}
            placeholder="Not set"
            hint="It decides the GST on your invoices."
          />
          <Field
            label="PIN code"
            value={pincode}
            onChangeText={(v) => setPincode(v.replace(/\D/g, ""))}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="postal-code"
          />
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {saved ? <Notice tone="success">Saved.</Notice> : null}
          <Button
            label="Save details"
            loading={saving}
            disabled={!name.trim()}
            onPress={() => void save()}
          />
        </View>

        <View style={styles.section}>
          <Text style={text.heading}>Your data</Text>
          <Text style={text.muted}>
            Download a copy of everything we hold about you — your profile,
            documents, orders and courses.
          </Text>
          <Button
            label="Download my data"
            variant="secondary"
            loading={exporting}
            onPress={() => void exportData()}
          />
          {exportError ? (
            <Notice tone="danger">
              Couldn't prepare your data. Please try again.
            </Notice>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={text.heading}>Sessions</Text>
          <Button
            label="Log out on every device"
            variant="secondary"
            onPress={() =>
              confirmAction({
                title: "Log out everywhere?",
                message:
                  "Every phone and browser signed in to this account will be signed out.",
                confirmLabel: "Log out everywhere",
                destructive: true,
                onConfirm: () => void logout(true),
              })
            }
          />
        </View>

        <View style={[styles.section, styles.danger]}>
          <Text style={[text.heading, { color: colors.danger }]}>
            Delete your account
          </Text>
          <Text style={text.muted}>
            Your name, email, phone and address, your documents and their files,
            and your notifications are erased. Invoices and payment records are
            kept, without your details, for as long as tax law requires. Your
            course certificates stay valid but no longer show your name. This
            can't be undone — download anything you need first.
          </Text>
          <Field
            label={`Type ${CONFIRM_WORD} to confirm`}
            value={confirm}
            onChangeText={setConfirm}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {deleteError ? <Notice tone="danger">{deleteError}</Notice> : null}
          <Button
            label="Permanently delete"
            loading={deleting}
            disabled={confirm !== CONFIRM_WORD}
            onPress={() => void erase()}
            style={{
              backgroundColor: colors.danger,
              borderColor: colors.danger,
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
  section: { gap: space.md },
  danger: {
    padding: space.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.dangerSubtle,
  },
});

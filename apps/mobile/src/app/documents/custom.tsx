import { GST_STATE_NAMES } from "@pratikar/types";
import { grossPaise } from "@pratikar/utils";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  BadgeCheck,
  Download,
  FilePenLine,
  Sparkles,
} from "lucide-react-native";
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
import { Button, Chip, Field, Notice } from "@/components/ui";
import { documentsApi } from "@/features/documents/documentsApi";
import { formatPrice } from "@/lib/format";
import { colors, radius, space, text, shadow } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

/** Mirrors DRAFT_LIMITS in the API's draft-custom.dto.ts. */
const DRAFT_LIMITS = { documentType: 120, details: 4000, minDetails: 20 };

/** Starting points, not a menu: anything can be typed. */
const SUGGESTIONS = [
  "Leave and licence agreement",
  "Affidavit",
  "Legal notice for unpaid dues",
  "Partnership deed",
  "Power of attorney",
  "Non-disclosure agreement",
  "Will",
  "Employment agreement",
];

const STATES = [
  { value: "", label: "Not sure / leave blank" },
  ...Object.entries(GST_STATE_NAMES)
    .sort(([, a], [, b]) => a.localeCompare(b))
    .map(([value, label]) => ({ value, label })),
];

const STEPS = [
  {
    icon: Sparkles,
    title: "AI drafts it",
    body: "From your description, in the format of our advocate-written documents. Preview it free and ask for changes.",
  },
  {
    icon: BadgeCheck,
    title: "An advocate reviews it",
    body: "A practising advocate checks and corrects the draft for you.",
  },
  {
    icon: Download,
    title: "You download it",
    body: "We notify you the moment it's ready — Word and PDF.",
  },
];

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("AI_NOT_CONFIGURED"))
    return "AI drafting is unavailable right now. Please try again later.";
  if (message.includes("DRAFT_LIMIT_REACHED") || message.includes("429"))
    return "You've started a lot of drafts today. Please try again tomorrow, or finish one you've started.";
  return "Couldn't start your draft. Please try again.";
}

/**
 * Describe any document and the AI drafts it — the website's
 * CustomDraftForm. Free to draft and preview; the advocate review is what's
 * paid for, and what unlocks the download. ?type= prefills the kind (from
 * Pratikar AI); ?from= restarts a failed draft from what was written.
 */
export default function CustomDraftScreen() {
  const { user, isRestoring } = useAuth();
  const params = useLocalSearchParams<{ type?: string; from?: string }>();
  const [documentType, setDocumentType] = useState(
    () => params.type?.slice(0, DRAFT_LIMITS.documentType) ?? "",
  );
  const [stateCode, setStateCode] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pricing = useQuery({
    queryKey: ["draft-pricing"],
    queryFn: documentsApi.draftPricing,
  });

  useEffect(() => {
    if (!params.from || !user) return;
    let cancelled = false;
    documentsApi
      .getMine(params.from)
      .then((doc) => {
        if (cancelled || !doc.brief) return;
        setDocumentType(doc.brief.documentType);
        setDetails(doc.brief.details);
        setStateCode(doc.brief.stateCode ?? "");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [params.from, user]);

  const tooShort = details.trim().length < DRAFT_LIMITS.minDetails;
  const canSubmit = documentType.trim().length >= 3 && !tooShort && !submitting;
  const unavailable = pricing.data?.available === false;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { id } = await documentsApi.draftCustom({
        documentType: documentType.trim(),
        details: details.trim(),
        ...(stateCode ? { stateCode } : {}),
      });
      router.replace({ pathname: "/account/documents/[id]", params: { id } });
    } catch (cause) {
      setError(errorMessage(cause));
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen options={{ title: "Draft with AI" }} />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: space.sm }}>
          <Text style={styles.kind}>Pratikar AI</Text>
          <Text style={text.title}>Any document, drafted for you</Text>
          <Text style={text.muted}>
            Describe what you need. The AI drafts it, an advocate reviews it,
            and you download it.
          </Text>
        </View>

        <View style={styles.steps}>
          {STEPS.map((step) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.stepIcon}>
                <step.icon color={colors.primary} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={text.subheading}>{step.title}</Text>
                <Text style={text.small}>{step.body}</Text>
              </View>
            </View>
          ))}
          {pricing.data ? (
            <Text style={text.small}>
              Free to draft and preview. Advocate review{" "}
              {formatPrice(grossPaise(pricing.data.reviewPriceInPaise))} incl.
              GST, with up to {pricing.data.maxRevisions} free changes before
              it.
            </Text>
          ) : null}
        </View>

        {unavailable ? (
          <Notice tone="warning">
            AI drafting is unavailable right now. You can still browse our
            ready-made document templates.
          </Notice>
        ) : null}

        <Field
          label="What document do you need?"
          value={documentType}
          maxLength={DRAFT_LIMITS.documentType}
          onChangeText={setDocumentType}
          placeholder="e.g. Leave and licence agreement for a flat"
          hint="Name it the way you would to a lawyer."
        />
        <View style={styles.chips}>
          {SUGGESTIONS.map((suggestion) => (
            <Chip
              key={suggestion}
              label={suggestion}
              selected={documentType === suggestion}
              onPress={() => setDocumentType(suggestion)}
            />
          ))}
        </View>

        <OptionPicker
          label="State (optional)"
          options={STATES}
          value={stateCode}
          onChange={setStateCode}
          placeholder="Not sure / leave blank"
          hint="Where it will be signed — it decides the stamp-paper and jurisdiction wording."
        />

        <Field
          label="Describe the details"
          value={details}
          maxLength={DRAFT_LIMITS.details}
          onChangeText={setDetails}
          multiline
          placeholder="e.g. I, Asha Rao of Kothrud, Pune, am giving my 2BHK flat on leave and licence to Vikram Sen for 11 months from 1 November 2026. Rent ₹25,000 a month, deposit ₹1,00,000…"
          hint={`Who the parties are, amounts, dates, places and any terms you want. ${details.length}/${DRAFT_LIMITS.details}`}
          style={{ minHeight: 180, textAlignVertical: "top", paddingTop: 12 }}
        />

        {error ? <Notice tone="danger">{error}</Notice> : null}

        {!user && !isRestoring ? (
          <View style={{ gap: space.sm }}>
            <Text style={text.muted}>
              Log in to draft — your document is saved to your account.
            </Text>
            <Button
              label="Log in to continue"
              onPress={() => router.push("/login")}
            />
          </View>
        ) : (
          <Button
            label={submitting ? "Starting your draft…" : "Draft my document"}
            icon={<FilePenLine color={colors.onPrimary} size={18} />}
            disabled={!canSubmit || unavailable}
            loading={submitting}
            onPress={() => void submit()}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
  kind: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.goldText,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  steps: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
  step: { flexDirection: "row", gap: space.md },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.control,
    backgroundColor: colors.banner.lilac,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: -space.sm,
  },
});

import type { Template } from "@pratikar/types";
import { grossPaise } from "@pratikar/utils";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { PencilLine, Sparkles } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { Button, Notice, StateView } from "@/components/ui";
import {
  catalogueApi,
  templateCategoryLabel,
} from "@/features/catalogue/catalogueApi";
import { DocumentActions } from "@/features/documents/DocumentActions";
import { DocumentFillChat } from "@/features/documents/DocumentFillChat";
import { DocumentPreview } from "@/features/documents/DocumentPreview";
import { DynamicForm, type FilledData } from "@/features/documents/DynamicForm";
import { useGenerateDocument } from "@/features/documents/useGenerateDocument";
import {
  useSavedDetails,
  type SavedDetails,
} from "@/features/documents/useSavedDetails";
import { formatDate, formatPrice } from "@/lib/format";
import { colors, radius, space, text, shadow } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

const STEPS = [
  {
    title: "Answer the questions",
    body: "Plain language, one field at a time. Generating is free.",
  },
  {
    title: "Check the preview",
    body: "Every page, watermarked. Change any answer and generate again, free.",
  },
  {
    title: "Pay and download",
    body: "Word and PDF, ready to print and sign. One download, so keep the files safe.",
  },
];

/**
 * A template: what it is, what you'll be asked, and — once logged in — the
 * form (or a chat that fills it), the preview, payment and download. The
 * website's TemplateGenerator.
 */
export default function TemplateScreen() {
  const { id, fill } = useLocalSearchParams<{ id: string; fill?: string }>();
  const { user } = useAuth();
  const template = useQuery({
    queryKey: ["template", id],
    queryFn: () => catalogueApi.template(id),
  });
  const gen = useGenerateDocument(id);

  if (template.isPending) return <StateView loading />;
  if (template.isError || !template.data) {
    return (
      <StateView
        title="This template isn't available"
        body="It may have been unpublished, or the link may be wrong."
        action={
          <Button
            label="All templates"
            onPress={() => router.replace("/documents")}
          />
        }
      />
    );
  }
  const t = template.data;
  const questions = t.fieldSchema.length;

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: "Template" }} />
      <View style={{ gap: space.sm }}>
        <Text style={styles.kind}>Document template</Text>
        <Text style={text.title}>{t.title}</Text>
        <Text style={text.muted}>
          {templateCategoryLabel(t.category)} · {questions}{" "}
          {questions === 1 ? "question" : "questions"} · Word + PDF
        </Text>
      </View>

      {gen.result ? (
        <View style={{ gap: space.xl }}>
          <DocumentPreview documentId={gen.result.id} />
          <View style={styles.editRow}>
            <Text style={[text.muted, { flex: 1 }]}>
              Spotted a mistake? Change your answers and generate again — it's
              free until you pay.
            </Text>
            <Button
              label="Edit answers"
              variant="secondary"
              icon={<PencilLine color={colors.primary} size={18} />}
              onPress={gen.edit}
            />
          </View>
          <DocumentActions
            documentId={gen.result.id}
            template={t}
            initialStatus={gen.result.status}
          />
        </View>
      ) : (
        <>
          <View style={styles.priceCard}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: space.sm,
              }}
            >
              <Text style={styles.price}>
                {formatPrice(grossPaise(t.priceInPaise))}
              </Text>
              <Text style={text.small}>incl. GST</Text>
            </View>
            <Text style={text.muted}>
              Generating and previewing are free — you pay only to download.
              {t.reviewPriceInPaise > 0
                ? ` Advocate review ${formatPrice(grossPaise(t.reviewPriceInPaise))} extra, if you want one.`
                : ""}
            </Text>
            {STEPS.map((step, index) => (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepNo}>
                  <Text style={styles.stepNoText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={text.subheading}>{step.title}</Text>
                  <Text style={text.small}>{step.body}</Text>
                </View>
              </View>
            ))}
            {!user ? (
              <Button
                label="Log in to start"
                onPress={() => router.push("/login")}
              />
            ) : null}
          </View>

          {user ? (
            <FillOptions
              template={t}
              startInChat={fill === "chat"}
              initialAnswers={gen.answers}
              onSubmit={gen.generate}
              isSubmitting={gen.isSubmitting}
              error={gen.error}
            />
          ) : (
            <View style={{ gap: space.md }}>
              <Text style={text.heading}>What you'll be asked</Text>
              {questions > 0 ? (
                t.fieldSchema.map((field, index) => (
                  <View key={field.key} style={styles.question}>
                    <Text style={styles.qNo}>{index + 1}</Text>
                    <Text style={[text.body, { flex: 1 }]}>{field.label}</Text>
                    {!field.required ? (
                      <Text style={text.small}>Optional</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={text.muted}>
                  Nothing to fill in — the document is ready as it is.
                </Text>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

/** The form, or a conversation that fills it. Both end in the form. */
function FillOptions({
  template,
  startInChat,
  initialAnswers,
  onSubmit,
  isSubmitting,
  error,
}: {
  template: Template;
  startInChat: boolean;
  initialAnswers: FilledData | null;
  onSubmit: (answers: FilledData) => void | Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [mode, setMode] = useState<"form" | "chat">(
    startInChat ? "chat" : "form",
  );
  const [handedOver, setHandedOver] = useState<FilledData | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const saved = useSavedDetails(template);
  const [startFrom, setStartFrom] = useState<"profile" | "previous">("profile");
  const [formKey, setFormKey] = useState(0);

  return (
    <View style={{ gap: space.lg }}>
      {!aiUnavailable ? (
        <View style={styles.tabs} accessibilityRole="tablist">
          {(["form", "chat"] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === value }}
              onPress={() => setMode(value)}
              style={[styles.tab, mode === value && styles.tabOn]}
            >
              {value === "chat" ? (
                <Sparkles color={colors.primary} size={16} />
              ) : null}
              <Text
                style={[
                  styles.tabText,
                  mode === value && { color: colors.ink },
                ]}
              >
                {value === "form" ? "Fill in the form" : "Answer by chat"}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {mode === "chat" && !aiUnavailable ? (
        <DocumentFillChat
          template={template}
          onReview={(answers) => {
            setHandedOver(answers);
            setFormKey((k) => k + 1);
            setMode("form");
          }}
          onUnavailable={() => {
            setAiUnavailable(true);
            setMode("form");
          }}
        />
      ) : !saved.loaded && !handedOver && !initialAnswers ? (
        <StateView loading />
      ) : (
        <DynamicForm
          key={formKey}
          template={template}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
          initialValues={
            handedOver ??
            initialAnswers ??
            (startFrom === "previous" && saved.previous
              ? saved.previous.answers
              : saved.fromProfile)
          }
          notice={
            aiUnavailable ? (
              <Notice>
                Answering by chat isn't available right now — the form below
                does the same job.
              </Notice>
            ) : handedOver ? (
              <Notice tone="warning">
                These answers came from your conversation. AI can mishear, so
                check each one — especially names, amounts and dates — before
                you generate.
              </Notice>
            ) : initialAnswers ? undefined : (
              <SavedDetailsNotice
                saved={saved}
                startFrom={startFrom}
                onChange={(next) => {
                  setStartFrom(next);
                  setFormKey((k) => k + 1);
                }}
              />
            )
          }
        />
      )}
    </View>
  );
}

function SavedDetailsNotice({
  saved,
  startFrom,
  onChange,
}: {
  saved: SavedDetails;
  startFrom: "profile" | "previous";
  onChange: (next: "profile" | "previous") => void;
}) {
  const profileCount = Object.keys(saved.fromProfile).length;
  if (!saved.previous && profileCount === 0) return null;
  const lastDate = saved.previous ? formatDate(saved.previous.createdAt) : "";
  return (
    <View style={{ gap: space.sm }}>
      <Notice>
        {startFrom === "previous"
          ? `Filled in with your answers from ${lastDate}. Change anything that's different this time.`
          : profileCount > 0
            ? `We've filled in ${profileCount} ${profileCount === 1 ? "detail" : "details"} from your profile — check ${profileCount === 1 ? "it" : "them"} before you generate.`
            : `You made this document before, on ${lastDate}.`}
      </Notice>
      {saved.previous ? (
        <Button
          variant="secondary"
          label={
            startFrom === "previous"
              ? profileCount > 0
                ? "Use my profile details instead"
                : "Start fresh instead"
              : "Use my last answers"
          }
          onPress={() =>
            onChange(startFrom === "previous" ? "profile" : "previous")
          }
        />
      ) : null}
    </View>
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
  priceCard: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
  price: { fontSize: 28, fontWeight: "800", color: colors.ink },
  step: { flexDirection: "row", gap: space.md },
  stepNo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.banner.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNoText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  editRow: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
  question: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  qNo: { width: 22, fontSize: 13, color: colors.inkSubtle },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: space.md,
    marginRight: space.xl,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabOn: { borderBottomColor: colors.primary },
  tabText: { fontSize: 15, fontWeight: "600", color: colors.inkMuted },
});

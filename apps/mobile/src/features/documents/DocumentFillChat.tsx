import type { Template, TemplateField } from "@pratikar/types";
import {
  AlertTriangle,
  ArrowUp,
  CheckCircle2,
  Circle,
  Sparkles,
} from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { Text, TextInput } from "@/components/Typography";
import { Button } from "@/components/ui";
import {
  classifyChatError,
  type ChatFailure,
} from "@/features/assistant/assistantApi";
import { ApiError } from "@/lib/api";
import { colors, radius, space, text, shadow } from "@/lib/theme";

import type { FilledData } from "./DynamicForm";
import {
  documentFillApi,
  FILL_LIMITS,
  type FillReply,
  type FillTurn,
} from "./documentFillApi";

const FAILURES: Record<Exclude<ChatFailure, "not-configured">, string> = {
  busy: "I'm getting a lot of requests right now. Please try again in a moment.",
  "too-fast": "That was quick — wait a minute, then try again.",
  failed:
    "Something went wrong on our side. Please try again, or use the form.",
};

/** How an answer reads back — the option's label, a real date. */
function display(field: TemplateField, value: string | number | undefined) {
  if (value === undefined || value === "") return null;
  if (field.type === "select") {
    return (
      field.options?.find((o) => o.value === value)?.label ?? String(value)
    );
  }
  if (field.type === "date" && typeof value === "string") {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
  }
  if (typeof value === "number") return value.toLocaleString("en-IN");
  return value;
}

/**
 * Filling a template by conversation — the website's DocumentFillChat. It
 * never generates anything: it collects answers, shows each as it's
 * recorded, and hands them to the form, where the customer checks them.
 */
export function DocumentFillChat({
  template,
  onReview,
  onUnavailable,
}: {
  template: Template;
  onReview: (answers: FilledData) => void;
  onUnavailable: () => void;
}) {
  const [turns, setTurns] = useState<FillTurn[]>([]);
  const [state, setState] = useState<Omit<FillReply, "reply"> | null>(null);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);

  const answers = state?.answers ?? {};
  const unclear = new Set(state?.unclear.map((u) => u.key));

  const send = () => {
    const message = draft.trim().slice(0, FILL_LIMITS.maxTurnLength);
    if (!message || thinking) return;
    const next: FillTurn[] = [...turns, { role: "user", content: message }];
    setTurns(next);
    setDraft("");
    setThinking(true);
    documentFillApi
      .turn(template.id, next, answers)
      .then(({ reply, ...rest }) => {
        setState(rest);
        setTurns((t) => [...t, { role: "assistant", content: reply }]);
      })
      .catch((error: unknown) => {
        const reason =
          error instanceof ApiError
            ? classifyChatError(error.status, error.body)
            : "failed";
        if (reason === "not-configured") {
          onUnavailable();
          return;
        }
        setTurns((t) => [
          ...t,
          { role: "assistant", content: FAILURES[reason] },
        ]);
      })
      .finally(() => setThinking(false));
  };

  const answered = template.fieldSchema.filter(
    (f) => display(f, answers[f.key]) !== null,
  ).length;

  return (
    <View style={{ gap: space.lg }}>
      <View style={styles.caution}>
        <Sparkles color={colors.goldText} size={14} />
        <Text style={[text.small, { flex: 1 }]}>
          AI can mishear. Every answer is listed below, and you'll check them
          all in the form before anything is generated.
        </Text>
      </View>

      <View style={{ gap: space.md }} accessibilityLiveRegion="polite">
        <Text style={styles.assistant}>
          Tell me about your {template.title.toLowerCase()} in your own words —
          who it's between, amounts, dates. I'll ask for anything I still need.
        </Text>
        {turns.map((turn, index) => (
          <Text
            key={index}
            style={turn.role === "user" ? styles.user : styles.assistant}
          >
            {turn.content}
          </Text>
        ))}
        {thinking ? (
          <ActivityIndicator
            color={colors.inkSubtle}
            style={{ alignSelf: "flex-start" }}
          />
        ) : null}
      </View>

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Your answer"
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={FILL_LIMITS.maxTurnLength}
          placeholder="Type your answer…"
          placeholderTextColor={colors.inkSubtle}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={!draft.trim() || thinking}
          onPress={send}
          style={[styles.send, (!draft.trim() || thinking) && { opacity: 0.4 }]}
        >
          <ArrowUp color={colors.onPrimary} size={20} />
        </Pressable>
      </View>

      <View style={styles.answers}>
        <Text style={text.subheading}>
          Answers so far · {answered} of {template.fieldSchema.length}
        </Text>
        {template.fieldSchema.map((field) => {
          const shown = display(field, answers[field.key]);
          const doubtful = unclear.has(field.key);
          return (
            <View key={field.key} style={styles.answerRow}>
              {doubtful ? (
                <AlertTriangle color={colors.warning} size={16} />
              ) : shown ? (
                <CheckCircle2 color={colors.success} size={16} />
              ) : (
                <Circle color={colors.lineStrong} size={16} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={text.small}>{field.label}</Text>
                <Text
                  style={[text.body, !shown && { color: colors.inkSubtle }]}
                >
                  {shown ?? "Not yet"}
                  {doubtful ? " — please check" : ""}
                </Text>
              </View>
            </View>
          );
        })}
        <Button
          label={
            state?.complete ? "Check my answers" : "Check what I have so far"
          }
          variant={state?.complete ? "primary" : "secondary"}
          disabled={answered === 0}
          onPress={() => onReview(answers)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  caution: {
    flexDirection: "row",
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.control,
    backgroundColor: colors.banner.sand,
  },
  assistant: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    maxWidth: "90%",
  },
  user: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    overflow: "hidden",
  },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: space.sm },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 22,
    paddingHorizontal: space.lg,
    paddingVertical: 11,
    fontSize: 16,
    color: colors.ink,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  answers: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
  answerRow: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
});

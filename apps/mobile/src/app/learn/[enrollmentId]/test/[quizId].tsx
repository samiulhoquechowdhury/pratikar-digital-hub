import { useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Check, Clock, X } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { Button, Notice, StateView } from "@/components/ui";
import { useQuizAttempt } from "@/features/lms/useQuizAttempt";
import { confirmAction } from "@/lib/platform";
import { colors, radius, space, text } from "@/lib/theme";

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * One sitting of a lesson's test. Answers save as they're chosen, the clock
 * counts down to the server's deadline, and time running out submits.
 */
export default function QuizScreen() {
  const { enrollmentId, quizId } = useLocalSearchParams<{
    enrollmentId: string;
    quizId: string;
  }>();
  const queryClient = useQueryClient();
  const quiz = useQuizAttempt(quizId, enrollmentId);

  if (quiz.phase === "loading") return <StateView loading />;
  if (quiz.phase === "error" || !quiz.attempt) {
    return (
      <StateView
        title="Couldn't start this test"
        body={quiz.error ?? undefined}
        action={
          <Button label="Back to the lesson" onPress={() => router.back()} />
        }
      />
    );
  }

  if (quiz.phase === "done" && quiz.result) {
    const r = quiz.result;
    const passed = r.scorePercent >= r.passMark;
    const chosen = new Map(
      r.answers.map((a) => [a.questionId, a.selectedOptionId]),
    );
    return (
      <ScrollView contentContainerStyle={styles.body}>
        <Stack.Screen options={{ title: "Your result" }} />
        <View
          style={[
            styles.score,
            {
              backgroundColor: passed
                ? colors.successSubtle
                : colors.warningSubtle,
            },
          ]}
        >
          <Text style={styles.scoreValue}>{r.scorePercent}%</Text>
          <Text style={text.muted}>
            {passed
              ? "Well done — that's a pass."
              : `${r.passMark}% is the pass mark. Retakes are unlimited.`}
          </Text>
        </View>
        {[...r.questions]
          .sort((a, b) => a.order - b.order)
          .map((q, i) => {
            const picked = chosen.get(q.id);
            return (
              <View key={q.id} style={styles.question}>
                <Text style={text.subheading}>
                  {i + 1}. {q.prompt}
                </Text>
                {[...q.options]
                  .sort((a, b) => a.order - b.order)
                  .map((o) => (
                    <View key={o.id} style={styles.reviewOption}>
                      {o.isCorrect ? (
                        <Check color={colors.success} size={16} />
                      ) : o.id === picked ? (
                        <X color={colors.danger} size={16} />
                      ) : (
                        <View style={{ width: 16 }} />
                      )}
                      <Text
                        style={[
                          text.body,
                          { flex: 1 },
                          o.isCorrect && {
                            color: colors.success,
                            fontWeight: "600",
                          },
                          o.id === picked &&
                            !o.isCorrect && { color: colors.danger },
                        ]}
                      >
                        {o.text}
                        {o.id === picked ? "  (your answer)" : ""}
                      </Text>
                    </View>
                  ))}
              </View>
            );
          })}
        <Button
          label="Back to the course"
          onPress={() => {
            void queryClient.invalidateQueries({
              queryKey: ["outline", enrollmentId],
            });
            router.back();
          }}
        />
      </ScrollView>
    );
  }

  const a = quiz.attempt;
  const total = a.questions.length;
  const lowTime = quiz.secondsLeft !== null && quiz.secondsLeft <= 60;

  const confirmSubmit = () => {
    const unanswered = total - quiz.answeredCount;
    if (unanswered === 0) {
      void quiz.submit();
      return;
    }
    confirmAction({
      title: "Submit now?",
      message: `${unanswered} ${unanswered === 1 ? "question is" : "questions are"} still unanswered.`,
      confirmLabel: "Submit",
      onConfirm: () => void quiz.submit(),
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: a.title ?? "Lesson test" }} />
      <View style={styles.bar}>
        <Text style={text.small}>
          {quiz.answeredCount} of {total} answered
          {quiz.isSaving ? " · saving…" : ""}
        </Text>
        <View
          style={[
            styles.timer,
            lowTime && { backgroundColor: colors.dangerSubtle },
          ]}
        >
          <Clock color={lowTime ? colors.danger : colors.primary} size={14} />
          <Text
            accessibilityLabel={`${quiz.secondsLeft ?? 0} seconds left`}
            style={[styles.timerText, lowTime && { color: colors.danger }]}
          >
            {clock(quiz.secondsLeft ?? 0)}
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {quiz.error ? <Notice tone="danger">{quiz.error}</Notice> : null}
        {[...a.questions]
          .sort((x, y) => x.order - y.order)
          .map((q, i) => (
            <View key={q.id} style={styles.question}>
              <Text style={text.subheading}>
                {i + 1}. {q.prompt}
              </Text>
              {[...q.options]
                .sort((x, y) => x.order - y.order)
                .map((o) => {
                  const selected = quiz.selections[q.id] === o.id;
                  return (
                    <Pressable
                      key={o.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => quiz.choose(q.id, o.id)}
                      style={[styles.option, selected && styles.optionOn]}
                    >
                      <View
                        style={[styles.radio, selected && styles.radioOn]}
                      />
                      <Text style={[text.body, { flex: 1 }]}>{o.text}</Text>
                    </Pressable>
                  );
                })}
            </View>
          ))}
        <Button
          label="Submit answers"
          loading={quiz.phase === "submitting"}
          onPress={confirmSubmit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  timer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.banner.sky,
  },
  timerText: {
    fontWeight: "800",
    color: colors.primary,
    fontVariant: ["tabular-nums"],
  },
  question: { gap: space.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: 52,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.control,
  },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.banner.sky },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.lineStrong,
  },
  radioOn: { borderColor: colors.primary, borderWidth: 6 },
  score: {
    alignItems: "center",
    gap: space.sm,
    padding: space.xl,
    borderRadius: radius.card,
  },
  scoreValue: { fontSize: 44, fontWeight: "800", color: colors.ink },
  reviewOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    paddingVertical: 4,
  },
});

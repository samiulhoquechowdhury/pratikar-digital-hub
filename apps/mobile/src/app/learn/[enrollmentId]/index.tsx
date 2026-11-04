import type { OutlineModule } from "@pratikar/types";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Check, Lock, Play } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { Button, Notice, StateView } from "@/components/ui";
import { lmsApi } from "@/features/lms/lmsApi";
import { formatDate } from "@/lib/format";
import { colors, radius, space, text, shadow } from "@/lib/theme";

/**
 * The classroom: one lesson at a time, with the syllabus below it. Every
 * padlock here is mirrored by a check on the endpoint behind it — they're a
 * courtesy to the learner, not the enforcement.
 */
export default function ClassroomScreen() {
  const { enrollmentId } = useLocalSearchParams<{ enrollmentId: string }>();
  const outline = useQuery({
    queryKey: ["outline", enrollmentId],
    queryFn: () => lmsApi.getOutline(enrollmentId),
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Open on the first thing still to do.
  useEffect(() => {
    const o = outline.data;
    if (!o || activeId) return;
    const next =
      o.modules.find((m) => m.unlocked && !m.videoCompleted) ??
      o.modules.find((m) => m.unlocked && m.quiz?.attemptCount === 0) ??
      o.modules.find((m) => m.unlocked) ??
      o.modules[0];
    if (next) setActiveId(next.id);
  }, [outline.data, activeId]);

  if (outline.isPending) return <StateView loading />;
  if (outline.isError || !outline.data) {
    return (
      <StateView
        title="Couldn't load this course"
        action={
          <Button label="Try again" onPress={() => void outline.refetch()} />
        }
      />
    );
  }
  const o = outline.data;
  const active = o.modules.find((m) => m.id === activeId) ?? o.modules[0];

  const markWatched = async (moduleId: string) => {
    setBusy(true);
    setError(null);
    try {
      await lmsApi.completeModule(enrollmentId, moduleId);
      await outline.refetch();
    } catch {
      setError("Couldn't record that. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Stack.Screen options={{ title: o.courseTitle }} />
      {!o.hasVideoAccess ? (
        <Notice tone="warning">
          Your viewing window closed on {formatDate(o.expiresAt)}. Lessons are
          no longer playable, and any certificate you earned stays valid.
        </Notice>
      ) : null}
      {o.certificate ? (
        <Button
          variant="gold"
          label="View your certificate"
          onPress={() =>
            router.push({
              pathname: "/learn/[enrollmentId]/certificate",
              params: { enrollmentId },
            })
          }
        />
      ) : null}

      {active ? (
        <Lesson
          lesson={active}
          index={o.modules.findIndex((m) => m.id === active.id)}
          enrollmentId={enrollmentId}
          canWatch={o.hasVideoAccess}
          busy={busy}
          onMarkWatched={() => void markWatched(active.id)}
        />
      ) : (
        <Notice>This course has no lessons yet.</Notice>
      )}
      {error ? <Notice tone="danger">{error}</Notice> : null}

      <View style={{ gap: space.sm }}>
        <Text style={text.heading}>Lessons</Text>
        {o.modules.map((m, i) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityState={{
              disabled: !m.unlocked,
              selected: m.id === active?.id,
            }}
            disabled={!m.unlocked}
            onPress={() => setActiveId(m.id)}
            style={[
              styles.row,
              m.id === active?.id && styles.rowOn,
              !m.unlocked && { opacity: 0.55 },
            ]}
          >
            {m.videoCompleted ? (
              <Check color={colors.success} size={18} />
            ) : m.unlocked ? (
              <Play color={colors.noir} size={18} />
            ) : (
              <Lock color={colors.inkSubtle} size={18} />
            )}
            <Text style={[text.body, { flex: 1 }]}>
              {i + 1}. {m.title}
            </Text>
            {m.quiz?.bestScorePercent != null ? (
              <Text style={text.small}>{m.quiz.bestScorePercent}%</Text>
            ) : null}
          </Pressable>
        ))}
        {o.aggregateScorePercent !== null ? (
          <Text style={text.small}>
            Overall score {o.aggregateScorePercent}% · {o.passMark}% needed for
            the certificate
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function Lesson({
  lesson,
  index,
  enrollmentId,
  canWatch,
  busy,
  onMarkWatched,
}: {
  lesson: OutlineModule;
  index: number;
  enrollmentId: string;
  canWatch: boolean;
  busy: boolean;
  onMarkWatched: () => void;
}) {
  return (
    <View style={{ gap: space.lg }}>
      {/* Cloudflare Stream isn't connected, so there's no player yet — as on
          the website, the lesson says so rather than showing a dead video. */}
      <View style={styles.stage}>
        <Play color={colors.inkInverse} size={28} />
        <Text style={styles.stageTitle}>
          {canWatch
            ? "Video hosting isn't connected yet"
            : "Your viewing window has closed"}
        </Text>
        <Text style={styles.stageBody}>
          {canWatch
            ? "This lesson will play here once Cloudflare Stream is switched on. Everything else in the course works today."
            : "Lessons are no longer playable, but your progress and certificate are kept."}
        </Text>
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={text.small}>Lesson {index + 1}</Text>
        <Text style={text.heading}>{lesson.title}</Text>
        {lesson.videoCompleted ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.sm,
            }}
          >
            <Check color={colors.success} size={18} />
            <Text style={{ color: colors.success, fontWeight: "700" }}>
              Lesson completed
            </Text>
          </View>
        ) : (
          <>
            {/* PROVISIONAL, as on the website: it belongs to the player's
                playback events and comes out the day Stream lands. */}
            <Button
              label="Mark lesson as watched"
              loading={busy}
              disabled={!canWatch}
              onPress={onMarkWatched}
            />
            <Text style={text.small}>
              Becomes automatic once video hosting is connected.
            </Text>
          </>
        )}
      </View>

      {lesson.quiz ? (
        <View style={styles.quiz}>
          <Text style={text.subheading}>
            {lesson.quiz.title ?? "Lesson test"}
          </Text>
          <Text style={text.small}>
            {lesson.quiz.questionCount}{" "}
            {lesson.quiz.questionCount === 1 ? "question" : "questions"} ·{" "}
            {Math.round(lesson.quiz.timeLimitSeconds / 60)} minute limit
          </Text>
          {lesson.quiz.bestScorePercent !== null ? (
            <Text style={text.muted}>
              Best score {lesson.quiz.bestScorePercent}% of{" "}
              {lesson.quiz.attemptCount}{" "}
              {lesson.quiz.attemptCount === 1 ? "attempt" : "attempts"}
            </Text>
          ) : null}
          {lesson.quiz.unlocked ? (
            <>
              <Button
                label={
                  lesson.quiz.attemptCount > 0
                    ? "Retake the test"
                    : "Start the test"
                }
                onPress={() =>
                  router.push({
                    pathname: "/learn/[enrollmentId]/test/[quizId]",
                    params: { enrollmentId, quizId: lesson.quiz!.id },
                  })
                }
              />
              <Text style={text.small}>
                Retakes are unlimited — your best score counts.
              </Text>
            </>
          ) : (
            <View
              style={{
                flexDirection: "row",
                gap: space.sm,
                alignItems: "center",
              }}
            >
              <Lock color={colors.inkSubtle} size={16} />
              <Text style={text.small}>
                Finish the lesson above to unlock this test.
              </Text>
            </View>
          )}
        </View>
      ) : lesson.videoCompleted ? (
        <Text style={text.muted}>
          This lesson has no test. Pick the next lesson from the list.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
  stage: {
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    backgroundColor: colors.noir,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
    gap: space.sm,
  },
  stageTitle: {
    color: colors.inkInverse,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  stageBody: {
    color: colors.inkInverseMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  quiz: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: 52,
    paddingHorizontal: space.md,
    borderRadius: radius.control,
  },
  rowOn: { backgroundColor: colors.banner.sky },
});

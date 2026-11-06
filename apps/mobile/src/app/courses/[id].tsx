import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { Button, Notice, Pill, StateView } from "@/components/ui";
import { catalogueApi } from "@/features/catalogue/catalogueApi";
import { lmsApi } from "@/features/lms/lmsApi";
import { BuyPanel } from "@/features/payments/BuyPanel";
import { COURSES_LIVE } from "@/lib/features";
import { formatDate } from "@/lib/format";
import { colors, radius, space, text, shadow } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

/**
 * A course: what you get, the syllabus before you pay, and the price — or,
 * once enrolled, your progress and the way into the classroom.
 */
export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const course = useQuery({
    queryKey: ["course", id],
    queryFn: () => catalogueApi.course(id),
  });
  const enrollments = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: lmsApi.listMyEnrollments,
    enabled: !!user,
  });

  if (course.isPending) return <StateView loading />;
  if (course.isError || !course.data) {
    return (
      <StateView
        title="This course isn't available"
        body="It may have been unpublished, or the link may be wrong."
        action={
          <Button
            label="Browse courses"
            onPress={() => router.replace("/courses")}
          />
        }
      />
    );
  }
  const c = course.data;
  const enrollment = enrollments.data?.find((e) => e.courseId === c.id);
  const hasVideoAccess = enrollment
    ? new Date(enrollment.expiresAt) > new Date()
    : false;
  const moduleCount = c.modules?.length ?? 0;
  const completed = enrollment?.progress?.length ?? 0;

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Stack.Screen options={{ title: "Course" }} />
      <View style={{ gap: space.sm }}>
        <Text style={styles.kind}>Certificate course</Text>
        <Text style={text.title}>{c.title}</Text>
        <Text style={text.small}>
          {[
            ...(moduleCount > 0
              ? [`${moduleCount} ${moduleCount === 1 ? "lesson" : "lessons"}`]
              : []),
            `${c.accessDurationDays} days' access`,
            "Certificate included",
          ].join(" · ")}
        </Text>
        {c.description ? <Text style={text.muted}>{c.description}</Text> : null}
      </View>

      <View style={styles.card}>
        {enrollment ? (
          <View style={{ gap: space.md }}>
            <Pill
              label={hasVideoAccess ? "Active" : "Expired"}
              tone={hasVideoAccess ? "success" : "neutral"}
            />
            <Text style={text.muted}>
              Enrolled {formatDate(enrollment.enrolledAt)}. Video access{" "}
              {hasVideoAccess ? "runs until" : "ended on"}{" "}
              {formatDate(enrollment.expiresAt)}.
            </Text>
            {moduleCount > 0 ? (
              <View style={{ gap: space.xs }}>
                <Text style={text.small}>
                  {completed} of {moduleCount} lessons completed
                </Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${(completed / moduleCount) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            ) : null}
            <Button
              label={completed > 0 ? "Continue learning" : "Start learning"}
              onPress={() =>
                router.push({
                  pathname: "/learn/[enrollmentId]",
                  params: { enrollmentId: enrollment.id },
                })
              }
            />
            {!hasVideoAccess ? (
              <Notice tone="warning">
                Your viewing window has closed, so the lessons are no longer
                playable. Your certificate stays valid.
              </Notice>
            ) : null}
            {enrollment.certificate ? (
              <Button
                variant="secondary"
                label="View your certificate"
                onPress={() =>
                  router.push({
                    pathname: "/learn/[enrollmentId]/certificate",
                    params: { enrollmentId: enrollment.id },
                  })
                }
              />
            ) : null}
          </View>
        ) : COURSES_LIVE ? (
          <BuyPanel
            itemType="COURSE"
            itemId={c.id}
            label={c.title}
            priceInPaise={c.priceInPaise}
            buyLabel="Enrol now"
            onPaid={() => void enrollments.refetch()}
          />
        ) : (
          <Notice>
            Enrolment opens soon. Everything else on Pratikar is ready to use.
          </Notice>
        )}
      </View>

      {moduleCount > 0 ? (
        <View style={{ gap: space.sm }}>
          <Text style={text.heading}>What you'll learn</Text>
          {[...(c.modules ?? [])]
            .sort((a, b) => a.order - b.order)
            .map((module, index) => (
              <View key={module.id} style={styles.module}>
                <Text style={styles.moduleNo}>{index + 1}</Text>
                <Text style={[text.body, { flex: 1 }]}>{module.title}</Text>
                {enrollment?.progress?.some((p) => p.moduleId === module.id) ? (
                  <Check color={colors.success} size={18} />
                ) : null}
              </View>
            ))}
        </View>
      ) : null}
      {!user && COURSES_LIVE ? (
        <Text style={text.small}>
          Log in to enrol — your progress is saved to your account.
        </Text>
      ) : null}
    </ScrollView>
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
  card: {
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.raisedHigh,
    overflow: "hidden",
  },
  fill: { height: 8, backgroundColor: colors.primary },
  module: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  moduleNo: { width: 22, fontSize: 13, color: colors.inkSubtle },
});

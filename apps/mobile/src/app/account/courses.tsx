import { useQuery } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { BadgeCheck, ChevronRight } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { Button, Pill, StateView } from "@/components/ui";
import { lmsApi } from "@/features/lms/lmsApi";
import { formatDate } from "@/lib/format";
import { colors, radius, space, text, shadow } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

/** Courses on the account, with progress and certificates. */
export default function MyCoursesScreen() {
  const { user } = useAuth();
  const enrollments = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: lmsApi.listMyEnrollments,
    enabled: !!user,
  });

  return (
    <>
      <Stack.Screen options={{ title: "My courses" }} />
      {enrollments.isPending ? (
        <StateView loading />
      ) : (
        <FlatList
          data={enrollments.data}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{
            padding: space.lg,
            gap: space.md,
            flexGrow: 1,
          }}
          onRefresh={() => void enrollments.refetch()}
          refreshing={enrollments.isRefetching}
          ListEmptyComponent={
            <StateView
              title="No courses yet"
              body="Certificate courses you enrol in appear here."
              action={
                <Button
                  label="See the courses"
                  onPress={() => router.push("/courses")}
                />
              }
            />
          }
          renderItem={({ item }) => {
            const total =
              item.course._count?.modules ?? item.course.modules?.length ?? 0;
            const done = item.progress?.length ?? 0;
            const active = new Date(item.expiresAt) > new Date();
            return (
              <Pressable
                accessibilityRole="link"
                onPress={() =>
                  router.push({
                    pathname: "/learn/[enrollmentId]",
                    params: { enrollmentId: item.id },
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: colors.raised },
                ]}
              >
                <View style={{ flex: 1, gap: space.xs }}>
                  <Text style={text.subheading}>{item.course.title}</Text>
                  <Text style={text.small}>
                    {total > 0 ? `${done} of ${total} lessons · ` : ""}
                    {active
                      ? `access until ${formatDate(item.expiresAt)}`
                      : "access ended"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: space.sm }}>
                    {item.certificate ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <BadgeCheck color={colors.success} size={16} />
                        <Text style={[text.small, { color: colors.success }]}>
                          Certificate
                        </Text>
                      </View>
                    ) : (
                      <Pill
                        label={active ? "In progress" : "Expired"}
                        tone={active ? "gold" : "neutral"}
                      />
                    )}
                  </View>
                </View>
                <ChevronRight color={colors.inkSubtle} size={18} />
              </Pressable>
            );
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
});

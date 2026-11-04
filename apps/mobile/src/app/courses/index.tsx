import {
  COURSE_AREAS,
  PLANNED_COURSES,
  type CourseArea,
} from "@pratikar/utils";
import { Stack } from "expo-router";
import {
  BadgeCheck,
  ClipboardCheck,
  PlayCircle,
  SearchX,
} from "lucide-react-native";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, View } from "react-native";

import { BrowseBar } from "@/components/BrowseBar";
import { Text } from "@/components/Typography";
import { Button, Pill, StateView } from "@/components/ui";
import { CatalogueCard } from "@/features/catalogue/CatalogueCard";
import { searchItems } from "@/features/catalogue/browse";
import { useCourses } from "@/features/catalogue/catalogueApi";
import { COURSES_LIVE } from "@/lib/features";
import { colors, radius, space, text, shadow } from "@/lib/theme";

const WHAT_TO_EXPECT = [
  {
    icon: PlayCircle,
    title: "Short video lessons",
    body: "Law, business and career skills — GST, contracts, litigation, digital marketing and more — explained plainly, at your own pace.",
  },
  {
    icon: ClipboardCheck,
    title: "Quizzes as you go",
    body: "Check what you've learnt at the end of each part before moving on.",
  },
  {
    icon: BadgeCheck,
    title: "A certificate anyone can verify",
    body: "Finish a course and get a certificate with a code an employer or client can check.",
  },
];

/** Live courses when they're on sale; until then, what's being prepared. */
export default function CoursesScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Certificate courses" }} />
      {COURSES_LIVE ? <LiveCourses /> : <ComingSoon />}
    </>
  );
}

function LiveCourses() {
  const courses = useCourses();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const shown = useMemo(
    () =>
      searchItems(
        courses.data ?? [],
        deferredQuery,
        (c) => `${c.title} ${c.description ?? ""}`,
      ),
    [courses.data, deferredQuery],
  );

  if (courses.isPending) return <StateView loading />;
  if (courses.isError) {
    return (
      <StateView
        title="Couldn't load the courses"
        action={
          <Button label="Try again" onPress={() => void courses.refetch()} />
        }
      />
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <BrowseBar
        query={query}
        onQuery={setQuery}
        placeholder="Search courses"
        resultCount={shown.length}
        noun="course"
      />
      <FlatList
        data={shown}
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={{ gap: space.md }}
        contentContainerStyle={{
          padding: space.lg,
          paddingTop: space.sm,
          gap: space.md,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={<StateView title="No courses yet" />}
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: "50%" }}>
            <CatalogueCard
              href={{ pathname: "/courses/[id]", params: { id: item.id } }}
              kind="course"
              title={item.title}
              meta={[`${item.accessDurationDays} days' access`, "Certificate"]}
              priceInPaise={item.priceInPaise}
            />
          </View>
        )}
      />
    </View>
  );
}

function ComingSoon() {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const areas = Object.keys(COURSE_AREAS) as CourseArea[];

  const found = useMemo(
    () => searchItems(PLANNED_COURSES, deferredQuery, (c) => c.title),
    [deferredQuery],
  );
  const shown = found.filter((c) => !area || c.area === area);
  const browsing = !!query.trim() || !!area;

  return (
    <View style={{ flex: 1 }}>
      <BrowseBar
        query={query}
        onQuery={setQuery}
        placeholder="Search courses"
        segments={[
          { value: "all", label: "All", count: found.length },
          ...areas.map((value) => ({
            value,
            label: COURSE_AREAS[value],
            count: found.filter((c) => c.area === value).length,
          })),
        ]}
        segment={area}
        onSegment={setArea}
      />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {browsing ? null : (
          <>
            <View style={styles.hero}>
              <Pill label="Coming soon" tone="lilac" />
              <Text style={text.title}>
                Certificate courses are on their way.
              </Text>
              <Text style={text.muted}>
                We're recording practical courses on law, business and careers,
                each ending in a certificate you can share. Until then,
                everything else on Pratikar is ready to use.
              </Text>
            </View>

            {WHAT_TO_EXPECT.map((item) => (
              <View key={item.title} style={styles.expect}>
                <View style={styles.icon}>
                  <item.icon color={colors.noir} size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={text.subheading}>{item.title}</Text>
                  <Text style={text.small}>{item.body}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={text.heading}>
          {browsing
            ? `${shown.length} ${shown.length === 1 ? "course" : "courses"} found`
            : `${PLANNED_COURSES.length} courses in preparation`}
        </Text>
        {shown.length === 0 ? (
          <StateView
            icon={SearchX}
            title="Nothing matches"
            body="Try another word, or another area."
          />
        ) : null}
        {areas.map((value) => {
          const courses = shown.filter((c) => c.area === value);
          if (courses.length === 0) return null;
          return (
            <View key={value} style={{ gap: space.sm }}>
              <Text style={text.subheading} accessibilityRole="header">
                {COURSE_AREAS[value]}{" "}
                <Text style={{ fontWeight: "400", color: colors.inkMuted }}>
                  · {courses.length}
                </Text>
              </Text>
              {courses.map((course) => (
                <View key={course.slug} style={styles.course}>
                  <Text style={[text.body, { fontWeight: "600" }]}>
                    {course.title}
                  </Text>
                  <Text style={text.small}>
                    {course.duration} · {course.modules} modules · Certificate
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
  hero: {
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.card + 4,
    backgroundColor: colors.banner.lilac,
  },
  expect: { flexDirection: "row", gap: space.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: colors.banner.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  course: {
    padding: space.md,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow,
    gap: 2,
  },
});

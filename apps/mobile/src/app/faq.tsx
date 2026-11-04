import { useQuery } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { ChevronDown, ChevronUp, SearchX } from "lucide-react-native";
import { useDeferredValue, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { BrowseBar } from "@/components/BrowseBar";
import { Text } from "@/components/Typography";
import { Button, StateView } from "@/components/ui";
import { searchItems } from "@/features/catalogue/browse";
import { api } from "@/lib/api";
import { colors, radius, space, text, shadow } from "@/lib/theme";

interface FaqGroup {
  category: string;
  items: { id: string; question: string; answer: string }[];
}

/** Questions and answers, grouped as on the website; one open at a time. */
export default function FaqScreen() {
  const faq = useQuery({
    queryKey: ["faq"],
    queryFn: () => api.get<FaqGroup[]>("/faq"),
  });
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const groups = useMemo(
    () =>
      (faq.data ?? [])
        .filter((group) => !category || group.category === category)
        .map((group) => ({
          ...group,
          items: searchItems(
            group.items,
            deferredQuery,
            (item) => `${item.question} ${item.answer}`,
          ),
        }))
        .filter((group) => group.items.length > 0),
    [faq.data, category, deferredQuery],
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Questions and answers" }} />
      <BrowseBar
        query={query}
        onQuery={setQuery}
        placeholder="Search the answers"
        segments={[
          { value: "all", label: "All" },
          ...(faq.data ?? []).map((g) => ({
            value: g.category,
            label: g.category,
          })),
        ]}
        segment={category}
        onSegment={setCategory}
      />
      {faq.isPending ? (
        <StateView loading />
      ) : faq.isError ? (
        <StateView
          title="Couldn't load the answers"
          action={
            <Button label="Try again" onPress={() => void faq.refetch()} />
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {groups.length === 0 ? (
            <StateView
              icon={SearchX}
              title={
                (faq.data ?? []).length === 0
                  ? "No questions here yet"
                  : "No answers match"
              }
              body={
                (faq.data ?? []).length === 0
                  ? "Pratikar AI can answer in the meantime."
                  : "Try another word, or ask Pratikar AI below."
              }
            />
          ) : null}
          {groups.map((group) => (
            <View key={group.category} style={{ gap: space.sm }}>
              <Text style={text.heading} accessibilityRole="header">
                {group.category}
              </Text>
              {group.items.map((item) => {
                const expanded = open === item.id;
                return (
                  <View key={item.id} style={styles.item}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded }}
                      onPress={() => setOpen(expanded ? null : item.id)}
                      style={styles.question}
                    >
                      <Text style={[text.subheading, { flex: 1 }]}>
                        {item.question}
                      </Text>
                      {expanded ? (
                        <ChevronUp color={colors.inkSubtle} size={18} />
                      ) : (
                        <ChevronDown color={colors.inkSubtle} size={18} />
                      )}
                    </Pressable>
                    {expanded ? (
                      <Text style={[text.muted, styles.answer]}>
                        {item.answer}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
          <View style={styles.more}>
            <Text style={text.subheading}>Still stuck?</Text>
            <Text style={text.muted}>
              Pratikar AI can answer from everything on the site.
            </Text>
            <Button
              label="Ask Pratikar AI"
              variant="secondary"
              onPress={() => router.push("/assistant")}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
  item: {
    backgroundColor: colors.surface,
    ...shadow,
    borderRadius: radius.card,
    overflow: "hidden",
  },
  question: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.lg,
  },
  answer: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  more: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow,
  },
});

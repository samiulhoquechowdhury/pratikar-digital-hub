import type { ContentLibraryItem, Course, Template } from "@pratikar/types";
import { searchWithTypos } from "@pratikar/utils";
import { router, Stack } from "expo-router";
import { Search, Sparkles } from "lucide-react-native";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { Text, TextInput } from "@/components/Typography";
import { StateView } from "@/components/ui";
import {
  CatalogueCard,
  type CatalogueKind,
} from "@/features/catalogue/CatalogueCard";
import { matchesWords } from "@/features/catalogue/browse";
import {
  CONTENT_CATEGORY_LABELS,
  useCourses,
  useLibrary,
  useTemplates,
} from "@/features/catalogue/catalogueApi";
import { COURSES_LIVE } from "@/lib/features";
import { colors, radius, space, text } from "@/lib/theme";

type Hit =
  | { kind: "template"; item: Template; text: string }
  | { kind: "course"; item: Course; text: string }
  | { kind: "library"; item: ContentLibraryItem; text: string };

const LIBRARY_KIND = {
  FORM: "form",
  CHECKLIST: "checklist",
  EBOOK: "ebook",
} as const;

/**
 * Search across templates, the library and (once live) courses — the
 * website's useSiteSearch, over the same catalogues, forgiving the same
 * typos ("afidavit", "partnersip deed").
 */
export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const templates = useTemplates();
  const library = useLibrary();
  const courses = useCourses();
  const loading = templates.isPending || library.isPending;

  const found = useMemo(() => {
    if (!deferred) return null;
    const everything: Hit[] = [
      ...(templates.data ?? []).map((item) => ({
        kind: "template" as const,
        item,
        text: `${item.title} ${item.category}`,
      })),
      ...(COURSES_LIVE ? (courses.data ?? []) : []).map((item) => ({
        kind: "course" as const,
        item,
        text: `${item.title} ${item.description ?? ""}`,
      })),
      ...(library.data ?? []).map((item) => ({
        kind: "library" as const,
        item,
        text: `${item.title} ${item.category.replaceAll("_", " ")} ${item.type === "EBOOK" ? "e-book ebook" : item.type}`,
      })),
    ];
    return searchWithTypos(
      everything,
      deferred,
      (hit) => hit.text,
      matchesWords,
    );
  }, [deferred, templates.data, library.data, courses.data]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Stack.Screen options={{ title: "Search" }} />
      <View style={styles.box}>
        <Search color={colors.inkSubtle} size={20} />
        <TextInput
          accessibilityLabel="Search the catalogue"
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a document, form or guide"
          placeholderTextColor={colors.inkSubtle}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
        />
      </View>

      {!found ? (
        <StateView
          title="What do you need?"
          body="Try “rent agreement”, “affidavit” or “GST registration”."
        />
      ) : loading ? (
        <StateView loading />
      ) : (
        <FlatList
          data={found.items}
          keyExtractor={(hit) => hit.kind + hit.item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: space.md }}
          contentContainerStyle={{ padding: space.lg, gap: space.md }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            found.items.length > 0 ? (
              <Text style={text.small}>
                {found.correction
                  ? `Showing results for “${found.correction}”`
                  : `${found.items.length} ${found.items.length === 1 ? "result" : "results"}`}
              </Text>
            ) : undefined
          }
          ListEmptyComponent={
            <View style={{ gap: space.lg, paddingTop: space.xl }}>
              <StateView
                title="Nothing matched"
                body="Pratikar AI can find the right thing from a description — or draft it for you."
              />
              <Pressable
                accessibilityRole="link"
                onPress={() =>
                  router.push({
                    pathname: "/assistant",
                    params: { q: query.trim() },
                  })
                }
                style={styles.ask}
              >
                <Sparkles color={colors.noir} size={18} />
                <Text style={text.subheading}>Ask Pratikar AI</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item: hit }) => {
            const card =
              hit.kind === "template"
                ? {
                    href: {
                      pathname: "/documents/[id]",
                      params: { id: hit.item.id },
                    } as const,
                    kind: "document" as CatalogueKind,
                    meta: [`${hit.item.fieldSchema.length} questions`],
                  }
                : hit.kind === "course"
                  ? {
                      href: {
                        pathname: "/courses/[id]",
                        params: { id: hit.item.id },
                      } as const,
                      kind: "course" as CatalogueKind,
                      meta: [`${hit.item.accessDurationDays} days' access`],
                    }
                  : {
                      href: {
                        pathname: "/library/[id]",
                        params: { id: hit.item.id },
                      } as const,
                      kind: LIBRARY_KIND[hit.item.type] as CatalogueKind,
                      meta: [CONTENT_CATEGORY_LABELS[hit.item.category]],
                    };
            return (
              <View style={{ flex: 1, maxWidth: "50%" }}>
                <CatalogueCard
                  href={card.href}
                  kind={card.kind}
                  title={hit.item.title}
                  meta={card.meta}
                  priceInPaise={hit.item.priceInPaise}
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    margin: space.lg,
    marginBottom: 0,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.control,
  },
  input: { flex: 1, minHeight: 48, fontSize: 16, color: colors.ink },
  ask: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    backgroundColor: colors.banner.lilac,
  },
});

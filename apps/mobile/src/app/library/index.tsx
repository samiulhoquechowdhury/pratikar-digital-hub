import type { ContentCategory, ContentType } from "@pratikar/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { SearchX } from "lucide-react-native";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { BrowseBar, type FilterGroup } from "@/components/BrowseBar";
import { Button, CardGridSkeleton, StateView } from "@/components/ui";
import { CatalogueCard } from "@/features/catalogue/CatalogueCard";
import {
  PRICE_BANDS,
  priceBand,
  searchItems,
  SORTS,
  sortItems,
  type SortValue,
} from "@/features/catalogue/browse";
import {
  CONTENT_CATEGORY_LABELS,
  useLibrary,
} from "@/features/catalogue/catalogueApi";
import { space } from "@/lib/theme";

const SHELVES: { value: ContentType | "all"; label: string; noun: string }[] = [
  { value: "all", label: "Everything", noun: "item" },
  { value: "FORM", label: "Legal forms", noun: "form" },
  { value: "CHECKLIST", label: "Checklists", noun: "checklist" },
  { value: "EBOOK", label: "E-books", noun: "e-book" },
];

const KIND = { FORM: "form", CHECKLIST: "checklist", EBOOK: "ebook" } as const;

const GROUPS: FilterGroup[] = [
  {
    id: "category",
    label: "Topic",
    options: (Object.keys(CONTENT_CATEGORY_LABELS) as ContentCategory[]).map(
      (value) => ({ value, label: CONTENT_CATEGORY_LABELS[value] }),
    ),
  },
  {
    id: "price",
    label: "Price",
    options: PRICE_BANDS.map(({ value, label }) => ({ value, label })),
  },
];

/** The legal library: forms, checklists and e-books. */
export default function LibraryScreen() {
  const params = useLocalSearchParams<{
    type?: ContentType;
    category?: ContentCategory;
  }>();
  const library = useLibrary();
  const [type, setType] = useState<string | null>(params.type ?? null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sort, setSort] = useState<SortValue>("title");
  const [filters, setFilters] = useState<Record<string, string | null>>({
    category: params.category ?? null,
    price: null,
  });

  const items = useMemo(() => library.data ?? [], [library.data]);

  // Each kind's count reflects the other filters, so a number on a chip
  // is always what tapping it will show.
  const matching = useMemo(
    () =>
      searchItems(
        items.filter(
          (item) =>
            (!filters.category || item.category === filters.category) &&
            (!filters.price || priceBand(item.priceInPaise) === filters.price),
        ),
        deferredQuery,
        (item) =>
          `${item.title} ${item.category.replaceAll("_", " ")} ${
            item.type === "EBOOK" ? "e-book ebook" : item.type
          }`,
      ),
    [items, filters, deferredQuery],
  );

  const shown = useMemo(
    () =>
      sortItems(
        matching.filter((item) => !type || item.type === type),
        sort,
      ),
    [matching, type, sort],
  );

  const shelf = SHELVES.find((s) => s.value === (type ?? "all"))!;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: type ? shelf.label : "Legal library" }} />
      <BrowseBar
        query={query}
        onQuery={setQuery}
        placeholder={`Search ${type ? shelf.label.toLowerCase() : "the library"}`}
        segments={SHELVES.map((s) => ({
          value: s.value,
          label: s.label,
          count:
            s.value === "all"
              ? matching.length
              : matching.filter((item) => item.type === s.value).length,
        }))}
        segment={type}
        onSegment={setType}
        groups={GROUPS}
        filters={filters}
        onFilter={(group, value) =>
          setFilters((current) => ({ ...current, [group]: value }))
        }
        sorts={SORTS}
        sort={sort}
        onSort={(value) => setSort(value as SortValue)}
        resultCount={library.isPending ? undefined : shown.length}
        noun={shelf.noun}
      />
      {library.isPending ? (
        <CardGridSkeleton />
      ) : library.isError ? (
        <StateView
          title="Couldn't load the library"
          body="Check your connection and try again."
          action={
            <Button label="Try again" onPress={() => void library.refetch()} />
          }
        />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ gap: space.md }}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onRefresh={() => void library.refetch()}
          refreshing={library.isRefetching}
          ListEmptyComponent={
            <StateView
              icon={SearchX}
              title="Nothing matches"
              body="Try another word, or remove a filter."
            />
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1, maxWidth: "50%" }}>
              <CatalogueCard
                href={{ pathname: "/library/[id]", params: { id: item.id } }}
                kind={KIND[item.type]}
                title={item.title}
                meta={[CONTENT_CATEGORY_LABELS[item.category]]}
                priceInPaise={item.priceInPaise}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingTop: space.sm, gap: space.md },
});

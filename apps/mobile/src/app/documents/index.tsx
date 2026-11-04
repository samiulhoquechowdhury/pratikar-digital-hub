import { Stack } from "expo-router";
import { SearchX } from "lucide-react-native";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { BrowseBar } from "@/components/BrowseBar";
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
  templateCategoryLabel,
  useTemplates,
} from "@/features/catalogue/catalogueApi";
import { space } from "@/lib/theme";

/** Every ready template, by category, price or a search. */
export default function TemplatesScreen() {
  const templates = useTemplates();
  const [category, setCategory] = useState<string | null>(null);
  const [price, setPrice] = useState<string | null>(null);
  const [sort, setSort] = useState<SortValue>("title");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const all = useMemo(() => templates.data ?? [], [templates.data]);
  const categories = useMemo(
    () => [...new Set(all.map((t) => templateCategoryLabel(t.category)))],
    [all],
  );
  const shown = useMemo(
    () =>
      sortItems(
        searchItems(
          all.filter(
            (t) =>
              (!category || templateCategoryLabel(t.category) === category) &&
              (!price || priceBand(t.priceInPaise) === price),
          ),
          deferredQuery,
          (t) => `${t.title} ${t.category}`,
        ),
        sort,
      ),
    [all, category, price, deferredQuery, sort],
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "Ready templates" }} />
      <BrowseBar
        query={query}
        onQuery={setQuery}
        placeholder="Search templates"
        segments={[
          { value: "all", label: "All" },
          ...categories.map((c) => ({ value: c, label: c })),
        ]}
        segment={category}
        onSegment={setCategory}
        groups={[
          {
            id: "price",
            label: "Price",
            options: PRICE_BANDS.map(({ value, label }) => ({ value, label })),
          },
        ]}
        filters={{ price }}
        onFilter={(_, value) => setPrice(value)}
        sorts={SORTS}
        sort={sort}
        onSort={(value) => setSort(value as SortValue)}
        resultCount={templates.isPending ? undefined : shown.length}
        noun="template"
      />
      {templates.isPending ? (
        <CardGridSkeleton />
      ) : templates.isError ? (
        <StateView
          title="Couldn't load the templates"
          body="Check your connection and try again."
          action={
            <Button
              label="Try again"
              onPress={() => void templates.refetch()}
            />
          }
        />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(t) => t.id}
          numColumns={2}
          columnWrapperStyle={{ gap: space.md }}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onRefresh={() => void templates.refetch()}
          refreshing={templates.isRefetching}
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
                href={{ pathname: "/documents/[id]", params: { id: item.id } }}
                kind="document"
                title={item.title}
                meta={[`${item.fieldSchema.length} questions`]}
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

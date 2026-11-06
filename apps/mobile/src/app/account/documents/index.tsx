import { useQuery } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { ChevronRight, FilePenLine, FileText } from "lucide-react-native";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { BrowseBar } from "@/components/BrowseBar";
import { StagePill } from "@/components/StagePill";
import { Text } from "@/components/Typography";
import { Button, StateView } from "@/components/ui";
import { searchItems } from "@/features/catalogue/browse";
import { documentStage } from "@/features/documents/documentStage";
import { documentsApi } from "@/features/documents/documentsApi";
import { formatDate } from "@/lib/format";
import { colors, radius, space, text, shadow } from "@/lib/theme";

/** Every document on the account — from templates and AI drafts — newest first. */
export default function MyDocumentsScreen() {
  const docs = useQuery({
    queryKey: ["my-documents"],
    queryFn: documentsApi.listMine,
  });

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const shown = useMemo(
    () =>
      searchItems(
        (docs.data ?? []).filter((d) => !kind || d.kind === kind),
        deferredQuery,
        (d) => d.title,
      ),
    [docs.data, kind, deferredQuery],
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: "My documents" }} />
      <BrowseBar
        query={query}
        onQuery={setQuery}
        placeholder="Search your documents"
        segments={[
          { value: "all", label: "All" },
          { value: "CUSTOM", label: "AI drafts" },
          { value: "TEMPLATE", label: "From templates" },
        ]}
        segment={kind}
        onSegment={setKind}
      />
      {docs.isPending ? (
        <StateView loading />
      ) : docs.isError ? (
        <StateView
          title="Couldn't load your documents"
          action={
            <Button label="Try again" onPress={() => void docs.refetch()} />
          }
        />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{
            padding: space.lg,
            gap: space.md,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onRefresh={() => void docs.refetch()}
          refreshing={docs.isRefetching}
          ListEmptyComponent={
            <StateView
              title={query || kind ? "Nothing matches" : "No documents yet"}
              body={
                query || kind
                  ? "Try another word, or another filter."
                  : "Fill in a ready template, or describe any document and Pratikar AI drafts it."
              }
              action={
                <Button
                  label="Browse templates"
                  onPress={() => router.push("/documents")}
                />
              }
            />
          }
          renderItem={({ item }) => {
            const stage = documentStage(item);
            const Icon = item.kind === "CUSTOM" ? FilePenLine : FileText;
            return (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${item.title}, ${stage.label}`}
                onPress={() =>
                  router.push({
                    pathname: "/account/documents/[id]",
                    params: { id: item.id },
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  pressed && { backgroundColor: colors.raised },
                ]}
              >
                <View style={styles.icon}>
                  <Icon color={colors.primary} size={20} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={text.subheading} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={text.small}>
                    {item.kind === "CUSTOM" ? "AI draft" : "Template"} ·{" "}
                    {formatDate(item.createdAt)}
                  </Text>
                  <StagePill label={stage.label} tone={stage.tone} />
                </View>
                <ChevronRight color={colors.inkSubtle} size={18} />
              </Pressable>
            );
          }}
        />
      )}
    </View>
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
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: colors.banner.sky,
    alignItems: "center",
    justifyContent: "center",
  },
});

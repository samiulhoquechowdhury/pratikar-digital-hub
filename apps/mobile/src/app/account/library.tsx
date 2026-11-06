import { router, Stack } from "expo-router";
import { ChevronRight, Download } from "lucide-react-native";
import { FlatList, Pressable, StyleSheet } from "react-native";

import { Text } from "@/components/Typography";
import { Button, StateView } from "@/components/ui";
import { useOrders } from "@/features/payments/useOrders";
import { colors, radius, space, text, shadow } from "@/lib/theme";

/** Library items bought on the account — download again any time. */
export default function MyLibraryScreen() {
  const orders = useOrders();
  // One row per item, however many times it was ordered.
  const items = [
    ...new Map(
      (orders.data ?? [])
        .filter((o) => o.status === "PAID" && o.contentLibraryItem)
        .map((o) => [o.contentLibraryItem!.id, o.contentLibraryItem!]),
    ).values(),
  ];

  return (
    <>
      <Stack.Screen options={{ title: "My library" }} />
      {orders.isPending ? (
        <StateView loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{
            padding: space.lg,
            gap: space.md,
            flexGrow: 1,
          }}
          onRefresh={() => void orders.refetch()}
          refreshing={orders.isRefetching}
          ListEmptyComponent={
            <StateView
              title="Nothing in your library yet"
              body="Legal forms, checklists and e-books you buy stay here."
              action={
                <Button
                  label="Browse the library"
                  onPress={() => router.push("/library")}
                />
              }
            />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="link"
              onPress={() =>
                router.push({
                  pathname: "/library/[id]",
                  params: { id: item.id },
                })
              }
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.raised },
              ]}
            >
              <Download color={colors.primary} size={20} />
              <Text style={[text.subheading, { flex: 1 }]}>{item.title}</Text>
              <ChevronRight color={colors.inkSubtle} size={18} />
            </Pressable>
          )}
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

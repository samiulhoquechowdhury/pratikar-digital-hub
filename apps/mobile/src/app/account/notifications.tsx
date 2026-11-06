import { useQuery } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { StateView } from "@/components/ui";
import { PushOptIn } from "@/features/notifications/PushOptIn";
import { notificationsApi } from "@/features/notifications/notificationsApi";
import { formatDate } from "@/lib/format";
import { openSitePath } from "@/lib/links";
import { colors, radius, space, text, shadow } from "@/lib/theme";

/** The inbox — the website's bell. Opening it marks everything read. */
export default function NotificationsScreen() {
  const inbox = useQuery({
    queryKey: ["inbox"],
    queryFn: notificationsApi.inbox,
  });

  useEffect(() => {
    if (inbox.data && inbox.data.unread > 0)
      void notificationsApi.markRead().catch(() => undefined);
  }, [inbox.data]);

  return (
    <>
      <Stack.Screen options={{ title: "Notifications" }} />
      {inbox.isPending ? (
        <StateView loading />
      ) : (
        <FlatList
          data={inbox.data?.items ?? []}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{
            padding: space.lg,
            gap: space.md,
            flexGrow: 1,
          }}
          onRefresh={() => void inbox.refetch()}
          refreshing={inbox.isRefetching}
          ListHeaderComponent={
            <View style={{ marginBottom: space.sm }}>
              <PushOptIn />
            </View>
          }
          ListEmptyComponent={
            <StateView
              title="Nothing yet"
              body="We'll let you know here when a document is ready or a review comes back."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole={item.href ? "link" : "text"}
              disabled={!item.href}
              onPress={() => item.href && openSitePath(item.href, router.push)}
              style={[styles.row, !item.readAt && styles.unread]}
            >
              <Text style={text.subheading}>{item.title}</Text>
              <Text style={text.muted}>{item.body}</Text>
              <Text style={text.small}>{formatDate(item.createdAt)}</Text>
            </Pressable>
          )}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 4,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
  unread: { borderColor: colors.gold, backgroundColor: colors.banner.sand },
});

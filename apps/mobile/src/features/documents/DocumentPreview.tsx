import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { Notice } from "@/components/ui";
import { colors, radius, space, text } from "@/lib/theme";

import { useDocumentPreview } from "./useDocumentPreview";

/** A4 is 1 : √2. */
const PAGE_RATIO = 1 / Math.SQRT2;

/**
 * Every page of a generated document, watermarked, as images — the free
 * preview. Waits quietly for the worker when it hasn't finished yet.
 */
export function DocumentPreview({ documentId }: { documentId: string }) {
  const state = useDocumentPreview(documentId);

  if (state.status === "loading") {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={colors.noir} />
        <Text style={text.muted}>Preparing your preview…</Text>
      </View>
    );
  }
  if (state.status === "slow") {
    return (
      <Notice tone="warning">
        The preview is taking longer than usual. It will appear in My documents
        once it's ready.
      </Notice>
    );
  }
  if (state.status === "error") {
    return <Notice tone="danger">Couldn't load the preview.</Notice>;
  }

  return (
    <View style={{ gap: space.md }}>
      {state.pages.map((uri, index) => (
        <Image
          key={uri}
          source={{ uri }}
          accessibilityLabel={`Page ${index + 1} of ${state.pages.length}, watermarked preview`}
          style={styles.page}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  waiting: {
    alignItems: "center",
    gap: space.md,
    padding: space.xxl,
    borderRadius: radius.card,
    backgroundColor: colors.ivory,
  },
  page: {
    width: "100%",
    aspectRatio: PAGE_RATIO,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
});

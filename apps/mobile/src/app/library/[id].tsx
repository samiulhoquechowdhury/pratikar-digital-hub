import type { ContentType } from "@pratikar/types";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { CheckCircle2, Download } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { Text } from "@/components/Typography";
import { Button, Notice, StateView } from "@/components/ui";
import {
  catalogueApi,
  CONTENT_CATEGORY_LABELS,
  CONTENT_TYPE_LABELS,
  libraryDownload,
  libraryPreview,
} from "@/features/catalogue/catalogueApi";
import { BuyPanel } from "@/features/payments/BuyPanel";
import { useOwnsLibraryItem } from "@/features/payments/useOrders";
import { saveAndShare } from "@/lib/download";
import { colors, radius, space, text, shadow } from "@/lib/theme";

/** The website's per-format copy: the catalogue has no description column yet. */
const ABOUT: Record<ContentType, { description: string; includes: string[] }> =
  {
    EBOOK: {
      description:
        "A long-form guide that explains the law in plain language — what applies to you, what to watch for, and what to do next.",
      includes: [
        "Downloadable file you keep",
        "Written for non-lawyers",
        "Download again any time",
        "Stays in your account",
      ],
    },
    CHECKLIST: {
      description:
        "A step-by-step reference sheet to print and work through, so nothing gets missed before you sign, file or register.",
      includes: [
        "Printable, step by step",
        "Covers the usual gaps",
        "Download again any time",
        "Stays in your account",
      ],
    },
    FORM: {
      description:
        "A ready-made form with the standard wording in place. Download it, fill in the blanks yourself, and print.",
      includes: [
        "Standard wording in place",
        "Editable Word document",
        "Download again any time",
        "Stays in your account",
      ],
    },
  };

const PAGE_RATIO = 1 / Math.SQRT2;

export default function LibraryItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useQuery({
    queryKey: ["library-item", id],
    queryFn: () => catalogueApi.libraryItem(id),
  });
  const preview = useQuery({
    queryKey: ["library-preview", id],
    queryFn: () => libraryPreview(id),
    // The excerpt is made in the background; ask again until it's there.
    refetchInterval: (q) =>
      q.state.data && !q.state.data.ready ? 3000 : false,
  });
  const { owned, refresh } = useOwnsLibraryItem(id);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (item.isPending) return <StateView loading />;
  if (item.isError || !item.data) {
    return (
      <StateView
        title="This item isn't available"
        body="It may have been unpublished, or the link may be wrong."
        action={
          <Button
            label="Back to the library"
            onPress={() => router.replace("/library")}
          />
        }
      />
    );
  }
  const it = item.data;
  const about = ABOUT[it.type];

  const download = async () => {
    setError(null);
    setDownloading(true);
    try {
      // Signed and short-lived, so fetched at tap time and never stored.
      const { fileUrl, title } = await libraryDownload(id);
      const ext = fileUrl.split("?")[0]?.split(".").pop() ?? "pdf";
      await saveAndShare(fileUrl, `${title}.${ext}`);
    } catch {
      setError(
        "Couldn't start the download. If you've just paid, give it a few seconds and try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Stack.Screen options={{ title: CONTENT_TYPE_LABELS[it.type] }} />
      <View style={{ gap: space.sm }}>
        <Text style={styles.kind}>{CONTENT_TYPE_LABELS[it.type]}</Text>
        <Text style={text.title}>{it.title}</Text>
        <Text style={text.small}>{CONTENT_CATEGORY_LABELS[it.category]}</Text>
        <Text style={text.muted}>{about.description}</Text>
      </View>

      <View style={styles.card}>
        {owned ? (
          <View style={{ gap: space.md }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: space.sm,
              }}
            >
              <CheckCircle2 color={colors.success} size={20} />
              <Text style={[text.subheading, { color: colors.success }]}>
                You own this
              </Text>
            </View>
            <Text style={text.muted}>
              Download it as often as you need — it stays in your account.
            </Text>
            <Button
              label={downloading ? "Preparing your download…" : "Download"}
              icon={<Download color={colors.onPrimary} size={18} />}
              loading={downloading}
              onPress={() => void download()}
            />
            {error ? <Notice tone="danger">{error}</Notice> : null}
          </View>
        ) : (
          <BuyPanel
            itemType="CONTENT_ITEM"
            itemId={it.id}
            label={it.title}
            priceInPaise={it.priceInPaise}
            onPaid={refresh}
          />
        )}
        <View style={{ gap: space.sm }}>
          {about.includes.map((line) => (
            <View
              key={line}
              style={{
                flexDirection: "row",
                gap: space.sm,
                alignItems: "center",
              }}
            >
              <CheckCircle2 color={colors.inkSubtle} size={16} />
              <Text style={text.muted}>{line}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: space.md }}>
        <Text style={text.heading}>Look inside</Text>
        {preview.data?.ready ? (
          preview.data.pages.length > 0 ? (
            preview.data.pages.map((uri, index) => (
              <Image
                key={uri}
                source={{ uri }}
                accessibilityLabel={`Sample page ${index + 1}, watermarked`}
                style={styles.page}
                resizeMode="contain"
              />
            ))
          ) : (
            <Text style={text.muted}>No sample pages for this one.</Text>
          )
        ) : preview.isError ? (
          <Text style={text.muted}>The sample pages couldn't be loaded.</Text>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
  kind: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.goldText,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  card: {
    gap: space.xl,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
  page: {
    width: "100%",
    aspectRatio: PAGE_RATIO,
    borderRadius: 6,
    backgroundColor: colors.card,
  },
});

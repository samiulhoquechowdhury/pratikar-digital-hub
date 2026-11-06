import { grossPaise } from "@pratikar/utils";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ScrollText,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { Pill } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { colors, fonts, gradients, radius, space } from "@/lib/theme";

export type CatalogueKind =
  "document" | "form" | "checklist" | "ebook" | "course";

const KIND: Record<
  CatalogueKind,
  { label: string; icon: LucideIcon; wash: keyof typeof WASHES }
> = {
  document: { label: "Template", icon: FileText, wash: "sky" },
  form: { label: "Legal form", icon: ScrollText, wash: "sand" },
  checklist: { label: "Checklist", icon: ClipboardCheck, wash: "mint" },
  ebook: { label: "E-book", icon: BookOpen, wash: "blush" },
  course: { label: "Course", icon: GraduationCap, wash: "lilac" },
};

const WASHES = {
  sky: gradients.sky,
  sand: gradients.sand,
  mint: gradients.mint,
  blush: gradients.blush,
  lilac: gradients.lilac,
} as const;

/**
 * One product, as a poster: a deep wash in its kind's colour with the kind's
 * mark drawn large and faint, then the title and price.
 * Prices include GST, as everywhere a customer sees one; null means not on
 * sale yet.
 */
export function CatalogueCard({
  href,
  kind,
  title,
  meta,
  priceInPaise,
  width,
}: {
  href: Href;
  kind: CatalogueKind;
  title: string;
  meta: string[];
  priceInPaise: number | null;
  width?: number;
}) {
  const { label, icon: Icon, wash } = KIND[kind];
  const price =
    priceInPaise === null ? null : formatPrice(grossPaise(priceInPaise));
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${title}, ${price ?? "enrolling soon"}`}
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.card,
        width ? { width } : null,
        pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
      ]}
    >
      <LinearGradient
        colors={WASHES[wash]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.art}
      >
        <Icon
          color="rgba(255,255,255,0.16)"
          size={92}
          strokeWidth={1.2}
          style={styles.watermark}
        />
        <View style={styles.badge}>
          <Icon color={colors.ink} size={13} strokeWidth={2.2} />
          <Text style={styles.kind}>{label}</Text>
        </View>
      </LinearGradient>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={3}>
          {title}
        </Text>
        {meta.length > 0 ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta.join(" · ")}
          </Text>
        ) : null}
        <View style={styles.footer}>
          {price === null ? (
            <Pill label="Enrolling soon" tone="lilac" />
          ) : (
            <>
              <Text style={styles.price}>{price}</Text>
              <View style={styles.go}>
                <ArrowUpRight color={colors.ink} size={16} />
              </View>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card - 2,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  art: {
    height: 118,
    padding: space.md,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  watermark: { position: "absolute", right: -14, bottom: -18 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  kind: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.ink },
  body: { flexGrow: 1, padding: space.md, gap: space.xs },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: colors.ink,
  },
  meta: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.inkSubtle },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: space.md,
  },
  price: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  go: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.raisedHigh,
  },
});

import { grossPaise } from "@pratikar/utils";
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
import { colors, fonts, radius, shadow, space } from "@/lib/theme";

export type CatalogueKind =
  "document" | "form" | "checklist" | "ebook" | "course";

const KIND: Record<
  CatalogueKind,
  { label: string; icon: LucideIcon; tint: string }
> = {
  document: { label: "Template", icon: FileText, tint: colors.banner.sky },
  form: { label: "Legal form", icon: ScrollText, tint: colors.banner.sand },
  checklist: {
    label: "Checklist",
    icon: ClipboardCheck,
    tint: colors.banner.mint,
  },
  ebook: { label: "E-book", icon: BookOpen, tint: colors.banner.blush },
  course: { label: "Course", icon: GraduationCap, tint: colors.banner.lilac },
};

/**
 * One product: a tinted panel with its kind, then the title and price.
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
  const { label, icon: Icon, tint } = KIND[kind];
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
      <View style={[styles.art, { backgroundColor: tint }]}>
        <View style={styles.badge}>
          <Icon color={colors.noir} size={20} strokeWidth={1.9} />
        </View>
        <Text style={styles.kind}>{label}</Text>
      </View>
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
              <ArrowUpRight color={colors.inkSubtle} size={18} />
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
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    ...shadow,
  },
  art: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    padding: space.md,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  kind: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.noir },
  body: { flexGrow: 1, padding: space.md, gap: space.xs },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
  },
  meta: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.inkSubtle },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: space.md,
  },
  price: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
});

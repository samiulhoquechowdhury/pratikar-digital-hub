import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, type Href } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Eye,
  FileText,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Typography";
import { IconTile, SectionHeader } from "@/components/ui";
import {
  CatalogueCard,
  type CatalogueKind,
} from "@/features/catalogue/CatalogueCard";
import {
  CONTENT_CATEGORY_LABELS,
  templateCategoryLabel,
  useLibrary,
  useTemplates,
} from "@/features/catalogue/catalogueApi";
import {
  colors,
  fonts,
  gradients,
  radius,
  shadow,
  shadowLifted,
  space,
  text,
} from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment -- how React Native loads an image asset
const LOGO = require("../../../assets/icon.png") as number;

const SHELF_SIZE = 8;
const CARD_WIDTH = 216;

const QUICK_START: {
  label: string;
  hint: string;
  icon: LucideIcon;
  href: Href;
  tint: string;
}[] = [
  {
    label: "Create a document",
    hint: "Answer questions, get a finished draft",
    icon: FileText,
    href: "/documents",
    tint: colors.banner.sky,
  },
  {
    label: "Legal library",
    hint: "Forms, checklists and e-books",
    icon: BookOpen,
    href: "/library",
    tint: colors.banner.sand,
  },
  {
    label: "Courses",
    hint: "Learn it, with a certificate",
    icon: GraduationCap,
    href: "/courses",
    tint: colors.banner.mint,
  },
];

/** What's true of everything on sale — no invented numbers. */
const PROMISES: { icon: LucideIcon; label: string }[] = [
  { icon: BadgeCheck, label: "Written by advocates" },
  { icon: Eye, label: "Preview free" },
  { icon: ShieldCheck, label: "Secure payments" },
];

interface ShelfItem {
  id: string;
  href: Href;
  kind: CatalogueKind;
  title: string;
  meta: string[];
  priceInPaise: number | null;
}

/**
 * The home tab: who you are, the search, the AI, three ways in, and the
 * catalogue in shelves.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const { top } = useSafeAreaInsets();
  const templates = useTemplates();
  const library = useLibrary();
  const [refreshing, setRefreshing] = useState(false);

  // White status-bar icons on the navy hero, and only here.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, []),
  );

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([templates.refetch(), library.refetch()]);
    setRefreshing(false);
  };

  const templateShelf: ShelfItem[] = (templates.data ?? [])
    .slice(0, SHELF_SIZE)
    .map((template) => ({
      id: template.id,
      href: `/documents/${template.id}`,
      kind: "document",
      title: template.title,
      meta: [
        templateCategoryLabel(template.category),
        `${template.fieldSchema.length} questions`,
      ],
      priceInPaise: template.priceInPaise,
    }));

  const libraryShelf = (type: "FORM" | "CHECKLIST" | "EBOOK"): ShelfItem[] =>
    (library.data ?? [])
      .filter((item) => item.type === type)
      .slice(0, SHELF_SIZE)
      .map((item) => ({
        id: item.id,
        href: `/library/${item.id}`,
        kind:
          type === "FORM" ? "form" : type === "EBOOK" ? "ebook" : "checklist",
        title: item.title,
        meta: [CONTENT_CATEGORY_LABELS[item.category]],
        priceInPaise: item.priceInPaise,
      }));

  const firstName = user?.name?.split(" ")[0];

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          progressViewOffset={top}
        />
      }
      contentContainerStyle={{ paddingBottom: space.xxl }}
    >
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: top + space.lg }]}
      >
        <View style={styles.brandRow}>
          <Image
            source={LOGO}
            accessibilityIgnoresInvertColors
            style={styles.mark}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Pratikar</Text>
            <Text style={styles.tagline}>Har ghar mein kanooni gyaan</Text>
          </View>
        </View>

        <Text style={styles.heroTitle} accessibilityRole="header">
          {firstName ? `Hello, ${firstName}.` : "Legal help,\nmade simple."}
        </Text>
        <Text style={styles.heroBody}>
          {firstName
            ? "What can we help you sort out today?"
            : "Documents, forms and guides written by advocates — in plain language."}
        </Text>

        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search for a document, form or guide"
          onPress={() => router.push("/search")}
          style={({ pressed }) => [styles.search, pressed && { opacity: 0.92 }]}
        >
          <Search color={colors.inkSubtle} size={19} />
          <Text style={styles.searchText}>Search documents, forms, guides</Text>
        </Pressable>
      </LinearGradient>

      <View style={styles.lifted}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Draft any document with Pratikar AI"
          onPress={() => router.push("/documents/custom")}
          style={({ pressed }) => [
            styles.aiCard,
            pressed && { transform: [{ scale: 0.99 }] },
          ]}
        >
          <LinearGradient
            colors={gradients.gold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiIcon}
          >
            <Sparkles color={colors.noir} size={22} />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={text.subheading}>Draft anything with AI</Text>
            <Text style={text.small}>
              Describe it, and an advocate reviews it
            </Text>
          </View>
          <ArrowRight color={colors.noir} size={20} />
        </Pressable>

        <View style={styles.quickRow}>
          {QUICK_START.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="link"
              accessibilityLabel={item.label}
              accessibilityHint={item.hint}
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [
                styles.quick,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <IconTile icon={item.icon} tint={item.tint} size={46} />
              <Text style={styles.quickLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Shelf title="Ready templates" href="/documents" items={templateShelf} />
      <Shelf
        title="Legal forms"
        href={{ pathname: "/library", params: { type: "FORM" } }}
        items={libraryShelf("FORM")}
      />
      <Shelf
        title="Checklists"
        href={{ pathname: "/library", params: { type: "CHECKLIST" } }}
        items={libraryShelf("CHECKLIST")}
      />
      <Shelf
        title="E-books"
        href={{ pathname: "/library", params: { type: "EBOOK" } }}
        items={libraryShelf("EBOOK")}
      />

      <View style={styles.promises}>
        {PROMISES.map((promise) => (
          <View key={promise.label} style={styles.promise}>
            <promise.icon color={colors.goldInk} size={20} strokeWidth={1.8} />
            <Text style={styles.promiseLabel}>{promise.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

/** A titled, horizontally swiped row of cards. Empty shelves leave themselves out. */
function Shelf({
  title,
  href,
  items,
}: {
  title: string;
  href: Href;
  items: ShelfItem[];
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.shelf}>
      <View style={{ paddingHorizontal: space.lg }}>
        <SectionHeader
          title={title}
          action={
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`View all ${title.toLowerCase()}`}
              hitSlop={12}
              onPress={() => router.push(href)}
            >
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          }
        />
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.shelfList}
        snapToInterval={CARD_WIDTH + space.md}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <CatalogueCard
            width={CARD_WIDTH}
            href={item.href}
            kind={item.kind}
            title={item.title}
            meta={item.meta}
            priceInPaise={item.priceInPaise}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  hero: {
    paddingHorizontal: space.xl,
    paddingBottom: 72,
    borderBottomLeftRadius: radius.sheet + 4,
    borderBottomRightRadius: radius.sheet + 4,
    gap: space.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    marginBottom: space.xl,
  },
  mark: { width: 42, height: 42, borderRadius: 13 },
  brand: { fontFamily: fonts.display, fontSize: 19, color: colors.inkInverse },
  tagline: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.goldSoft },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 41,
    color: colors.inkInverse,
  },
  heroBody: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkInverseMuted,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 52,
    marginTop: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.control + 2,
    backgroundColor: colors.surface,
  },
  searchText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkSubtle,
  },
  // Pulled up so the cards sit over the hero's edge.
  lifted: { marginTop: -48, paddingHorizontal: space.lg, gap: space.md },
  aiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadowLifted,
  },
  aiIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  quickRow: { flexDirection: "row", gap: space.md },
  quick: {
    flex: 1,
    alignItems: "center",
    gap: space.sm,
    paddingVertical: space.lg,
    paddingHorizontal: space.xs,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow,
  },
  // In a centred stack, text takes its width from the stack: Android rounds a
  // shrink-wrapped measurement down, which clips the last letters.
  quickLabel: {
    alignSelf: "stretch",
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    lineHeight: 17,
    textAlign: "center",
    color: colors.ink,
  },
  shelf: { marginTop: space.xxl },
  shelfList: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    gap: space.md,
  },
  viewAll: { fontFamily: fonts.bold, fontSize: 14, color: colors.noirRaised },
  promises: {
    flexDirection: "row",
    gap: space.sm,
    marginTop: space.lg,
    marginHorizontal: space.lg,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.banner.sand,
  },
  promise: { flex: 1, alignItems: "center", gap: 6 },
  promiseLabel: {
    alignSelf: "stretch",
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    color: colors.ink,
  },
});

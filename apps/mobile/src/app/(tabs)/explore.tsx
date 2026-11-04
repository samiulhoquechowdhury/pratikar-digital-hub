import type { ContentCategory } from "@pratikar/types";
import { router, type Href } from "expo-router";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  ScrollText,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Typography";
import { Chip, IconTile } from "@/components/ui";
import {
  CONTENT_CATEGORY_LABELS,
  useLibrary,
  useTemplates,
} from "@/features/catalogue/catalogueApi";
import { colors, fonts, radius, shadow, space, text } from "@/lib/theme";

/** Every kind of product, with counts, and the library by area of law. */
export default function ExploreScreen() {
  const templates = useTemplates();
  const library = useLibrary();
  const items = library.data ?? [];
  const count = (type: string) => items.filter((i) => i.type === type).length;

  const offerings: {
    label: string;
    hint: string;
    icon: LucideIcon;
    tint: string;
    href: Href;
    count?: number;
  }[] = [
    {
      label: "Ready templates",
      hint: "Word and PDF",
      icon: FileText,
      tint: colors.banner.sky,
      href: "/documents",
      count: templates.data?.length,
    },
    {
      label: "Draft with AI",
      hint: "Anything else",
      icon: Sparkles,
      tint: colors.banner.lilac,
      href: "/documents/custom",
    },
    {
      label: "Legal forms",
      hint: "Fill in and file",
      icon: ScrollText,
      tint: colors.banner.sand,
      href: { pathname: "/library", params: { type: "FORM" } },
      count: count("FORM"),
    },
    {
      label: "Checklists",
      hint: "What to check",
      icon: ClipboardCheck,
      tint: colors.banner.mint,
      href: { pathname: "/library", params: { type: "CHECKLIST" } },
      count: count("CHECKLIST"),
    },
    {
      label: "E-books",
      hint: "Plain language",
      icon: BookOpen,
      tint: colors.banner.blush,
      href: { pathname: "/library", params: { type: "EBOOK" } },
      count: count("EBOOK"),
    },
    {
      label: "Courses",
      hint: "With a certificate",
      icon: GraduationCap,
      tint: colors.banner.lilac,
      href: "/courses",
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <PageHeader title="Explore" subtitle="Everything on Pratikar" />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search the catalogue"
          onPress={() => router.push("/search")}
          style={({ pressed }) => [styles.search, pressed && { opacity: 0.9 }]}
        >
          <Search color={colors.inkSubtle} size={19} />
          <Text style={styles.searchText}>Search the catalogue</Text>
        </Pressable>

        <View style={styles.grid}>
          {offerings.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="link"
              accessibilityLabel={`${item.label}, ${item.hint}`}
              onPress={() => router.push(item.href)}
              style={({ pressed }) => [
                styles.tile,
                pressed && { transform: [{ scale: 0.97 }] },
              ]}
            >
              <View style={styles.tileTop}>
                <IconTile icon={item.icon} tint={item.tint} />
                {item.count ? (
                  <Text style={styles.count}>{item.count}</Text>
                ) : null}
              </View>
              <Text style={styles.tileLabel}>{item.label}</Text>
              <Text style={text.small}>{item.hint}</Text>
            </Pressable>
          ))}
        </View>

        <View>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Browse by area of law
          </Text>
          <View style={styles.chips}>
            {(Object.keys(CONTENT_CATEGORY_LABELS) as ContentCategory[]).map(
              (category) => (
                <Chip
                  key={category}
                  label={CONTENT_CATEGORY_LABELS[category]}
                  selected={false}
                  onPress={() =>
                    router.push({ pathname: "/library", params: { category } })
                  }
                />
              ),
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.lg,
    gap: space.xl,
    paddingBottom: space.xxl,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.control + 2,
    backgroundColor: colors.surface,
    ...shadow,
  },
  searchText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkSubtle,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: 2,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    ...shadow,
  },
  tileTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: space.md,
  },
  count: { fontFamily: fonts.bold, fontSize: 14, color: colors.inkSubtle },
  tileLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  sectionTitle: { ...text.heading, marginBottom: space.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
});

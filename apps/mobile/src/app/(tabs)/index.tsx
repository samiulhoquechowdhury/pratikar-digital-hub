import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Typography";
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
import { COURSES_LIVE } from "@/lib/features";
import { tapHaptic } from "@/lib/haptics";
import { colors, fonts, gradients, radius, space, text } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment -- how React Native loads an image asset */
const LOGO = require("../../../assets/icon.png") as number;
const ART = {
  drafting: require("../../../assets/home/drafting.webp") as number,
  templates: require("../../../assets/home/templates.webp") as number,
  forms: require("../../../assets/home/forms.webp") as number,
  assistant: require("../../../assets/home/assistant.webp") as number,
  courses: require("../../../assets/home/courses.webp") as number,
};
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment */

const SHELF_SIZE = 8;
const CARD_WIDTH = 176;
const GUTTER = space.lg;
const SLIDE_HEIGHT = 452;
/** How long a featured slide stays before the next one comes in. */
const SLIDE_MS = 5500;

/** The ways in, as a row of tiles under the search. */
const CATEGORIES: {
  label: string;
  icon: LucideIcon;
  href: Href;
  wash: readonly [string, string];
}[] = [
  {
    label: "AI draft",
    icon: Sparkles,
    href: "/documents/custom",
    wash: ["#4a3b9a", "#1e1844"],
  },
  {
    label: "Templates",
    icon: FileText,
    href: "/documents",
    wash: gradients.sky,
  },
  {
    label: "Legal forms",
    icon: ScrollText,
    href: { pathname: "/library", params: { type: "FORM" } },
    wash: gradients.sand,
  },
  {
    label: "Checklists",
    icon: ClipboardCheck,
    href: { pathname: "/library", params: { type: "CHECKLIST" } },
    wash: gradients.mint,
  },
  {
    label: "E-books",
    icon: BookOpen,
    href: { pathname: "/library", params: { type: "EBOOK" } },
    wash: gradients.blush,
  },
  {
    label: "Courses",
    icon: GraduationCap,
    href: "/courses",
    wash: gradients.lilac,
  },
];

interface Slide {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: Href;
  art: ImageSourcePropType;
  /** A full picture fills the top; a cut-out stands on the text. */
  fit: "cover" | "cutout";
  wash: readonly [string, string, ...string[]];
}

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

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The home tab: who you are and the search, the ways in, the featured
 * stories, and the catalogue in shelves.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const { top } = useSafeAreaInsets();
  const templates = useTemplates();
  const library = useLibrary();
  const [refreshing, setRefreshing] = useState(false);

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

  const libraryOf = (type: "FORM" | "CHECKLIST" | "EBOOK") =>
    (library.data ?? []).filter((item) => item.type === type);

  const libraryShelf = (type: "FORM" | "CHECKLIST" | "EBOOK"): ShelfItem[] =>
    libraryOf(type)
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

  const formCount = libraryOf("FORM").length;
  const firstName = user?.name?.split(" ")[0];
  const initial = (firstName ?? "P").charAt(0).toUpperCase();

  const slides: Slide[] = [
    {
      id: "drafting",
      eyebrow: "New · AI drafting",
      title: "Any legal document, drafted by AI",
      body: "Describe it in your own words. An advocate checks it before you download.",
      cta: "Draft my document",
      href: "/documents/custom",
      art: ART.drafting,
      fit: "cover",
      wash: ["#18203a", "#0c1020"],
    },
    {
      id: "templates",
      eyebrow: "Templates",
      title: "Your rent agreement, ready in five minutes",
      body: "Answer a few plain questions — get a finished Word and PDF.",
      cta: "Create a document",
      href: "/documents",
      art: ART.templates,
      fit: "cutout",
      wash: ["#1d3560", "#0d1528"],
    },
    {
      id: "forms",
      eyebrow: "Library",
      title:
        formCount > 0
          ? `${formCount}+ legal forms, written by advocates`
          : "Legal forms, written by advocates",
      body: "Affidavits, notices, agreements — buy once, download any time.",
      cta: "Browse legal forms",
      href: { pathname: "/library", params: { type: "FORM" } },
      art: ART.forms,
      fit: "cutout",
      wash: ["#4a3a17", "#1a140a"],
    },
    {
      id: "assistant",
      eyebrow: "Pratikar AI",
      title: "Not sure which document you need? Just ask.",
      body: "In English or Hindi — it points you to the right one.",
      cta: "Ask a question",
      href: "/assistant",
      art: ART.assistant,
      fit: "cutout",
      wash: ["#174538", "#0a1c17"],
    },
    {
      id: "courses",
      eyebrow: COURSES_LIVE ? "Courses" : "Coming soon",
      title: "Learn the law you use — and earn a certificate",
      body: "Short video courses with a certificate anyone can verify.",
      cta: COURSES_LIVE ? "Explore courses" : "See what's coming",
      href: "/courses",
      art: ART.courses,
      fit: "cutout",
      wash: ["#352a6b", "#141029"],
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          progressViewOffset={top}
          tintColor={colors.gold}
          colors={[colors.gold]}
          progressBackgroundColor={colors.raised}
        />
      }
      contentContainerStyle={{ paddingTop: top + space.md }}
    >
      <View style={styles.header}>
        <Image
          source={LOGO}
          accessibilityIgnoresInvertColors
          style={styles.mark}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>{greeting()}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {firstName ?? "Welcome to Pratikar"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Your account"
          hitSlop={8}
          onPress={() => router.navigate("/account")}
          style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search for a document, form or guide"
        onPress={() => router.push("/search")}
        style={({ pressed }) => [styles.search, pressed && { opacity: 0.85 }]}
      >
        <Search color={colors.inkMuted} size={19} />
        <Text style={styles.searchText}>
          Search “rent agreement”, “affidavit”…
        </Text>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((category) => (
          <Pressable
            key={category.label}
            accessibilityRole="link"
            accessibilityLabel={category.label}
            onPress={() => router.push(category.href)}
            style={({ pressed }) => [
              styles.category,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <LinearGradient
              colors={category.wash}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryTile}
            >
              <category.icon color={colors.ink} size={24} strokeWidth={1.8} />
            </LinearGradient>
            <Text style={styles.categoryLabel} numberOfLines={1}>
              {category.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Featured slides={slides} />

      <Shelf title="Ready templates" href="/documents" items={templateShelf} />
      <Shelf
        title="Legal forms"
        href={{ pathname: "/library", params: { type: "FORM" } }}
        items={libraryShelf("FORM")}
      />

      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Ask Pratikar AI which document you need"
        onPress={() => router.navigate("/assistant")}
        style={({ pressed }) => [
          styles.aiWrap,
          pressed && { transform: [{ scale: 0.99 }] },
        ]}
      >
        <LinearGradient
          colors={gradients.violet}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiCard}
        >
          <View style={styles.aiCopy}>
            <View style={styles.aiTag}>
              <Sparkles color={colors.violet} size={13} />
              <Text style={styles.aiTagText}>Pratikar AI</Text>
            </View>
            <Text style={styles.aiTitle}>Stuck? Describe your problem.</Text>
            <Text style={styles.aiBody}>
              It finds the right document, form or guide — in English or Hindi.
            </Text>
            <View style={styles.aiCta}>
              <Text style={styles.aiCtaText}>Ask now</Text>
              <ArrowRight color={colors.onPrimary} size={15} />
            </View>
          </View>
          <Image
            source={ART.assistant}
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            style={styles.aiArt}
          />
        </LinearGradient>
      </Pressable>

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
            <View style={styles.promiseIcon}>
              <promise.icon color={colors.gold} size={19} strokeWidth={1.8} />
            </View>
            <Text style={styles.promiseLabel}>{promise.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.signoff}>
        <Text style={styles.signoffBig}>Har ghar mein{"\n"}kanooni gyaan.</Text>
        <Text style={styles.signoffSmall}>
          Made in India, for India · Pratikar Digital Hub
        </Text>
      </View>
    </ScrollView>
  );
}

/**
 * The featured stories: tall cards, swiped or turning by themselves —
 * unless the reader asks for less motion, or has a finger on them.
 */
function Featured({ slides }: { slides: Slide[] }) {
  const { width } = useWindowDimensions();
  const slideWidth = width - GUTTER * 2;
  const step = slideWidth + space.md;
  const list = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [still, setStill] = useState(true);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) =>
      setStill(reduced),
    );
  }, []);

  useEffect(() => {
    if (still || held) return;
    const timer = setTimeout(() => {
      const next = (index + 1) % slides.length;
      list.current?.scrollToOffset({ offset: next * step, animated: true });
      setIndex(next);
    }, SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index, held, still, slides.length, step]);

  const settle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIndex(Math.round(event.nativeEvent.contentOffset.x / step));
      setHeld(false);
    },
    [step],
  );

  return (
    <View style={{ marginTop: space.xl }}>
      <FlatList
        ref={list}
        horizontal
        data={slides}
        keyExtractor={(slide) => slide.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.md }}
        onScrollBeginDrag={() => setHeld(true)}
        onMomentumScrollEnd={settle}
        getItemLayout={(_, i) => ({ length: step, offset: step * i, index: i })}
        renderItem={({ item }) => <SlideCard slide={item} width={slideWidth} />}
      />
      <View style={styles.dots} accessibilityElementsHidden>
        {slides.map((slide, i) => (
          <View
            key={slide.id}
            style={[styles.dot, i === index && styles.dotOn]}
          />
        ))}
      </View>
    </View>
  );
}

function SlideCard({ slide, width }: { slide: Slide; width: number }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${slide.title}. ${slide.cta}`}
      onPress={() => {
        tapHaptic();
        router.push(slide.href);
      }}
      style={({ pressed }) => [
        styles.slide,
        { width },
        pressed && { transform: [{ scale: 0.985 }] },
      ]}
    >
      <LinearGradient
        colors={slide.wash}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {slide.fit === "cover" ? (
        <Image
          source={slide.art}
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          style={styles.slideCover}
        />
      ) : (
        <>
          <View style={styles.slideGlow} />
          <Image
            source={slide.art}
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            style={styles.slideCutout}
          />
        </>
      )}
      <LinearGradient
        colors={gradients.scrim}
        locations={[0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.slideCopy}>
        <View style={styles.slideTag}>
          <Text style={styles.slideTagText}>{slide.eyebrow}</Text>
        </View>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideBody} numberOfLines={2}>
          {slide.body}
        </Text>
        <View style={styles.slideCta}>
          <Text style={styles.slideCtaText}>{slide.cta}</Text>
          <ArrowRight color={colors.onPrimary} size={16} />
        </View>
      </View>
    </Pressable>
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
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${title}, view all`}
        onPress={() => router.push(href)}
        style={styles.shelfHeader}
      >
        <Text style={text.heading} accessibilityRole="header">
          {title}
        </Text>
        <View style={styles.seeAll}>
          <Text style={styles.seeAllText}>See all</Text>
          <ChevronRight color={colors.link} size={16} />
        </View>
      </Pressable>
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    paddingHorizontal: GUTTER,
  },
  mark: { width: 40, height: 40, borderRadius: 13 },
  hello: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkSubtle },
  name: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.raisedHigh,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.gold },

  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 52,
    marginTop: space.lg,
    marginHorizontal: GUTTER,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  searchText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.inkSubtle,
  },

  categories: {
    gap: space.md,
    paddingHorizontal: GUTTER,
    paddingTop: space.xl,
  },
  category: { width: 72, alignItems: "center", gap: space.sm },
  categoryTile: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  // In a centred stack, text takes its width from the stack: Android rounds a
  // shrink-wrapped measurement down, which clips the last letters.
  categoryLabel: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.inkMuted,
  },

  slide: {
    height: SLIDE_HEIGHT,
    borderRadius: radius.sheet - 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: colors.card,
  },
  slideCover: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SLIDE_HEIGHT * 0.66,
    width: "100%",
  },
  slideGlow: {
    position: "absolute",
    top: 36,
    alignSelf: "center",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  slideCutout: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    height: SLIDE_HEIGHT * 0.58,
    width: "100%",
  },
  slideCopy: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: space.xl,
    gap: space.sm,
  },
  slideTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(227,191,85,0.16)",
    borderWidth: 1,
    borderColor: "rgba(227,191,85,0.35)",
  },
  slideTagText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.goldSoft,
  },
  slideTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.7,
    color: colors.ink,
  },
  slideBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  slideCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: space.sm,
    paddingHorizontal: 18,
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  slideCtaText: {
    fontFamily: fonts.bold,
    fontSize: 14.5,
    color: colors.onPrimary,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: space.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lineStrong,
  },
  dotOn: { width: 22, backgroundColor: colors.gold },

  shelf: { marginTop: space.xxl + 4 },
  shelfHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GUTTER,
    marginBottom: space.md,
  },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.link },
  shelfList: { paddingHorizontal: GUTTER, gap: space.md },

  aiWrap: { marginTop: space.xxl + 4, marginHorizontal: GUTTER },
  aiCard: {
    flexDirection: "row",
    minHeight: 200,
    borderRadius: radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(165,148,255,0.22)",
  },
  aiCopy: { flex: 1, padding: space.xl, paddingRight: 0, gap: space.sm },
  aiTag: { flexDirection: "row", alignItems: "center", gap: 5 },
  aiTagText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: colors.violet,
  },
  aiTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  aiBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  aiCta: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: space.xs,
    paddingHorizontal: 14,
    minHeight: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  aiCtaText: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.onPrimary,
  },
  aiArt: { width: 150, alignSelf: "flex-end", height: 190, marginRight: -24 },

  promises: {
    flexDirection: "row",
    gap: space.sm,
    marginTop: space.xxl + 4,
    marginHorizontal: GUTTER,
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  promise: { flex: 1, alignItems: "center", gap: space.sm },
  promiseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227,191,85,0.1)",
  },
  promiseLabel: {
    alignSelf: "stretch",
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    color: colors.inkMuted,
  },

  signoff: {
    paddingHorizontal: GUTTER,
    paddingTop: space.xxl + space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  signoffBig: {
    fontFamily: fonts.extrabold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.4,
    color: colors.raisedHigh,
  },
  signoffSmall: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkSubtle,
  },
});

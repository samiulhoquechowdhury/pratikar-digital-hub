import { router, usePathname, type Href } from "expo-router";
import {
  Compass,
  House,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Typography";
import { tapHaptic } from "@/lib/haptics";
import { colors, fonts, shadowLifted, space } from "@/lib/theme";

const TABS: { href: Href; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/assistant", label: "Pratikar AI", icon: Sparkles },
  { href: "/account", label: "Account", icon: UserRound },
];

/** Which tab a screen belongs to, so the dock always says where you are. */
function activeTab(pathname: string): number {
  if (pathname === "/") return 0;
  if (pathname.startsWith("/assistant")) return 2;
  if (/^\/(explore|documents|library|courses|search)/.test(pathname)) return 1;
  return 3;
}

/**
 * The bottom dock, on every screen: it sits outside the navigator, so
 * opening a product or a document keeps it in reach. Icon and label together,
 * always, so nothing relies on the colour. Only the screens before sign-in
 * go without.
 */
export function Dock() {
  const pathname = usePathname();
  const { bottom } = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Out of the way while typing, so a text box sits on the keyboard.
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardOpen(true),
    );
    const hidden = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardOpen(false),
    );
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  // Not before sign-in: the onboarding and the login are the whole screen.
  if (keyboardOpen || pathname === "/welcome" || pathname.startsWith("/login"))
    return null;

  const active = activeTab(pathname);

  const open = (href: Href) => {
    tapHaptic();
    // Back to the tabs first, so the stack doesn't grow with every tap.
    if (router.canDismiss()) router.dismissAll();
    router.navigate(href);
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(bottom, space.md) }]}>
      <View style={styles.bar}>
        {TABS.map((tab, index) => {
          const focused = index === active;
          return (
            <Pressable
              key={tab.label}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: focused }}
              onPress={() => open(tab.href)}
              style={({ pressed }) => [
                styles.tab,
                pressed && !focused && { opacity: 0.7 },
              ]}
            >
              {/* Keyed so the pill is drawn afresh: Android loses the corners
                  when a background is added to a view that's already on screen. */}
              <View
                key={focused ? "on" : "off"}
                style={[styles.cell, focused && styles.cellOn]}
              >
                <tab.icon
                  color={focused ? colors.gold : colors.inkSubtle}
                  size={21}
                  strokeWidth={focused ? 2.2 : 1.8}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.label, focused && styles.labelOn]}
                >
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The page shows around the bar, so it floats.
  wrap: {
    paddingTop: space.sm,
    paddingHorizontal: space.lg,
    backgroundColor: colors.canvas,
  },
  bar: {
    flexDirection: "row",
    padding: 6,
    borderRadius: 30,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    ...shadowLifted,
  },
  tab: { flex: 1 },
  cell: {
    minHeight: 54,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  cellOn: { backgroundColor: colors.raisedHigh },
  // In a centred stack, text takes its width from the stack: Android rounds a
  // shrink-wrapped measurement down, which clips the last letters.
  label: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.inkSubtle,
  },
  labelOn: { fontFamily: fonts.bold, color: colors.ink },
});

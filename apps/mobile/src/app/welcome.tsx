import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  BadgeCheck,
  FileText,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import {
  Image,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Typography";
import { Button } from "@/components/ui";
import { colors, fonts, radius, space } from "@/lib/theme";

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment -- how React Native loads an image asset */
const LOGO = require("../../assets/icon.png") as number;
const ART = require("../../assets/home/drafting.webp") as number;
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment */

/** What Pratikar does — true of everything on sale. */
const POINTS: { icon: LucideIcon; label: string }[] = [
  { icon: FileText, label: "Advocate-written" },
  { icon: Sparkles, label: "Pratikar AI" },
  { icon: BadgeCheck, label: "Reviewed drafts" },
];

/**
 * The first screen: the picture, who we are, and the way in. The app needs
 * an account, and an account needs only a mobile number.
 */
export default function WelcomeScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const artHeight = Math.min(height * 0.56, 520);

  return (
    <View style={styles.screen}>
      <Image
        source={ART}
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        style={[styles.art, { height: artHeight }]}
      />
      <LinearGradient
        colors={["rgba(7,8,11,0.35)", "rgba(7,8,11,0)", colors.canvas]}
        locations={[0, 0.35, 1]}
        style={[styles.art, { height: artHeight + 2 }]}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: top + space.lg, paddingBottom: bottom + space.xl },
        ]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Image
            source={LOGO}
            accessibilityLabel="Pratikar logo"
            style={styles.mark}
          />
          <Text style={styles.name}>Pratikar</Text>
        </View>

        <View style={[styles.copy, { marginTop: artHeight - 150 }]}>
          <Text style={styles.tagline}>Har ghar mein kanooni gyaan</Text>
          <Text style={styles.headline} accessibilityRole="header">
            Legal help,{"\n"}made simple.
          </Text>
          <Text style={styles.lede}>
            Documents, forms and guides written by advocates — in plain
            language, on your phone.
          </Text>

          <View style={styles.points}>
            {POINTS.map((point) => (
              <View key={point.label} style={styles.point}>
                <point.icon color={colors.gold} size={14} strokeWidth={2.2} />
                <Text style={styles.pointLabel}>{point.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label="Continue with mobile number"
            icon={<Smartphone color={colors.onPrimary} size={19} />}
            onPress={() => router.push("/login")}
          />
          <Text style={styles.fine}>
            New here? Your account is created when you verify your number.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  art: { position: "absolute", top: 0, left: 0, right: 0, width: "100%" },
  body: { flexGrow: 1, paddingHorizontal: space.xl },
  brand: { flexDirection: "row", alignItems: "center", gap: space.sm },
  mark: { width: 36, height: 36, borderRadius: 11 },
  name: {
    fontFamily: fonts.extrabold,
    fontSize: 19,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  copy: { gap: space.md },
  tagline: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.goldText,
  },
  headline: {
    fontFamily: fonts.extrabold,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -1.6,
    color: colors.ink,
  },
  lede: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.inkMuted,
  },
  points: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
    marginTop: space.xs,
  },
  point: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  pointLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },
  actions: { marginTop: "auto", paddingTop: space.xxl, gap: space.md },
  // In a centred stack, text takes its width from the stack: Android rounds a
  // shrink-wrapped measurement down, which clips the last letters.
  fine: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.inkSubtle,
  },
});

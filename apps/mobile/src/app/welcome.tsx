import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BadgeCheck,
  FileText,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/Typography";
import { Button } from "@/components/ui";
import { colors, fonts, gradients, space } from "@/lib/theme";

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment -- how React Native loads an image asset
const LOGO = require("../../assets/icon.png") as number;

/** What Pratikar does, in three lines — true of everything on sale. */
const POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: FileText,
    title: "Legal documents, done right",
    body: "Ready templates and legal forms written by advocates.",
  },
  {
    icon: Sparkles,
    title: "Pratikar AI",
    body: "Ask in English, Hindi or your own language.",
  },
  {
    icon: BadgeCheck,
    title: "Reviewed by advocates",
    body: "Have any document checked before you sign it.",
  },
];

/**
 * The first screen: who we are, and the way in. The app needs an account,
 * and an account needs only a mobile number.
 */
export default function WelcomeScreen() {
  const { top, bottom } = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      {/* Two soft rings behind the logo — the brand's gold, barely there. */}
      <View pointerEvents="none" style={[styles.ring, styles.ringLarge]} />
      <View pointerEvents="none" style={[styles.ring, styles.ringSmall]} />

      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: top + space.xxl, paddingBottom: bottom + space.xl },
        ]}
        bounces={false}
      >
        <View style={styles.brand}>
          <Image
            source={LOGO}
            accessibilityLabel="Pratikar logo"
            style={styles.mark}
          />
          <Text style={styles.name}>Pratikar</Text>
          <Text style={styles.tagline}>Har ghar mein kanooni gyaan</Text>
        </View>

        <View style={styles.points}>
          {POINTS.map((point) => (
            <View key={point.title} style={styles.point}>
              <View style={styles.pointIcon}>
                <point.icon color={colors.gold} size={20} strokeWidth={1.9} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{point.title}</Text>
                <Text style={styles.pointBody}>{point.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            label="Continue with mobile number"
            variant="gold"
            icon={<Smartphone color={colors.noir} size={19} />}
            onPress={() => router.push("/login")}
          />
          <Text style={styles.fine}>
            New here? Your account is created when you verify your number.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    paddingHorizontal: space.xl,
    gap: space.xxl,
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.16)",
  },
  ringLarge: { width: 520, height: 520, top: -150, right: -230 },
  ringSmall: { width: 300, height: 300, top: -40, right: -120 },
  brand: { alignItems: "center", gap: space.sm, marginTop: space.xl },
  mark: { width: 104, height: 104, borderRadius: 32, marginBottom: space.md },
  // In a centred stack, text takes its width from the stack: Android rounds a
  // shrink-wrapped measurement down, which clips the last letters.
  name: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 46,
    color: colors.inkInverse,
  },
  tagline: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.medium,
    fontSize: 14,
    letterSpacing: 0.4,
    color: colors.goldSoft,
  },
  points: { gap: space.lg },
  point: { flexDirection: "row", alignItems: "center", gap: space.md },
  pointIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  pointTitle: {
    fontFamily: fonts.bold,
    fontSize: 15.5,
    color: colors.inkInverse,
  },
  pointBody: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.inkInverseMuted,
  },
  actions: { marginTop: "auto", gap: space.md },
  fine: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.inkInverseMuted,
  },
});

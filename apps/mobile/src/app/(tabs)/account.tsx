import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  FileText,
  GraduationCap,
  HelpCircle,
  LogOut,
  Receipt,
  RotateCcw,
  Scale,
  Settings,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react-native";
import { ScrollView, StyleSheet, View } from "react-native";

import { PageHeader } from "@/components/PageHeader";
import { Text } from "@/components/Typography";
import { Button, ListRow } from "@/components/ui";
import { siteUrl } from "@/lib/config";
import { confirmAction } from "@/lib/platform";
import {
  colors,
  fonts,
  gradients,
  radius,
  shadow,
  space,
  text,
} from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

interface Row {
  label: string;
  icon: LucideIcon;
  tint: string;
  href?: Href;
  /** A page that stays on the website, opened in the in-app browser. */
  web?: string;
}

const { sky, sand, mint, blush, lilac } = colors.banner;

const MINE: Row[] = [
  {
    label: "My documents",
    icon: FileText,
    tint: sky,
    href: "/account/documents",
  },
  { label: "My library", icon: BookOpen, tint: sand, href: "/account/library" },
  {
    label: "My courses",
    icon: GraduationCap,
    tint: mint,
    href: "/account/courses",
  },
  {
    label: "Orders and invoices",
    icon: Receipt,
    tint: blush,
    href: "/account/orders",
  },
  {
    label: "Notifications",
    icon: Bell,
    tint: lilac,
    href: "/account/notifications",
  },
  {
    label: "Profile and privacy",
    icon: Settings,
    tint: colors.ivory,
    href: "/account/settings",
  },
];

const HELP: Row[] = [
  { label: "Questions and answers", icon: HelpCircle, tint: sky, href: "/faq" },
  {
    label: "Verify a certificate",
    icon: BadgeCheck,
    tint: mint,
    href: "/verify",
  },
  { label: "Terms of use", icon: Scale, tint: colors.ivory, web: "/terms" },
  {
    label: "Privacy policy",
    icon: ShieldCheck,
    tint: colors.ivory,
    web: "/privacy",
  },
  {
    label: "Refunds and cancellations",
    icon: RotateCcw,
    tint: colors.ivory,
    web: "/refunds",
  },
];

export default function AccountScreen() {
  const { user, logout } = useAuth();

  const confirmLogout = () =>
    confirmAction({
      title: "Log out?",
      message: "You'll need a new code to sign in again.",
      confirmLabel: "Log out",
      destructive: true,
      onConfirm: () => void logout(),
    });

  return (
    <View style={{ flex: 1 }}>
      <PageHeader title="Account" />
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profile}
        >
          {user ? (
            <View style={styles.identity}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user.name ?? "?").trim().charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user.name ?? "Your account"}</Text>
                <Text style={styles.status}>Signed in</Text>
              </View>
            </View>
          ) : (
            <View style={{ gap: space.md }}>
              <Text style={styles.name}>Your documents, everywhere</Text>
              <Text style={styles.status}>
                Log in to see your documents, purchases and courses — the same
                account as the website.
              </Text>
              <Button
                label="Log in or sign up"
                variant="gold"
                onPress={() => router.push("/login")}
              />
            </View>
          )}
        </LinearGradient>

        {user ? <Section title="Your account" rows={MINE} /> : null}
        <Section title="Help and policies" rows={HELP} />

        {user ? (
          <Button
            label="Log out"
            variant="secondary"
            icon={<LogOut color={colors.noir} size={18} />}
            onPress={confirmLogout}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <View>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.list}>
        {rows.map((row, index) => (
          <ListRow
            key={row.label}
            icon={row.icon}
            tint={row.tint}
            title={row.label}
            divider={index > 0}
            onPress={() =>
              row.web
                ? void WebBrowser.openBrowserAsync(siteUrl(row.web))
                : row.href && router.push(row.href)
            }
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.lg,
    gap: space.xl,
    paddingBottom: space.xxl,
  },
  profile: { padding: space.xl, borderRadius: radius.card + 4 },
  identity: { flexDirection: "row", alignItems: "center", gap: space.md },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.display, fontSize: 23, color: colors.noir },
  name: { fontFamily: fonts.bold, fontSize: 18, color: colors.inkInverse },
  status: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.inkInverseMuted,
  },
  sectionTitle: {
    ...text.eyebrow,
    color: colors.inkSubtle,
    marginBottom: space.sm,
  },
  list: {
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    overflow: "hidden",
    ...shadow,
  },
});

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { Text, TextInput } from "@/components/Typography";
import { tapHaptic } from "@/lib/haptics";
import { colors, fonts, radius, shadow, space, text } from "@/lib/theme";

// The controls every screen is built from — the app's version of packages/ui.

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold";

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress?: PressableProps["onPress"];
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  const inactive = disabled || loading;
  const palette = BUTTON_COLORS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityHint={accessibilityHint}
      onPress={(event) => {
        tapHaptic();
        onPress?.(event);
      }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && styles.pressed,
        inactive && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonLabel, { color: palette.fg }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const BUTTON_COLORS: Record<
  ButtonVariant,
  { bg: string; fg: string; border: string }
> = {
  primary: { bg: colors.noir, fg: colors.inkInverse, border: colors.noir },
  secondary: {
    bg: colors.surface,
    fg: colors.noir,
    border: colors.lineStrong,
  },
  ghost: { bg: "transparent", fg: colors.noir, border: "transparent" },
  // Gold always carries navy text — never white (8.44:1).
  gold: { bg: colors.gold, fg: colors.noir, border: colors.gold },
};

export function Field({
  label,
  hint,
  error,
  ...input
}: TextInputProps & { label: string; hint?: string; error?: string | null }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkSubtle}
        {...input}
        onFocus={(event) => {
          setFocused(true);
          input.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          input.onBlur?.(event);
        }}
        style={[
          styles.input,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
          input.style,
        ]}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={text.small}>{hint}</Text>
      ) : null}
    </View>
  );
}

/** A soft round tile holding an icon. */
export function IconTile({
  icon: Icon,
  tint = colors.banner.sky,
  color = colors.noir,
  size = 44,
}: {
  icon: LucideIcon;
  tint?: string;
  color?: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.34,
          backgroundColor: tint,
        },
      ]}
    >
      <Icon color={color} size={size * 0.48} strokeWidth={1.9} />
    </View>
  );
}

/** A full-screen loading, error or empty state. */
export function StateView({
  loading,
  icon,
  title,
  body,
  action,
}: {
  loading?: boolean;
  icon?: LucideIcon;
  title?: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.state}>
      {loading ? <ActivityIndicator size="large" color={colors.noir} /> : null}
      {icon ? <IconTile icon={icon} size={64} /> : null}
      {title ? (
        <Text style={[text.heading, styles.stateText]}>{title}</Text>
      ) : null}
      {body ? <Text style={[text.muted, styles.stateText]}>{body}</Text> : null}
      {action ? <View style={{ marginTop: space.sm }}>{action}</View> : null}
    </View>
  );
}

/** A grey shape that breathes, standing in for content on its way. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [opacity]);
  return <Animated.View style={[styles.skeleton, { opacity }, style]} />;
}

/** Two columns of card shapes, for a catalogue on its way. */
export function CardGridSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading" style={styles.skeletonGrid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skeletonCard}>
          <Skeleton style={{ height: 96, borderRadius: 0 }} />
          <View style={{ padding: space.md, gap: space.sm }}>
            <Skeleton style={{ height: 14, width: "85%" }} />
            <Skeleton style={{ height: 12, width: "55%" }} />
            <Skeleton
              style={{ height: 14, width: "35%", marginTop: space.sm }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "gold" | "success" | "warning" | "danger" | "lilac";
}) {
  const palette = PILL_COLORS[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.pillLabel, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const PILL_COLORS = {
  neutral: { bg: colors.ivoryDeep, fg: colors.ink },
  gold: { bg: colors.banner.sand, fg: colors.goldInk },
  success: { bg: colors.successSubtle, fg: colors.success },
  warning: { bg: colors.warningSubtle, fg: colors.warning },
  danger: { bg: colors.dangerSubtle, fg: colors.danger },
  lilac: { bg: colors.banner.lilac, fg: colors.noir },
} as const;

/** A filter: on, or off. */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipOn,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[styles.chipLabel, selected && { color: colors.inkInverse }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** A white rounded surface. */
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** An inline message: a payment confirming, an error, a success. */
export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const palette = NOTICE_COLORS[tone];
  return (
    <View
      accessibilityRole={tone === "danger" ? "alert" : "text"}
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: palette.bg }]}
    >
      <palette.icon color={palette.fg} size={18} style={{ marginTop: 1 }} />
      <Text
        style={{ flex: 1, color: palette.fg, fontSize: 14, lineHeight: 20 }}
      >
        {children}
      </Text>
    </View>
  );
}

const NOTICE_COLORS = {
  info: { bg: colors.banner.sky, fg: colors.noir, icon: Info },
  success: {
    bg: colors.successSubtle,
    fg: colors.success,
    icon: CheckCircle2,
  },
  warning: {
    bg: colors.warningSubtle,
    fg: colors.warning,
    icon: AlertTriangle,
  },
  danger: { bg: colors.dangerSubtle, fg: colors.danger, icon: XCircle },
} as const;

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={text.heading} accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

/** A tappable row with an icon tile — the account and Explore lists. */
export function ListRow({
  icon,
  tint,
  title,
  subtitle,
  trailing,
  onPress,
  divider = false,
}: {
  icon?: LucideIcon;
  tint?: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  divider?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        divider && styles.rowDivider,
        pressed && { backgroundColor: colors.canvas },
      ]}
    >
      {icon ? <IconTile icon={icon} tint={tint} size={40} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={text.subheading}>{title}</Text>
        {subtitle ? <Text style={text.small}>{subtitle}</Text> : null}
      </View>
      {trailing}
      <ChevronRight color={colors.inkSubtle} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    borderRadius: radius.control + 2,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  buttonLabel: { fontFamily: fonts.bold, fontSize: 15.5 },
  // Pressing never moves the layout; only the thing itself eases in.
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  label: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  inputFocused: { borderColor: colors.noir },
  inputError: { borderColor: colors.danger },
  error: { fontSize: 13, color: colors.danger },
  tile: { alignItems: "center", justifyContent: "center" },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xxl,
    gap: space.md,
  },
  // In a centred stack, text takes its width from the stack: Android rounds a
  // shrink-wrapped measurement down, which clips the last letters.
  stateText: { alignSelf: "stretch", textAlign: "center" },
  skeleton: { backgroundColor: colors.ivoryDeep, borderRadius: 6 },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
    padding: space.lg,
  },
  skeletonCard: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  pillLabel: { fontFamily: fonts.bold, fontSize: 12 },
  chip: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.noir, borderColor: colors.noir },
  chipLabel: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.lg,
    ...shadow,
  },
  notice: {
    flexDirection: "row",
    gap: space.sm,
    borderRadius: radius.control,
    padding: space.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: 64,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.line },
});

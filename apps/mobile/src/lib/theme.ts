// The Pratikar design language: the website's brand colours
// (packages/config/tailwind-preset.js) in a softer, rounder app setting.
// Same contrast rules as the site: navy (`noir`) for primary actions and
// dark bands, gold only as an accent or on navy — never gold text on a light
// surface; `goldInk` is the darkened gold for that.
export const colors = {
  noir: "#0b1f3a",
  noirSoft: "#122e52",
  noirRaised: "#1a3d6b",
  /** The screen behind the cards. */
  canvas: "#f4f6fa",
  ivory: "#eef1f6",
  ivoryDeep: "#e4e9f1",
  ivoryLine: "#e6eaf1",
  surface: "#ffffff",
  ink: "#101828",
  inkMuted: "#475467",
  inkSubtle: "#667085",
  inkInverse: "#ffffff",
  inkInverseMuted: "#d6deea",
  line: "#e6eaf1",
  lineStrong: "#cfd6e2",
  gold: "#d4af37",
  goldSoft: "#f0dc9a",
  goldInk: "#6f561b",
  warning: "#92400e",
  warningSubtle: "#fff8e8",
  danger: "#8b1e2d",
  dangerSubtle: "#fcf0f1",
  success: "#047857",
  successSubtle: "#e9f9f2",
  banner: {
    sky: "#e6effb",
    sand: "#fbf1d8",
    mint: "#e2f4ec",
    blush: "#fbe8e8",
    lilac: "#ece8fa",
  },
} as const;

/** The navy wash behind heroes, the login screen and the AI card. */
export const gradients = {
  hero: [colors.noir, colors.noirSoft, colors.noirRaised],
  gold: ["#e6c65c", colors.gold],
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = {
  control: 14,
  card: 20,
  sheet: 28,
  pill: 999,
} as const;

/** One family per weight: Android ignores fontWeight on a custom font. */
export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
  /** Headlines only. */
  display: "Fraunces_600SemiBold",
} as const;

export const text = {
  display: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 38,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 27,
    lineHeight: 33,
    color: colors.ink,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 19,
    lineHeight: 25,
    color: colors.ink,
  },
  subheading: {
    fontFamily: fonts.semibold,
    fontSize: 15.5,
    lineHeight: 22,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  small: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSubtle,
  },
  /** Small capitals above a title. */
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.goldInk,
  },
} as const;

/** Cards at rest. */
export const shadow = {
  shadowColor: colors.noir,
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;

/** Things floating above the page: the tab bar, sheets. */
export const shadowLifted = {
  shadowColor: colors.noir,
  shadowOpacity: 0.14,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 10 },
  elevation: 10,
} as const;

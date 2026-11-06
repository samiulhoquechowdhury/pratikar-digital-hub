// The Pratikar app's design language: a dark, image-led look — a near-black
// canvas, charcoal cards drawn with hairlines rather than shadows, warm white
// for the one thing to press, and the brand's gold as the only accent.
//
// Names say what a colour is for, not what it looks like, so a screen reads
// the same whichever way the palette goes:
//   canvas → card → raised → raisedHigh   the layers, back to front
//   ink / inkMuted / inkSubtle             text, strongest to quietest
//   primary + onPrimary                    the main action, and what sits on it
//   gold / goldText                        the accent, and gold set as text
export const colors = {
  /** The screen behind everything. */
  canvas: "#07080b",
  /** Cards, sheets, the dock. */
  card: "#111319",
  /** Inputs, rows and chips inside a card. */
  raised: "#181b23",
  raisedHigh: "#20242e",
  line: "#1f232c",
  lineStrong: "#2e3340",

  ink: "#f6f4ef",
  inkMuted: "#b4b9c4",
  inkSubtle: "#808796",

  /** The main action — and the strongest text, selected borders, icons. */
  primary: "#f6f4ef",
  primarySoft: "#d9d5cc",
  /** Text and icons on `primary`. */
  onPrimary: "#0a0b0f",
  onPrimaryMuted: "#474b55",
  /** Links in running text: "View all", "Change". */
  link: "#e8c766",

  gold: "#e3bf55",
  goldSoft: "#f2dc97",
  /** Gold set as text or an icon. */
  goldText: "#e8c766",
  /** The AI's colour: Pratikar AI, drafting. */
  violet: "#a594ff",

  warning: "#f5b544",
  warningSubtle: "#2a2111",
  danger: "#ff8a8a",
  dangerSubtle: "#2c1418",
  success: "#4fd99a",
  successSubtle: "#0f2a1e",

  /** Deep tints, each a kind of thing: templates, forms, checklists… */
  banner: {
    sky: "#11203a",
    sand: "#2a2212",
    mint: "#0f2620",
    blush: "#2c1622",
    lilac: "#1e1838",
  },
} as const;

/** Washes for heroes and featured cards. */
export const gradients = {
  hero: ["#141a2b", "#0b0e17", colors.canvas],
  gold: ["#f2d67a", colors.gold],
  /** Pratikar AI. */
  violet: ["#2a2160", "#14112b"],
  /** Fades a picture into the text laid over it. */
  scrim: ["rgba(7,8,11,0)", "rgba(7,8,11,0.72)", "rgba(7,8,11,0.96)"],
  /** One per kind, for product art. */
  sky: ["#1f3a66", "#101c33"],
  sand: ["#4a3a17", "#211a0c"],
  mint: ["#17473a", "#0c211b"],
  blush: ["#4d2238", "#22101a"],
  lilac: ["#3a2d70", "#191433"],
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = {
  control: 16,
  card: 24,
  sheet: 32,
  pill: 999,
} as const;

/** One family per weight: Android ignores fontWeight on a custom font. */
export const fonts = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
  /** Headlines: heavy and tight. */
  display: "PlusJakartaSans_800ExtraBold",
} as const;

export const text = {
  display: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -1,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 33,
    letterSpacing: -0.7,
    color: colors.ink,
  },
  heading: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  subheading: {
    fontFamily: fonts.bold,
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
    fontSize: 14.5,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  small: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSubtle,
  },
  /** Small capitals above a title. */
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.goldText,
  },
} as const;

/** Cards at rest: on a dark canvas the hairline does the work. */
export const shadow = {
  borderWidth: 1,
  borderColor: colors.line,
} as const;

/** Things floating above the page: the dock, sheets. */
export const shadowLifted = {
  shadowColor: "#000",
  shadowOpacity: 0.5,
  shadowRadius: 28,
  shadowOffset: { width: 0, height: 12 },
  elevation: 16,
} as const;

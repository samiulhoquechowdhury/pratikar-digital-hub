/**
 * Shared Tailwind preset for apps/web and apps/admin.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS THE ONLY FILE THAT DEFINES A COLOUR. Components reference semantic
 * names (`bg-surface`, `text-ink-muted`, `border-line`) and never raw palette
 * steps, so a palette change is an edit here and nowhere else. If you find
 * yourself writing `text-[#D4AF37]` or `bg-navy-800` in a component, add a
 * semantic token here instead.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Palette: the official Pratikar Digital Hub brand sheet.
 *
 *   Navy   #0B1F3A  primary      trust, stability, professionalism   ~60%
 *   Gold   #D4AF37  accent       premium, excellence, authority      ~20%
 *   White  #FFFFFF  secondary    clarity                             ~10%
 *   Red    #8B1E2D  accent       energy, action, importance          ~5%
 *   Gray   #1F2937  neutral      balance, modern                     ~5%
 *
 * ── THE ONE RULE THAT MATTERS ───────────────────────────────────────────────
 * GOLD ON WHITE IS 2.10:1. It is unreadable and fails WCAG at any text size.
 * Gold is a BACKGROUND colour (with near-black text on it: 8.44:1) or a text
 * colour ON NAVY (7.86:1) — never gold text on a light surface. Where a
 * gold-toned text colour is genuinely needed on white, use `text-gold-ink`
 * (a darkened gold, 6.95:1) rather than reaching for the brand hex.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Everything else in the brand sheet is comfortably accessible:
 *   white on navy 16.52:1 · #E5E7EB on navy 13.34:1 · gold on navy 7.86:1
 *   near-black on gold 8.44:1 · white on red 9.05:1 · near-black on white 17.74:1
 *
 * Layout intent: navy dominates the CHROME — header, hero, marketing bands,
 * footer — while reading surfaces (documents, forms, tables, dashboards) stay
 * light. The brand sheet's "navy as dominant background" is written for
 * marketing pages; this product also asks people to read legal text and fill
 * long forms, and an all-dark reading surface makes that measurably harder.
 * Navy sets the tone, white does the work.
 */

/** Raw ramps. Nothing outside this object should be a hex value. */
const PALETTE = {
  // Built around brand navy #0B1F3A, which sits at 800.
  navy: {
    50: "#edf2f8",
    100: "#cfdceb",
    200: "#a3bddb",
    300: "#6b93c4",
    400: "#3a6ba8",
    500: "#244f86",
    600: "#1a3d6b",
    700: "#122e52",
    800: "#0b1f3a",
    900: "#081729",
    950: "#050f1d",
  },
  // Built around brand gold #D4AF37, which sits at 500. Steps 700-900 exist
  // only so gold-toned text can reach AA on light surfaces — see `gold-ink`.
  gold: {
    50: "#fdf9ec",
    100: "#faf0ce",
    200: "#f3e09b",
    300: "#e9cb65",
    400: "#dfbb47",
    500: "#d4af37",
    600: "#b8942a",
    700: "#937320",
    800: "#6f561b",
    900: "#4c3a14",
  },
  // Built around brand red #8B1E2D, which sits at 600.
  red: {
    50: "#fcf2f3",
    100: "#f8e0e3",
    200: "#f0c0c6",
    300: "#e195a0",
    400: "#c85d6d",
    500: "#a83345",
    600: "#8b1e2d",
    700: "#741926",
    800: "#5c141e",
    900: "#440f17",
  },
  // The brand's neutral #1F2937 and text colours #E5E7EB / #111827 are all
  // steps of this scale, so the whole ramp comes along coherently.
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  // Feedback greens/ambers aren't in the brand sheet, which only covers brand
  // colours. Chosen to sit alongside it without competing, and never used as
  // the sole signal — components pair them with text or an icon.
  green: { 50: "#ecfdf5", 100: "#d1fae5", 600: "#047857", 700: "#036045", 800: "#065f46" },
  amber: { 50: "#fffbeb", 100: "#fef3c7", 600: "#b45309", 700: "#92400e", 800: "#78350f" },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        navy: PALETTE.navy,
        gold: PALETTE.gold,

        /** Light surfaces — where reading and data entry happen. */
        canvas: PALETTE.gray[50],
        surface: "#ffffff",
        "surface-sunken": PALETTE.gray[100],

        /** Dark surfaces — chrome, hero, footer, marketing bands. */
        "surface-inverse": PALETTE.navy[800],
        "surface-inverse-deep": PALETTE.navy[900],
        "surface-inverse-raised": PALETTE.navy[700],

        /** Text on light surfaces. */
        ink: PALETTE.gray[900], // #111827 — the brand's "dark text"
        "ink-muted": PALETTE.gray[600],
        "ink-subtle": PALETTE.gray[500],

        /** Text on navy. */
        "ink-inverse": "#ffffff", // the brand's "primary text"
        "ink-inverse-muted": PALETTE.gray[200], // the brand's "secondary text"

        /** Borders. */
        line: PALETTE.gray[200],
        "line-strong": PALETTE.gray[300],
        "line-inverse": PALETTE.navy[700],

        /**
         * Primary action = gold, with near-black text on it (8.44:1).
         * `on-brand` is that text colour; never put white on gold.
         */
        brand: {
          DEFAULT: PALETTE.gold[500],
          hover: PALETTE.gold[400],
          active: PALETTE.gold[600],
          subtle: PALETTE.gold[50],
          border: PALETTE.gold[200],
        },
        "on-brand": PALETTE.navy[900],

        /** Gold as a *text* colour on light surfaces. 6.95:1 — see header note. */
        "gold-ink": PALETTE.gold[800],

        /** The navy half of the brand, for chrome and secondary emphasis. */
        primary: {
          DEFAULT: PALETTE.navy[800],
          hover: PALETTE.navy[700],
          subtle: PALETTE.navy[50],
          border: PALETTE.navy[200],
        },

        /**
         * Brand red. Reserved for genuinely important or destructive actions
         * per the brand sheet — not decoration.
         */
        danger: {
          DEFAULT: PALETTE.red[600],
          hover: PALETTE.red[700],
          subtle: PALETTE.red[50],
          border: PALETTE.red[100],
          text: PALETTE.red[700],
        },

        success: {
          DEFAULT: PALETTE.green[600],
          subtle: PALETTE.green[50],
          border: PALETTE.green[100],
          text: PALETTE.green[800],
        },
        warning: {
          DEFAULT: PALETTE.amber[600],
          subtle: PALETTE.amber[50],
          border: PALETTE.amber[100],
          text: PALETTE.amber[800],
        },
      },

      // --font-sans is set by next/font in each app's root layout, so the font
      // is self-hosted and swappable per app without touching this preset.
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },

      // Long legal text is the product, so body copy is 16px minimum and line
      // height is generous. The scale is deliberately short — more sizes than
      // this and screens drift out of rhythm.
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.125rem" }],
        sm: ["0.875rem", { lineHeight: "1.375rem" }],
        base: ["1rem", { lineHeight: "1.625rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.375rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.625rem" }],
        "5xl": ["3rem", { lineHeight: "3.25rem" }],
      },

      borderRadius: {
        card: "0.75rem",
        control: "0.5rem",
      },

      // Shadows tinted with navy rather than neutral black, so cards sit on
      // the palette instead of looking grey against it.
      boxShadow: {
        card: "0 1px 2px 0 rgb(11 31 58 / 0.05), 0 1px 3px 0 rgb(11 31 58 / 0.07)",
        raised: "0 4px 6px -1px rgb(11 31 58 / 0.08), 0 2px 4px -2px rgb(11 31 58 / 0.06)",
        overlay: "0 20px 25px -5px rgb(11 31 58 / 0.14), 0 8px 10px -6px rgb(11 31 58 / 0.10)",
      },

      // The brand sheet's hero treatment: deep navy with a subtle warm lift.
      backgroundImage: {
        "hero-navy":
          "radial-gradient(ellipse 80% 60% at 70% 40%, rgb(18 46 82 / 0.85), transparent 60%), linear-gradient(135deg, #081729 0%, #0b1f3a 55%, #122e52 100%)",
      },

      // Reading measure. Legal copy past ~75 characters per line is genuinely
      // harder to follow, so content columns are capped rather than fluid.
      maxWidth: {
        prose: "68ch",
        shell: "72rem",
      },
    },
  },
};

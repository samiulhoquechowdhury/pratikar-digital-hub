/**
 * Shared Tailwind preset for apps/web and apps/admin.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS IS THE ONLY FILE THAT DEFINES A COLOUR. Components reference semantic
 * names (`bg-surface`, `text-ink-muted`, `border-line`) and never raw palette
 * steps, so swapping in the real brand palette is an edit here and nowhere
 * else. If you find yourself writing `text-[#123456]` or `bg-navy-700` in a
 * component, add a semantic token here instead.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * STATUS: the ramps below are PLACEHOLDERS built around the three brand colours
 * named in packages/ui (Deep Navy, Royal Blue, Cyan). They are a structurally
 * complete, accessibility-checked stand-in — not the real brand. Replace the
 * hex values in PALETTE when the brand/design system doc arrives; the semantic
 * layer underneath should not need to change.
 *
 * Contrast: every pairing used as text-on-background below meets WCAG AA
 * (4.5:1 for body text, 3:1 for large text and UI borders). Preserve that when
 * the real values land — legal-services customers include people reading long
 * documents on bad screens, and this is the cheapest accessibility win there is.
 */

/** Raw ramps. Nothing outside this object should be a hex value. */
const PALETTE = {
  // Deep Navy — headers, primary text, the "serious" anchor of the brand.
  navy: {
    50: "#f1f4f9",
    100: "#dde5f0",
    200: "#c0cfe3",
    300: "#94b0ce",
    400: "#618bb4",
    500: "#406e9a",
    600: "#325781",
    700: "#2a4769",
    800: "#0f2440",
    900: "#0a1a2f",
    950: "#060f1c",
  },
  // Royal Blue — primary actions, links, focus.
  royal: {
    50: "#eff5ff",
    100: "#dbe8fe",
    200: "#bfd7fe",
    300: "#93bbfd",
    400: "#6096fa",
    500: "#3b76f6",
    600: "#2559eb",
    700: "#1d45d8",
    800: "#1e3aaf",
    900: "#1e358a",
    950: "#172354",
  },
  // Cyan — accent only: highlights, badges, illustration. Never body text on
  // white; it cannot reach 4.5:1 at any usable lightness.
  cyan: {
    50: "#ecfeff",
    100: "#cff9fe",
    200: "#a5f1fc",
    300: "#67e4f9",
    400: "#22cee8",
    500: "#06b0ce",
    600: "#088ca9",
    700: "#0e7089",
    800: "#155b70",
    900: "#164c5f",
    950: "#083141",
  },
  // Warm neutral rather than pure grey: pure #000/#888 on white reads clinical,
  // and this product is asking people to trust it with legal documents.
  slate: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  // Feedback colours. Money and legal documents are involved, so success and
  // danger must be unmistakable and must not rely on hue alone (pair with an
  // icon or text in components).
  green: { 50: "#ecfdf5", 100: "#d1fae5", 600: "#059669", 700: "#047857", 800: "#065f46" },
  amber: { 50: "#fffbeb", 100: "#fef3c7", 600: "#d97706", 700: "#b45309", 800: "#92400e" },
  red: { 50: "#fef2f2", 100: "#fee2e2", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b" },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Raw ramps stay available for one-off needs, but prefer the semantic
        // names below — they're what survives a rebrand.
        navy: PALETTE.navy,
        royal: PALETTE.royal,
        accent: PALETTE.cyan,

        /** Page and panel backgrounds. */
        canvas: PALETTE.slate[50],
        surface: "#ffffff",
        "surface-sunken": PALETTE.slate[100],
        "surface-inverse": PALETTE.navy[800],

        /** Text. `ink` is body copy; `ink-muted` is secondary but still AA. */
        ink: PALETTE.navy[900],
        "ink-muted": PALETTE.slate[600],
        "ink-subtle": PALETTE.slate[500],
        "ink-inverse": "#ffffff",
        "ink-on-brand": "#ffffff",

        /** Borders and dividers. */
        line: PALETTE.slate[200],
        "line-strong": PALETTE.slate[300],

        /** Primary action. */
        brand: {
          DEFAULT: PALETTE.royal[700],
          hover: PALETTE.royal[800],
          active: PALETTE.royal[900],
          subtle: PALETTE.royal[50],
          border: PALETTE.royal[200],
        },

        /** Feedback. Each has a subtle background, a border, and readable text. */
        success: {
          DEFAULT: PALETTE.green[700],
          subtle: PALETTE.green[50],
          border: PALETTE.green[100],
          text: PALETTE.green[800],
        },
        warning: {
          DEFAULT: PALETTE.amber[700],
          subtle: PALETTE.amber[50],
          border: PALETTE.amber[100],
          text: PALETTE.amber[800],
        },
        danger: {
          DEFAULT: PALETTE.red[600],
          subtle: PALETTE.red[50],
          border: PALETTE.red[100],
          text: PALETTE.red[800],
        },
      },

      // --font-sans is set by next/font in each app's root layout, so the font
      // is self-hosted and swappable per app without touching this preset.
      // The stack after it is what renders if that variable is ever missing.
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

      boxShadow: {
        card: "0 1px 2px 0 rgb(15 36 64 / 0.04), 0 1px 3px 0 rgb(15 36 64 / 0.06)",
        raised: "0 4px 6px -1px rgb(15 36 64 / 0.07), 0 2px 4px -2px rgb(15 36 64 / 0.05)",
        overlay: "0 20px 25px -5px rgb(15 36 64 / 0.12), 0 8px 10px -6px rgb(15 36 64 / 0.08)",
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

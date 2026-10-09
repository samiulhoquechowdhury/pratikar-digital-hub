import type { LucideIcon } from "lucide-react";

/**
 * The one way the web app draws an icon.
 *
 * Replaces glyphs and emoji — ✓ ✕ 🔒 ▶ ← → 📄 🎓 — that had been standing in
 * for icons across 23 places. Those render in whatever font the reader's OS
 * picks, so the lock was a different shape on every device, sat on a
 * different baseline from the text beside it, and could not be coloured by a
 * token. A vector set fixes all three.
 *
 * Stroke and size are decided here rather than per call site, because "one
 * icon family" only holds while nothing overrides it. A caller chooses a size
 * from the scale below and never a raw pixel value.
 *
 * ── ACCESSIBILITY ─────────────────────────────────────────────────────────
 * Decorative by default: an icon beside a word ("✓ Lesson completed") adds
 * nothing for a screen reader, which would otherwise announce "check mark
 * Lesson completed". Pass `label` only when the icon carries meaning on its
 * own — a lone lock in a list, a status with no accompanying text.
 */

const SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export type IconSize = keyof typeof SIZES;

/**
 * 1.75 rather than Lucide's default 2. At 16–20px on a light surface the
 * default reads heavy beside Inter's regular weight; this sits with the text
 * instead of shouting over it.
 */
const STROKE = 1.75;

export function Icon({
  icon: Glyph,
  size = "sm",
  label,
  className = "",
}: {
  icon: LucideIcon;
  size?: IconSize;
  /** Accessible name. Omit for decorative icons beside visible text. */
  label?: string;
  className?: string;
}) {
  const px = SIZES[size];
  return (
    <Glyph
      width={px}
      height={px}
      strokeWidth={STROKE}
      // Keeps icons from shrinking when a flex row gets tight, which is what
      // made the glyphs drift off-baseline in narrow cards.
      className={`shrink-0 ${className}`}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": true, focusable: false })}
    />
  );
}

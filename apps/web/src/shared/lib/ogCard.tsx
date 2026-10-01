import presetConfig from "@pratikar/config/tailwind-preset";
import { ImageResponse } from "next/og";

import { SITE_NAME } from "./site";

/** The size every link preview uses; WhatsApp, LinkedIn and X crop to it. */
export const OG_SIZE = { width: 1200, height: 630 };

type Font = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700;
  style: "normal";
};

/**
 * The site's own faces, fetched from Google Fonts with only the characters
 * this card uses. Needed rather than decorative: the renderer's built-in font
 * has no ₹, so every price printed as "□234".
 *
 * Returns null if anything goes wrong — the card then falls back to the
 * built-in font and writes "Rs.", so a network hiccup costs the typography,
 * never a broken price.
 */
async function loadFont(
  family: string,
  weight: Font["weight"],
  text: string,
): Promise<Font | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`,
      { next: { revalidate: 60 * 60 * 24 } },
    ).then((res) => (res.ok ? res.text() : ""));
    const url =
      /src: url\(([^)]+)\) format\('(?:truetype|opentype|woff)'\)/.exec(
        css,
      )?.[1];
    if (!url) return null;
    const data = await fetch(url, {
      next: { revalidate: 60 * 60 * 24 },
    }).then((res) => (res.ok ? res.arrayBuffer() : null));
    return data ? { name: family, data, weight, style: "normal" } : null;
  } catch {
    return null;
  }
}

// From the brand preset, not written out again: it is the one file that
// defines a colour. Share images can't use Tailwind classes, so they read the
// same values directly.
type Ramp = Record<
  50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
  string
>;

/** The part of the (plain-JS) preset this file reads. */
interface PresetColors {
  theme: {
    extend: {
      colors: {
        navy: Ramp;
        gold: Ramp;
        ink: string;
        "ink-muted": string;
        surface: string;
      };
    };
  };
}

const { colors } = (presetConfig as unknown as PresetColors).theme.extend;
const NAVY = colors.navy[800];
const NAVY_SOFT = colors.navy[50];
const GOLD = colors.gold[500];
const INK = colors.ink;
const INK_MUTED = colors["ink-muted"];
const WHITE = colors.surface;

/**
 * A branded share card: what the thing is, its name, and — for a product —
 * what it costs. Light like the site, with the navy tile and gold rule as the
 * brand marks. Gold only ever as a shape here; as text on white it fails
 * contrast, in an image as on a page.
 */
export async function renderOgCard({
  kind,
  title,
  price,
}: {
  kind: string;
  title: string;
  /** Already formatted, GST included — e.g. "₹411.82 incl. GST". */
  price?: string;
}) {
  // Long titles get a smaller size rather than being cut mid-word.
  const titleSize = title.length > 60 ? 56 : title.length > 36 ? 68 : 80;

  const tagline = "Legal documents · Courses · Guides";
  const sansText = `${SITE_NAME}${kind}${tagline}${price ?? ""}P`;
  const [sans, sansBold, serif] = await Promise.all([
    loadFont("Inter", 400, sansText),
    loadFont("Inter", 600, sansText),
    loadFont("Source Serif 4", 700, title),
  ]);
  const fonts = [sans, sansBold, serif].filter((f): f is Font => f !== null);
  const hasRupee = sans !== null && sansBold !== null;
  const shownPrice = hasRupee ? price : price?.replace("₹", "Rs. ");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: `linear-gradient(135deg, ${WHITE} 55%, ${NAVY_SOFT} 100%)`,
        fontFamily: sans ? "Inter" : "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            background: NAVY,
            color: GOLD,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            fontWeight: 700,
          }}
        >
          P
        </div>
        <div style={{ fontSize: 30, fontWeight: 600, color: INK }}>
          {SITE_NAME}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 30, fontWeight: 600, color: NAVY }}>{kind}</div>
        <div
          style={{
            marginTop: 16,
            fontSize: titleSize,
            fontWeight: 700,
            fontFamily: serif ? "Source Serif 4" : undefined,
            color: INK,
            lineHeight: 1.08,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 28,
            width: 120,
            height: 8,
            borderRadius: 4,
            background: GOLD,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 30,
          color: INK_MUTED,
        }}
      >
        <div>{tagline}</div>
        {shownPrice && (
          <div
            style={{
              display: "flex",
              padding: "12px 28px",
              borderRadius: 999,
              background: NAVY,
              color: WHITE,
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            {shownPrice}
          </div>
        )}
      </div>
    </div>,
    { ...OG_SIZE, fonts },
  );
}

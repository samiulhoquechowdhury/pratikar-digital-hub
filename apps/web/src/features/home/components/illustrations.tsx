/**
 * The home page's illustrations, drawn as inline SVG.
 *
 * Drawn rather than photographed: a stock photo of a gavel says nothing about
 * this product and dates the page, while these show the actual things it
 * deals in — documents, seals, checklists, a certificate — in the brand's
 * navy and gold. They scale crisply, weigh a few kilobytes, and need no
 * image requests.
 *
 * Every one is decorative (aria-hidden): the copy beside it says the same
 * thing in words. Colours use the brand palette directly — illustration needs
 * more shades than the semantic tokens offer — and never carry meaning.
 *
 * The motif throughout is the logo's own: columns, as on a courthouse.
 */

type ArtProps = { className?: string };

/* ───────────────────────────────────────────────────── backgrounds */

/**
 * Courthouse columns and arches, very faint, behind the hero. Sits on navy;
 * drawn in thin gold and navy lines at low opacity.
 */
export function PillarsBackdrop({ className = "" }: ArtProps) {
  const columns = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <svg
      aria-hidden
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="pillar-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d4af37" stopOpacity="0" />
          <stop offset="0.55" stopColor="#d4af37" stopOpacity="0.16" />
          <stop offset="1" stopColor="#d4af37" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="arch-glow" cx="0.72" cy="0.18" r="0.6">
          <stop offset="0" stopColor="#3a6ba8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#0b1f3a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="640" fill="url(#arch-glow)" />
      {/* Concentric arches, upper right, like a vaulted ceiling */}
      {[260, 340, 420, 500].map((r, i) => (
        <circle
          key={r}
          cx="1080"
          cy="640"
          r={r}
          stroke="#d4af37"
          strokeOpacity={0.09 - i * 0.015}
          strokeWidth="1"
        />
      ))}
      {/* The colonnade along the bottom */}
      <g stroke="url(#pillar-fade)" strokeWidth="1.25">
        <line x1="40" y1="452" x2="1400" y2="452" />
        <line x1="40" y1="462" x2="1400" y2="462" />
        {columns.map((i) => {
          const x = 90 + i * 180;
          return (
            <g key={i}>
              <rect x={x} y="470" width="44" height="170" />
              <line x1={x + 11} y1="476" x2={x + 11} y2="640" />
              <line x1={x + 22} y1="476" x2={x + 22} y2="640" />
              <line x1={x + 33} y1="476" x2={x + 33} y2="640" />
              <rect x={x - 6} y="462" width="56" height="8" />
            </g>
          );
        })}
      </g>
      {/* Pediment */}
      <path
        d="M40 452 L720 352 L1400 452"
        stroke="#d4af37"
        strokeOpacity="0.1"
        strokeWidth="1.25"
      />
    </svg>
  );
}

/** A gold wax seal stamped with the logo's columns. */
export function Seal({ className = "" }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className={className}>
      <defs>
        <radialGradient id="seal-wax" cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#f1d78a" />
          <stop offset="0.55" stopColor="#d4af37" />
          <stop offset="1" stopColor="#9c7a1c" />
        </radialGradient>
      </defs>
      {/* Scalloped wax edge */}
      <path
        d={
          Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r = i % 2 === 0 ? 58 : 52;
            return `${i === 0 ? "M" : "L"}${(60 + r * Math.cos(a)).toFixed(1)} ${(60 + r * Math.sin(a)).toFixed(1)}`;
          }).join(" ") + "Z"
        }
        fill="url(#seal-wax)"
      />
      <circle
        cx="60"
        cy="60"
        r="40"
        fill="none"
        stroke="#7a5f14"
        strokeOpacity="0.55"
        strokeWidth="1.5"
      />
      <circle
        cx="60"
        cy="60"
        r="35"
        fill="none"
        stroke="#7a5f14"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="2 3"
      />
      {/* Columns, the logo's mark */}
      <g fill="#6b5312" fillOpacity="0.85">
        <rect x="40" y="42" width="40" height="5" rx="1" />
        <rect x="44" y="50" width="6" height="26" />
        <rect x="57" y="50" width="6" height="26" />
        <rect x="70" y="50" width="6" height="26" />
        <rect x="40" y="78" width="40" height="5" rx="1" />
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────────── offering artwork */

/** AI drafting: a pen nib writing lines onto a page, with sparkles. */
export function DraftingArt({ className = "" }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 280 200" className={className} fill="none">
      <rect
        x="40"
        y="22"
        width="150"
        height="170"
        rx="10"
        fill="#122e52"
        stroke="#244f86"
      />
      <rect x="58" y="44" width="80" height="8" rx="4" fill="#d4af37" />
      {[66, 82, 98, 114, 130, 146].map((y, i) => (
        <rect
          key={y}
          x="58"
          y={y}
          width={i % 3 === 2 ? 70 : 114}
          height="5"
          rx="2.5"
          fill="#3a6ba8"
          fillOpacity={i < 4 ? 0.9 : 0.35}
        />
      ))}
      {/* The line being written */}
      <rect x="58" y="162" width="52" height="5" rx="2.5" fill="#f1d78a" />
      {/* Pen */}
      <g transform="translate(118 138) rotate(-38)">
        <rect x="0" y="-9" width="104" height="18" rx="9" fill="#d4af37" />
        <rect x="70" y="-9" width="8" height="18" fill="#9c7a1c" />
        <path d="M0 -9 L-22 0 L0 9 Z" fill="#f1d78a" />
        <path d="M-22 0 L-12 -3.5 L-12 3.5 Z" fill="#0b1f3a" />
      </g>
      {/* Sparkles */}
      {[
        { x: 212, y: 40, s: 1 },
        { x: 236, y: 72, s: 0.7 },
        { x: 204, y: 92, s: 0.5 },
      ].map(({ x, y, s }) => (
        <path
          key={`${x}-${y}`}
          d={`M${x} ${y - 12 * s} Q${x + 2 * s} ${y - 2 * s} ${x + 12 * s} ${y} Q${x + 2 * s} ${y + 2 * s} ${x} ${y + 12 * s} Q${x - 2 * s} ${y + 2 * s} ${x - 12 * s} ${y} Q${x - 2 * s} ${y - 2 * s} ${x} ${y - 12 * s} Z`}
          fill="#f1d78a"
        />
      ))}
    </svg>
  );
}

/** Templates: a form with fields filled and ticked. */
export function FormArt({ className = "" }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 240 180" className={className} fill="none">
      <rect
        x="44"
        y="14"
        width="152"
        height="160"
        rx="10"
        fill="#ffffff"
        stroke="#cfdceb"
      />
      <rect x="62" y="32" width="70" height="8" rx="4" fill="#0b1f3a" />
      {[56, 92, 128].map((y, i) => (
        <g key={y}>
          <rect x="62" y={y} width="40" height="5" rx="2.5" fill="#a3bddb" />
          <rect
            x="62"
            y={y + 11}
            width="116"
            height="18"
            rx="5"
            fill="#edf2f8"
            stroke={i === 2 ? "#d4af37" : "#cfdceb"}
          />
          {i < 2 ? (
            <>
              <rect
                x="70"
                y={y + 18}
                width={i === 0 ? 54 : 40}
                height="4"
                rx="2"
                fill="#244f86"
              />
              <circle cx="166" cy={y + 20} r="6" fill="#047857" />
              <path
                d={`M163 ${y + 20} l2 2 l4 -4`}
                stroke="#fff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <rect x="70" y={y + 16} width="1.5" height="8" fill="#0b1f3a" />
          )}
        </g>
      ))}
    </svg>
  );
}

/** The library: books and a folder, standing. */
export function LibraryArt({ className = "" }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 240 180" className={className} fill="none">
      <line
        x1="24"
        y1="164"
        x2="216"
        y2="164"
        stroke="#cfdceb"
        strokeWidth="2"
      />
      {[
        [44, 58, 24, "#0b1f3a"],
        [70, 44, 28, "#244f86"],
        [100, 70, 22, "#d4af37"],
        [124, 50, 26, "#122e52"],
      ].map(([x, y, w, c]) => (
        <g key={x as number}>
          <rect
            x={x as number}
            y={y as number}
            width={w as number}
            height={164 - (y as number)}
            rx="3"
            fill={c as string}
          />
          <rect
            x={(x as number) + 5}
            y={(y as number) + 14}
            width={(w as number) - 10}
            height="3"
            rx="1.5"
            fill="#ffffff"
            fillOpacity="0.55"
          />
          <rect
            x={(x as number) + 5}
            y={(y as number) + 22}
            width={(w as number) - 14}
            height="3"
            rx="1.5"
            fill="#ffffff"
            fillOpacity="0.35"
          />
        </g>
      ))}
      {/* A leaning book */}
      <rect
        x="156"
        y="66"
        width="22"
        height="98"
        rx="3"
        fill="#3a6ba8"
        transform="rotate(12 167 164)"
      />
      {/* A folder with a checklist peeking out */}
      <rect
        x="176"
        y="112"
        width="40"
        height="52"
        rx="4"
        fill="#edf2f8"
        stroke="#a3bddb"
      />
      <path
        d="M182 124 l3 3 l6 -6 M182 138 l3 3 l6 -6"
        stroke="#047857"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="194" y="123" width="16" height="3" rx="1.5" fill="#a3bddb" />
      <rect x="194" y="137" width="16" height="3" rx="1.5" fill="#a3bddb" />
    </svg>
  );
}

/** Checklists: a clipboard with ticks. */
export function ChecklistArt({ className = "" }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 240 180" className={className} fill="none">
      <rect
        x="62"
        y="22"
        width="116"
        height="152"
        rx="10"
        fill="#ffffff"
        stroke="#cfdceb"
      />
      <rect x="94" y="12" width="52" height="20" rx="6" fill="#0b1f3a" />
      {[52, 82, 112, 142].map((y, i) => (
        <g key={y}>
          <rect
            x="80"
            y={y - 8}
            width="16"
            height="16"
            rx="4"
            fill={i < 3 ? "#d4af37" : "#edf2f8"}
            stroke={i < 3 ? "none" : "#a3bddb"}
          />
          {i < 3 && (
            <path
              d={`M84 ${y} l3 3 l6 -6`}
              stroke="#0b1f3a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          <rect
            x="106"
            y={y - 3}
            width={i % 2 ? 46 : 58}
            height="6"
            rx="3"
            fill="#a3bddb"
          />
        </g>
      ))}
    </svg>
  );
}

/** Courses: a lesson screen and a ribboned certificate. */
export function CourseArt({ className = "" }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 240 180" className={className} fill="none">
      <rect x="26" y="30" width="140" height="92" rx="8" fill="#0b1f3a" />
      <rect x="34" y="38" width="124" height="70" rx="4" fill="#122e52" />
      <circle cx="96" cy="73" r="16" fill="#d4af37" />
      <path d="M91 65 L104 73 L91 81 Z" fill="#0b1f3a" />
      <rect x="34" y="112" width="80" height="4" rx="2" fill="#d4af37" />
      <rect x="114" y="112" width="44" height="4" rx="2" fill="#244f86" />
      {/* Certificate */}
      <g transform="translate(120 84) rotate(8)">
        <rect
          x="0"
          y="0"
          width="96"
          height="70"
          rx="5"
          fill="#ffffff"
          stroke="#e6c766"
          strokeWidth="2"
        />
        <rect x="18" y="14" width="60" height="5" rx="2.5" fill="#0b1f3a" />
        <rect x="26" y="25" width="44" height="3" rx="1.5" fill="#a3bddb" />
        <rect x="22" y="33" width="52" height="3" rx="1.5" fill="#a3bddb" />
        <circle cx="48" cy="52" r="9" fill="#d4af37" />
        <path
          d="M43 59 L40 70 L45 67 L48 72 L48 61 Z M53 59 L56 70 L51 67 L48 72 L48 61 Z"
          fill="#9c7a1c"
        />
      </g>
    </svg>
  );
}

/* ────────────────────────────────────────────── feature artwork */

/** A phone showing an assistant conversation. */
export function PhoneChatArt({ className = "" }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 260 420" className={className} fill="none">
      <defs>
        <linearGradient id="phone-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a3d6b" />
          <stop offset="1" stopColor="#081729" />
        </linearGradient>
      </defs>
      <rect x="10" y="6" width="240" height="408" rx="36" fill="#050f1d" />
      <rect
        x="20"
        y="16"
        width="220"
        height="388"
        rx="28"
        fill="url(#phone-glass)"
      />
      <rect x="96" y="26" width="68" height="16" rx="8" fill="#050f1d" />
      {/* Header */}
      <circle cx="48" cy="70" r="12" fill="#d4af37" />
      <path d="M44 66 l4 -4 l4 4 l-4 4 Z" fill="#0b1f3a" />
      <rect x="68" y="64" width="80" height="6" rx="3" fill="#e5e7eb" />
      <rect x="68" y="74" width="50" height="4" rx="2" fill="#6b93c4" />
      {/* You */}
      <rect x="86" y="104" width="138" height="52" rx="14" fill="#d4af37" />
      <rect
        x="98"
        y="116"
        width="112"
        height="5"
        rx="2.5"
        fill="#0b1f3a"
        fillOpacity="0.75"
      />
      <rect
        x="98"
        y="127"
        width="96"
        height="5"
        rx="2.5"
        fill="#0b1f3a"
        fillOpacity="0.75"
      />
      <rect
        x="98"
        y="138"
        width="60"
        height="5"
        rx="2.5"
        fill="#0b1f3a"
        fillOpacity="0.75"
      />
      {/* Assistant */}
      <rect
        x="36"
        y="172"
        width="160"
        height="62"
        rx="14"
        fill="#122e52"
        stroke="#244f86"
      />
      <rect x="48" y="186" width="130" height="5" rx="2.5" fill="#cfdceb" />
      <rect x="48" y="197" width="118" height="5" rx="2.5" fill="#cfdceb" />
      <rect x="48" y="208" width="84" height="5" rx="2.5" fill="#cfdceb" />
      {/* Recommended item cards */}
      {[248, 300].map((y, i) => (
        <g key={y}>
          <rect x="36" y={y} width="188" height="42" rx="10" fill="#ffffff" />
          <rect
            x="46"
            y={y + 9}
            width="24"
            height="24"
            rx="6"
            fill={i === 0 ? "#edf2f8" : "#fdf9ec"}
          />
          <rect
            x="52"
            y={y + 15}
            width="12"
            height="12"
            rx="2"
            fill={i === 0 ? "#244f86" : "#d4af37"}
          />
          <rect
            x="78"
            y={y + 11}
            width="90"
            height="5"
            rx="2.5"
            fill="#0b1f3a"
          />
          <rect x="78" y={y + 22} width="60" height="4" rx="2" fill="#a3bddb" />
          <rect
            x="182"
            y={y + 15}
            width="32"
            height="12"
            rx="6"
            fill="#d4af37"
          />
        </g>
      ))}
      {/* Input */}
      <rect
        x="32"
        y="360"
        width="196"
        height="30"
        rx="15"
        fill="#081729"
        stroke="#244f86"
      />
      <rect x="46" y="372" width="96" height="5" rx="2.5" fill="#3a6ba8" />
      <circle cx="212" cy="375" r="11" fill="#d4af37" />
      <path
        d="M212 380 L212 370 M208 374 L212 370 L216 374"
        stroke="#0b1f3a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A certificate, large, for the courses banner. */
export function CertificateArt({ className = "" }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 360 260" className={className} fill="none">
      <rect x="20" y="16" width="320" height="228" rx="12" fill="#fdf9ec" />
      <rect
        x="32"
        y="28"
        width="296"
        height="204"
        rx="8"
        stroke="#d4af37"
        strokeWidth="2"
      />
      <rect
        x="38"
        y="34"
        width="284"
        height="192"
        rx="6"
        stroke="#e6c766"
        strokeDasharray="3 4"
      />
      <g fill="#0b1f3a">
        <rect x="160" y="52" width="40" height="4" rx="1" />
        <rect x="164" y="58" width="5" height="14" />
        <rect x="177" y="58" width="5" height="14" />
        <rect x="190" y="58" width="5" height="14" />
        <rect x="160" y="73" width="40" height="4" rx="1" />
      </g>
      <rect x="110" y="92" width="140" height="7" rx="3.5" fill="#9c7a1c" />
      <rect x="140" y="110" width="80" height="4" rx="2" fill="#a3bddb" />
      <rect x="88" y="126" width="184" height="12" rx="6" fill="#0b1f3a" />
      <rect x="120" y="148" width="120" height="4" rx="2" fill="#a3bddb" />
      <rect x="100" y="158" width="160" height="4" rx="2" fill="#a3bddb" />
      <line
        x1="64"
        y1="204"
        x2="140"
        y2="204"
        stroke="#0b1f3a"
        strokeOpacity="0.4"
      />
      <rect x="74" y="210" width="56" height="4" rx="2" fill="#a3bddb" />
      {/* QR */}
      <g transform="translate(250 172)">
        <rect width="44" height="44" rx="4" fill="#ffffff" stroke="#cfdceb" />
        {[
          [5, 5],
          [13, 5],
          [5, 13],
          [25, 5],
          [33, 5],
          [33, 13],
          [5, 25],
          [5, 33],
          [13, 33],
          [21, 21],
          [29, 25],
          [21, 33],
          [33, 33],
          [25, 13],
          [13, 21],
        ].map(([x, y]) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="6"
            height="6"
            fill="#0b1f3a"
          />
        ))}
      </g>
      {/* Ribboned seal */}
      <g transform="translate(176 186)">
        <path
          d="M-12 8 L-20 46 L-6 38 L0 50 L2 12 Z M12 8 L20 46 L6 38 L0 50 L-2 12 Z"
          fill="#9c7a1c"
        />
        <circle r="20" fill="#d4af37" />
        <circle r="14" fill="none" stroke="#7a5f14" strokeOpacity="0.5" />
      </g>
    </svg>
  );
}

/** A shield emblem with columns, for "why trust us". */
export function ShieldEmblem({ className = "" }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 320 340" className={className} fill="none">
      <defs>
        <linearGradient id="shield-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a3d6b" />
          <stop offset="1" stopColor="#081729" />
        </linearGradient>
        <linearGradient id="shield-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1d78a" />
          <stop offset="1" stopColor="#9c7a1c" />
        </linearGradient>
      </defs>
      {[150, 128, 106].map((r, i) => (
        <circle
          key={r}
          cx="160"
          cy="170"
          r={r}
          stroke="#d4af37"
          strokeOpacity={0.12 + i * 0.06}
        />
      ))}
      <path
        d="M160 40 L262 78 L262 168 C262 236 218 280 160 304 C102 280 58 236 58 168 L58 78 Z"
        fill="url(#shield-fill)"
        stroke="url(#shield-rim)"
        strokeWidth="5"
      />
      <g fill="#d4af37">
        <path d="M104 128 L160 100 L216 128 Z" />
        <rect x="104" y="132" width="112" height="8" rx="2" />
        <rect x="114" y="146" width="12" height="62" rx="2" />
        <rect x="138" y="146" width="12" height="62" rx="2" />
        <rect x="170" y="146" width="12" height="62" rx="2" />
        <rect x="194" y="146" width="12" height="62" rx="2" />
        <rect x="100" y="214" width="120" height="10" rx="2" />
      </g>
      <circle
        cx="232"
        cy="250"
        r="30"
        fill="#047857"
        stroke="#081729"
        strokeWidth="4"
      />
      <path
        d="M219 250 l9 9 l17 -18"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Legal forms: a typed form with an official-looking stamp. */
export function StampArt({ className = "" }: ArtProps) {
  return (
    <svg aria-hidden viewBox="0 0 240 180" className={className} fill="none">
      <rect
        x="70"
        y="30"
        width="120"
        height="140"
        rx="8"
        fill="#edf2f8"
        transform="rotate(6 130 100)"
      />
      <rect
        x="52"
        y="20"
        width="124"
        height="148"
        rx="8"
        fill="#ffffff"
        stroke="#cfdceb"
      />
      <rect x="84" y="36" width="60" height="6" rx="3" fill="#0b1f3a" />
      {[56, 68, 80, 92, 104].map((y, i) => (
        <g key={y}>
          <rect
            x="68"
            y={y}
            width={i % 2 ? 72 : 92}
            height="4"
            rx="2"
            fill="#a3bddb"
          />
          {i === 2 && (
            <rect
              x="128"
              y={y - 1}
              width="30"
              height="6"
              rx="1"
              fill="none"
              stroke="#3a6ba8"
              strokeDasharray="2 2"
            />
          )}
        </g>
      ))}
      {/* Stamp */}
      <g transform="translate(132 132) rotate(-14)">
        <rect
          x="-34"
          y="-17"
          width="68"
          height="34"
          rx="5"
          fill="none"
          stroke="#b91c1c"
          strokeOpacity="0.75"
          strokeWidth="3"
        />
        <rect
          x="-26"
          y="-6"
          width="52"
          height="5"
          rx="2.5"
          fill="#b91c1c"
          fillOpacity="0.7"
        />
        <rect
          x="-18"
          y="3"
          width="36"
          height="4"
          rx="2"
          fill="#b91c1c"
          fillOpacity="0.5"
        />
      </g>
    </svg>
  );
}

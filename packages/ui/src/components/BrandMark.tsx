/**
 * Pratikar's mark: a "P" drawn as a classical column — the capital and
 * fluted shaft for the law, the bowl of the P closing around it. Traced from
 * the client's logo as paths, so it's sharp at any size from a 16px tab icon
 * to a hero, and takes its colour from the surrounding text.
 *
 * Decorative by default: it always sits beside the name "Pratikar".
 */
export function BrandMark({
  className = "",
  title,
}: {
  className?: string;
  /** Give one only when the mark stands alone, with no name beside it. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 300 380"
      fill="currentColor"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M2 3H192A108 113 0 0 1 192 229H178V196H192A75 80 0 0 0 192 36H24Z" />
      <path d="M22 58H190Q188 80 168 80H44Q24 80 22 58Z" />
      <rect x="46" y="100" width="114" height="19" />
      <path d="M57 125H76V359L57 377Z" />
      <path d="M94 125H112V320L94 338Z" />
      <path d="M130 125H148V282L130 300Z" />
    </svg>
  );
}

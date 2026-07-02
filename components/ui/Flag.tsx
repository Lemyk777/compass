import type { DestinationCode } from "@/lib/data/destinations";

// Small SVG flags. Emoji flags don't render on Windows (they fall back to the
// two-letter code, e.g. "US"), so we draw simple, consistent flags instead.
// Shapes are intentionally simplified — recognizable at ~14–28px, not heraldic.
const SHAPES: Record<DestinationCode, JSX.Element> = {
  US: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect y="0" width="20" height="2" fill="#B22234" />
      <rect y="4" width="20" height="2" fill="#B22234" />
      <rect y="8" width="20" height="2" fill="#B22234" />
      <rect y="12" width="20" height="2" fill="#B22234" />
      <rect width="9" height="8" fill="#3C3B6E" />
    </>
  ),
  IT: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="6.67" height="14" fill="#009246" />
      <rect x="13.33" width="6.67" height="14" fill="#CE2B37" />
    </>
  ),
  HK: (
    <>
      <rect width="20" height="14" fill="#DE2910" />
      <circle cx="10" cy="7" r="3.4" fill="#fff" />
      <circle cx="10" cy="7" r="1.2" fill="#DE2910" />
    </>
  ),
  AE: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect x="5" y="0" width="15" height="4.67" fill="#009739" />
      <rect x="5" y="9.33" width="15" height="4.67" fill="#000" />
      <rect width="5" height="14" fill="#EF3340" />
    </>
  ),
  KR: (
    // Taegeuk with a real yin-yang S-curve (red over blue) + solid corner
    // trigram bars. The bars are deliberately unbroken — at 14–20px the real
    // flag's broken-bar detail dissolves into pixel noise.
    <>
      <rect width="20" height="14" fill="#fff" />
      <circle cx="10" cy="7" r="3.4" fill="#0047A0" />
      <path
        d="M6.6 7a3.4 3.4 0 0 1 6.8 0 1.7 1.7 0 0 1-3.4 0 1.7 1.7 0 0 0-3.4 0Z"
        fill="#CD2E3A"
      />
      <g fill="#212121">
        <rect x="1.5" y="1.8" width="3.2" height="0.8" rx="0.2" />
        <rect x="1.5" y="3" width="3.2" height="0.8" rx="0.2" />
        <rect x="1.5" y="4.2" width="3.2" height="0.8" rx="0.2" />
        <rect x="15.3" y="1.8" width="3.2" height="0.8" rx="0.2" />
        <rect x="15.3" y="3" width="3.2" height="0.8" rx="0.2" />
        <rect x="15.3" y="4.2" width="3.2" height="0.8" rx="0.2" />
        <rect x="1.5" y="9" width="3.2" height="0.8" rx="0.2" />
        <rect x="1.5" y="10.2" width="3.2" height="0.8" rx="0.2" />
        <rect x="1.5" y="11.4" width="3.2" height="0.8" rx="0.2" />
        <rect x="15.3" y="9" width="3.2" height="0.8" rx="0.2" />
        <rect x="15.3" y="10.2" width="3.2" height="0.8" rx="0.2" />
        <rect x="15.3" y="11.4" width="3.2" height="0.8" rx="0.2" />
      </g>
    </>
  ),
  CN: (
    <>
      <rect width="20" height="14" fill="#DE2910" />
      <polygon
        points="5.5,1.6 6.06,3.23 7.78,3.26 6.40,4.29 6.91,5.94 5.5,4.95 4.09,5.94 4.60,4.29 3.22,3.26 4.94,3.23"
        fill="#FFDE00"
      />
    </>
  ),
  CA: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <rect width="5" height="14" fill="#FF0000" />
      <rect x="15" width="5" height="14" fill="#FF0000" />
      <rect x="9.2" y="5.5" width="1.6" height="3" fill="#FF0000" />
    </>
  ),
};

export function Flag({
  code,
  size = 14,
  className,
}: {
  code: DestinationCode;
  size?: number;
  className?: string;
}) {
  const w = Math.round((size * 20) / 14);
  const clip = `flag-clip-${code}`;
  return (
    <svg
      viewBox="0 0 20 14"
      width={w}
      height={size}
      className={className}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clip}>
          <rect width="20" height="14" rx="2.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>{SHAPES[code]}</g>
      <rect
        x="0.25"
        y="0.25"
        width="19.5"
        height="13.5"
        rx="2.25"
        fill="none"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

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
  KR: (
    <>
      <rect width="20" height="14" fill="#fff" />
      <path d="M7 7a3 3 0 0 1 6 0z" fill="#CD2E3A" />
      <path d="M7 7a3 3 0 0 0 6 0z" fill="#0047A0" />
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

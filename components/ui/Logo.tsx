export function Logo({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-display ${className}`}
      style={style}
    >
      {/* Transparent PNG (white keyed out from the source), so it sits on any
          background with no square. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/compass-mark.png"
        alt=""
        width={24}
        height={24}
        aria-hidden="true"
        className="h-6 w-6 shrink-0 object-contain"
      />
      <span className="text-[1.05rem] font-semibold tracking-tight">Compass</span>
    </span>
  );
}

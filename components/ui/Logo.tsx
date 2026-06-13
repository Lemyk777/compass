export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display ${className}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 12 L16 8 L13 13 L8 16 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="1.4" fill="var(--surface,#fff)" />
      </svg>
      <span className="text-[1.05rem] font-semibold tracking-tight">Compass</span>
    </span>
  );
}

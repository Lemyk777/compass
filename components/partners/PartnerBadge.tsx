import Link from "@/components/ui/Link";
import { partnerMonogram, partnerPath, type PartnerRef } from "@/lib/data/partners";

// "Posted by Astana Hub ✓" — the attribution that travels with every
// partner-posted opportunity.
//
// Two rules this component exists to enforce, in one place rather than on four
// surfaces:
//
//  1. The tick is a factual claim with ONE meaning: we confirmed this account
//     belongs to that organisation, and this row was posted from it. It is not
//     a quality endorsement of the contest, and `verified: false` renders the
//     name with no tick at all rather than a weaker tick.
//  2. A logo never breaks. No file → initials on a tinted square, which reads
//     as an organisation; a broken <img> reads as a bug.
//
// No hooks, no client state: it renders identically in a server component (the
// partner profile page) and inside the client-side opportunity card.

export type BadgeSize = "sm" | "md";

export function PartnerBadge({
  partner,
  size = "sm",
  linked = true,
  className = "",
}: {
  partner: PartnerRef;
  size?: BadgeSize;
  /** Off inside a surface that is already all about this partner. */
  linked?: boolean;
  className?: string;
}) {
  const sm = size === "sm";
  const inner = (
    <>
      <PartnerLogo partner={partner} size={size} />
      <span className={`font-semibold text-ink ${sm ? "text-xs" : "text-sm"}`}>
        {partner.name}
      </span>
      {partner.verified && <VerifiedTick size={size} />}
    </>
  );

  const shared = `inline-flex items-center gap-1.5 ${className}`;

  if (!linked) {
    return (
      <span className={shared} title={badgeTitle(partner)}>
        {inner}
      </span>
    );
  }

  return (
    <Link
      href={partnerPath(partner.id)}
      title={badgeTitle(partner)}
      className={`${shared} rounded-lg transition-opacity hover:opacity-80 focus-visible:focus-ring`}
    >
      {inner}
    </Link>
  );
}

function badgeTitle(partner: PartnerRef): string {
  return partner.verified
    ? `Posted by ${partner.name} — a verified partner. We confirmed this account belongs to them, and they posted this themselves.`
    : `Posted by ${partner.name}.`;
}

export function PartnerLogo({
  partner,
  size = "sm",
  className = "",
}: {
  partner: Pick<PartnerRef, "name" | "logoUrl">;
  size?: BadgeSize | "lg";
  className?: string;
}) {
  const box =
    size === "lg" ? "h-14 w-14 text-lg" : size === "md" ? "h-7 w-7 text-[11px]" : "h-5 w-5 text-[9px]";

  if (partner.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logos are either
      // committed to /public or an organisation's own https URL; next/image
      // would need a remotePatterns entry per partner domain.
      <img
        src={partner.logoUrl}
        alt=""
        aria-hidden
        className={`${box} shrink-0 rounded-md border border-line bg-card object-contain ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-md bg-accent-soft font-semibold uppercase tracking-tight text-accent-ink ${className}`}
    >
      {partnerMonogram(partner.name)}
    </span>
  );
}

/**
 * The tick itself. Deliberately not a bare "✓": it carries an accessible name,
 * so a screen reader hears what it means rather than a decorative glyph.
 */
export function VerifiedTick({ size = "sm" }: { size?: BadgeSize }) {
  const px = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label="Verified partner"
      className={`${px} shrink-0 text-accent`}
      fill="currentColor"
    >
      <path d="M12 1.5l2.4 2.06 3.15-.28.83 3.06 2.7 1.66-1.33 2.87 1.33 2.87-2.7 1.66-.83 3.06-3.15-.28L12 22.5l-2.4-2.06-3.15.28-.83-3.06-2.7-1.66L4.25 13 2.92 10.13l2.7-1.66.83-3.06 3.15.28L12 1.5z" />
      <path
        d="M8.6 12.3l2.2 2.2 4.6-4.6"
        fill="none"
        stroke="var(--color-card, #fff)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The one-line explanation of what the tick means, for surfaces that show it
 * for the first time. Written once, so the claim can never drift between
 * pages — the whole value of the mark is that it means the same thing
 * everywhere.
 */
export function VerifiedExplainer({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-start gap-1.5 text-xs leading-relaxed text-ink-faint ${className}`}>
      <VerifiedTick />
      <span>
        A verified partner posted this themselves. We confirmed the account
        belongs to the organisation — it isn&rsquo;t a judgement about how good
        the opportunity is.
      </span>
    </p>
  );
}

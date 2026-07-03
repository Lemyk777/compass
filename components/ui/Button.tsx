import Link from "./Link";
import { ComponentProps, forwardRef } from "react";

type Variant = "primary" | "ghost" | "subtle" | "tonal" | "danger";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

const sizes = {
  md: "h-12 px-6 text-[0.95rem]",
  lg: "h-14 px-8 text-base",
  sm: "h-11 px-4 text-sm", // Min 44px touch target (UI/UX Pro Max)
};

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90 shadow-card",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  subtle: "bg-card text-ink border border-line hover:border-ink/30 shadow-card",
  // Filled secondary action with real affordance — reads clearly as a button on
  // a white surface (fixes low-contrast "plain text" utility buttons). Dark ink
  // text on a light surface stays well above 4.5:1.
  tonal:
    "bg-surface text-ink border border-line shadow-card hover:bg-ink/[0.05] hover:border-ink/25",
  // Destructive/exit action (e.g. Sign out). Text stays dark ink for AA contrast
  // (coral text on white would fail); the danger signal is the coral tint,
  // border, and icon — and it should be spatially separated from normal actions.
  danger:
    "bg-reach-soft/60 text-ink border border-reach/40 shadow-card hover:bg-reach-soft hover:border-reach/70",
};

type CommonProps = {
  variant?: Variant;
  size?: keyof typeof sizes;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export const ButtonLink = forwardRef<
  HTMLAnchorElement,
  CommonProps & ComponentProps<typeof Link>
>(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      ...props
    },
    ref
  ) => {
    return (
      <Link
        ref={ref}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);

ButtonLink.displayName = "ButtonLink";


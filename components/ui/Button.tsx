import Link from "./Link";
import { ComponentProps, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "subtle" | "tonal" | "danger";
type Shape = "rounded" | "pill";

// The parts below are merged with `cn` (clsx + tailwind-merge), not concatenated
// into a template string — and that is load-bearing, not tidiness.
//
// With concatenation, both `px-8` (from a size) and `px-7` (from a caller) end up
// in the class list, and the winner is decided by the order Tailwind happens to
// emit them in, which is by scale value. So the caller loses, silently, with no
// warning and a green build. The landing page's hero CTA had been asking for
// `px-7 py-4 text-base` and rendering `px-8 h-14 text-base` for as long as it has
// existed; a header link asking for `px-2` on mobile rendered `px-4`. Three call
// sites had already been patched around with `!important` escapes. `cn` makes the
// call site win, which is what every author writing a className already assumed.
const base = cn(
  "inline-flex items-center justify-center gap-2 font-medium",
  // Named properties rather than `transition-all`. The only things that change
  // on these controls are colour, border, elevation and the press scale;
  // `all` additionally transitions height and width, which is how a button ends
  // up animating its own layout when something above it reflows.
  "transition-[background-color,border-color,box-shadow,color,transform] duration-200",
  // The same themed ring the dashboard and admin already use. This used to be
  // `ring-ink ring-offset-white`, and `ink` is near-white in dark mode — so a
  // focused button drew a white ring inside a white halo on a near-black page.
  // `.focus-ring` is `ring-accent` over `ring-offset-surface`; both theme.
  "focus-visible:focus-ring",
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
);

const shapes: Record<Shape, string> = {
  rounded: "rounded-xl",
  // The marketing surface is pill-shaped end to end. It used to say so by
  // writing `rounded-full` at seven separate call sites — a shape the system
  // owns, restated seven times and overridable by accident at any of them.
  pill: "rounded-full",
};

const sizes = {
  sm: "h-11 px-4 text-sm", // 44px — the minimum touch target
  md: "h-12 px-6 text-[0.95rem]",
  lg: "h-14 px-8 text-base",
};

const variants: Record<Variant, string> = {
  // `bg-cta`, not `bg-ink`. `ink` is near-white in dark mode, so every filled
  // primary button was a white slab there — reported twice, about two different
  // buttons. `cta` is the same deep navy in light mode and the accent in dark.
  //
  // `hover:shadow-lift` was written by hand on the landing hero's primary and
  // nowhere else, so the most-pressed button in the product was the only one
  // that acknowledged a pointer with elevation. It belongs to the variant.
  primary: "bg-cta text-cta-ink shadow-card hover:bg-cta/90 hover:shadow-lift",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  subtle:
    "bg-card text-ink border border-line shadow-card hover:border-ink/30 hover:shadow-lift",
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
  shape?: Shape;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  shape = "rounded",
  className,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={cn(
        base,
        shapes[shape],
        sizes[size],
        variants[variant],
        className,
      )}
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
      shape = "rounded",
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Link
        ref={ref}
        className={cn(
          base,
          shapes[shape],
          sizes[size],
          variants[variant],
          className,
        )}
        {...props}
      />
    );
  },
);

ButtonLink.displayName = "ButtonLink";

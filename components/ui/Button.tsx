import Link from "next/link";
import { ComponentProps } from "react";

type Variant = "primary" | "ghost" | "subtle";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:focus-ring disabled:opacity-50 disabled:pointer-events-none";

const sizes = {
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-12 px-6 text-base",
  sm: "h-9 px-3.5 text-sm",
};

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90 shadow-card",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  subtle: "bg-card text-ink border border-line hover:border-ink/30 shadow-card",
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

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

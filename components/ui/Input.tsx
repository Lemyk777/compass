import { ComponentProps, forwardRef } from "react";
import { cn } from "@/lib/utils";

// `cn`, not a template string — same reason as Button.tsx. This sets `h-11`,
// `px-3.5`, `rounded-xl` and a text size, and a caller passing any of those
// would otherwise lose to whichever Tailwind emitted later. Free here: every
// client component that renders an Input already imports Button, so
// tailwind-merge is in those bundles regardless.
//
// Shell.tsx and Logo.tsx still concatenate, deliberately. Neither has a call
// site that overrides one of its own utility groups, and both are imported by
// client components that do NOT carry tailwind-merge — so adopting `cn` there
// would add it to two more bundles to fix nothing that is currently broken. The
// latent case is covered by a test instead (see "no `!important` escapes" in
// scripts/test-engine.ts): a future conflicting call site fails the build rather
// than being patched around with `!`.
export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-line bg-card px-3.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring",
          className,
        )}
        {...props}
      />
    );
  },
);

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-ink-faint">{hint}</span>
      )}
    </label>
  );
}

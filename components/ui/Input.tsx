import { ComponentProps, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`h-11 w-full rounded-xl border border-line bg-card px-3.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus-visible:focus-ring ${className}`}
        {...props}
      />
    );
  }
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
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

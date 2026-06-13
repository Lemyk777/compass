export function Section({
  title,
  hint,
  children,
  className = "",
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`animate-fade-up ${className}`}>
      <div className="mb-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-sm text-ink-soft">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-card p-5 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

"use client";

// Catches errors in the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // This boundary replaces the root layout, so globals.css is gone with it and
  // there is no Tailwind here — the styles have to be inline or in a <style>.
  // That is exactly why it needed fixing: it was the one screen in the product
  // hard-coded to a light palette, so a reader on a dark system met a failure
  // with a full-brightness white flash. The palette is duplicated rather than
  // imported for the same reason it is inline: at this point nothing else has
  // loaded, and a stylesheet that fails is how you get here in the first place.
  const css = `
    :root { color-scheme: light; --bg:#F5F3EF; --fg:#10192B; --muted:#3A4661;
            --btn:#10192B; --btn-fg:#FFFFFF; }
    @media (prefers-color-scheme: dark) {
      :root { color-scheme: dark; --bg:#0B111C; --fg:#F1F4F9; --muted:#B9C2D0;
              --btn:#F1F4F9; --btn-fg:#0B111C; }
    }
    body { min-height:100dvh; display:flex; flex-direction:column;
           align-items:center; justify-content:center; margin:0;
           background:var(--bg); color:var(--fg); text-align:center;
           padding:0 20px; font-family:ui-sans-serif, system-ui, sans-serif; }
    h1 { font-size:1.5rem; font-weight:600; margin:0; }
    p  { margin-top:8px; max-width:360px; color:var(--muted); }
    button { margin-top:24px; height:44px; padding:0 20px; border-radius:12px;
             background:var(--btn); color:var(--btn-fg); border:none;
             cursor:pointer; font:inherit; }
  `;
  return (
    <html lang="en">
      <body>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <h1>Something went wrong</h1>
        <p>Please reload the page. If it keeps happening, sign in again.</p>
        <button onClick={() => reset()}>Reload</button>
      </body>
    </html>
  );
}

"use client";

// Catches errors in the root layout itself. Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F3EF",
          color: "#10192B",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          textAlign: "center",
          padding: "0 20px",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ marginTop: 8, color: "#3A4661", maxWidth: 360 }}>
          Please reload the page. If it keeps happening, sign in again.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: 24,
            height: 44,
            padding: "0 20px",
            borderRadius: 12,
            background: "#10192B",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}

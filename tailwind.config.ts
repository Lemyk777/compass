import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep base + text
        ink: {
          DEFAULT: "#10192B",
          soft: "#3A4661",
          faint: "#525D73",
        },
        // Neutral page surface — matches the landing page background so the app
        // reads as one continuous product from marketing through the dashboard.
        surface: "#F7F8FA",
        card: "#FFFFFF",
        line: "#E6E2DA",
        // The single accent — reserved for the user's own scores/highlights.
        //
        // Same three roles as the tiers below, and the same trap: DEFAULT is
        // 4.55:1 on `card` — a pass by four hundredths — and **4.28:1 on
        // `surface`, which is a fail**. So `text-accent` is safe on white and
        // not safe on the page background, which is not a distinction anyone
        // will hold in their head while writing a component. `ink` is 7.35 and
        // 6.92 on the two, and is what coloured TEXT should use; keep DEFAULT
        // for fills and for icons, which only owe 3:1.
        accent: {
          DEFAULT: "#2F6FED",
          soft: "#E4ECFD",
          ink: "#1B4FB8",
        },
        // Landing redesign: single flat emerald/ivy accent (no gradients).
        ivy: {
          DEFAULT: "#0E7B57",
          ink: "#0A5C41",
          soft: "#E7F2EC",
        },
        // Semantic tier scale — used identically everywhere (gauges, chips, bars).
        //
        // Each tier has THREE roles and they are not interchangeable:
        //   DEFAULT — a FILL. A gauge arc, a bar, a dot. Graphics need 3:1.
        //   soft    — a tinted background behind text.
        //   ink     — TEXT. Nothing else. Needs 4.5:1 on white AND on `soft`.
        //
        // `ink` is new and the omission was a real accessibility failure, not a
        // stylistic gap: with no ink to reach for, every component that needed
        // coloured text wrote `text-reach` and got the FILL — 3.40:1 on white
        // and 2.85:1 on its own chip, both under AA. That included every
        // `role="alert"` error message in the product, which is the last text
        // that should be hard to read. `text-target` was worse at 2.76:1, under
        // even the 3:1 bar for graphics, so the trophy glyph failed too.
        //
        // The values are NOT new. They are the ones `TIER_META[tier].text` in
        // lib/tiers.ts has been carrying all along — the file already knew the
        // fills were unreadable as text. Six components had independently
        // hand-copied that hex inline (`text-[#2C6B4D]`, `text-[#8A5410]`),
        // which is the "raw hex in a component" smell pointing straight at a
        // missing token. Duplicated here rather than imported because a Tailwind
        // config cannot pull in lib/ai/schema's types; scripts/test-engine.ts
        // pins the two lists together, the same arrangement as
        // legacy-guide-urls.ts and next.config.mjs.
        reach: { DEFAULT: "#E0664F", soft: "#FBE7E2", ink: "#A93B2A" },
        target: { DEFAULT: "#D98A2B", soft: "#FaEEDB", ink: "#8A5410" },
        likely: { DEFAULT: "#3F9B6E", soft: "#E1F1E9", ink: "#2C6B4D" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,25,43,0.04), 0 8px 24px -12px rgba(16,25,43,0.12)",
        lift: "0 4px 12px rgba(16,25,43,0.06), 0 24px 48px -20px rgba(16,25,43,0.22)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "spotlight": {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.5)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "meteor": {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": { transform: "rotate(215deg) translateX(-500px)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "shimmer": "shimmer 2s linear infinite",
        "spotlight": "spotlight 2s ease .75s 1 forwards",
        "meteor": "meteor 5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

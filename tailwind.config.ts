import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Every colour is a CSS variable now, and none of them live here.
      //
      // app/globals.css holds the values, in channel-triplet form, for light and
      // dark. `rgb(var(--x) / <alpha-value>)` is the only shape that keeps
      // Tailwind's opacity modifiers working — `bg-accent-soft/25`,
      // `text-ink/60`, `border-ivy/20` and 253 others — so the triplet form is
      // required, not a preference. The whole product themes from that one
      // block; there is no `dark:` variant anywhere, because a token that means
      // "the page background" should simply BE the page background.
      //
      // What was here before was a second copy of the palette, and the two had
      // already drifted apart in four places. Now the config names roles and
      // globals.css gives them values.
      colors: {
        // Deep base + text
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        // Neutral page surface — matches the landing page background so the app
        // reads as one continuous product from marketing through the dashboard.
        surface: "rgb(var(--surface) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
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
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
          ink: "rgb(var(--accent-ink) / <alpha-value>)",
        },
        // Landing redesign: single flat emerald/ivy accent (no gradients).
        ivy: {
          DEFAULT: "rgb(var(--ivy) / <alpha-value>)",
          ink: "rgb(var(--ivy-ink) / <alpha-value>)",
          soft: "rgb(var(--ivy-soft) / <alpha-value>)",
        },
        // The hero headline's deeper, more muted accent. It lived only as a CSS
        // variable and only `.roll-word` used it; naming it here means the one
        // place that wants it can stop reaching past the design system for it.
        hero: { ink: "rgb(var(--hero-ink) / <alpha-value>)" },
        // Text on a saturated fill — see the note in globals.css.
        "on-fill": "rgb(var(--on-fill) / <alpha-value>)",
        // A full-bleed inverted band and the text on it. Dark in BOTH themes —
        // see the note in globals.css for why inversion cannot just be `ink`.
        band: {
          DEFAULT: "rgb(var(--band) / <alpha-value>)",
          ink: "rgb(var(--band-ink) / <alpha-value>)",
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
        // The light values are the ones `TIER_META[tier].text` in lib/tiers.ts
        // has been carrying all along — the file already knew the fills were
        // unreadable as text. Six components had independently hand-copied that
        // hex inline (`text-[#2C6B4D]`, `text-[#8A5410]`), which is the "raw hex
        // in a component" smell pointing straight at a missing token. They live
        // in globals.css now, in both themes, and scripts/test-engine.ts reads
        // them from there to assert the ratios in light AND dark.
        reach: {
          DEFAULT: "rgb(var(--reach) / <alpha-value>)",
          soft: "rgb(var(--reach-soft) / <alpha-value>)",
          ink: "rgb(var(--reach-ink) / <alpha-value>)",
        },
        target: {
          DEFAULT: "rgb(var(--target) / <alpha-value>)",
          soft: "rgb(var(--target-soft) / <alpha-value>)",
          ink: "rgb(var(--target-ink) / <alpha-value>)",
        },
        likely: {
          DEFAULT: "rgb(var(--likely) / <alpha-value>)",
          soft: "rgb(var(--likely-soft) / <alpha-value>)",
          ink: "rgb(var(--likely-ink) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      // Shadows are themed too, and they have to be: a near-black shadow at 4%
      // opacity is what lifts a white card off an off-white page, and it is
      // completely invisible under a dark card on a darker page. The dark
      // values are pure black at several times the opacity — in dark mode a
      // shadow reads as depth only when it is genuinely darker than the surface
      // it falls on, which "the same navy, slightly transparent" never is.
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        spotlight: {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.5)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: "0",
          },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 2s linear infinite",
        spotlight: "spotlight 2s ease .75s 1 forwards",
        meteor: "meteor 5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

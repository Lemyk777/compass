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
          faint: "#6B7488",
        },
        // Warm neutral surfaces
        surface: "#F5F3EF",
        card: "#FFFFFF",
        line: "#E6E2DA",
        // The single accent — reserved for the user's own scores/highlights
        accent: {
          DEFAULT: "#2F6FED",
          soft: "#E4ECFD",
          ink: "#1B4FB8",
        },
        // Semantic tier scale — used identically everywhere (gauges, chips, bars)
        reach: { DEFAULT: "#E0664F", soft: "#FBE7E2" },
        target: { DEFAULT: "#D98A2B", soft: "#FaEEDB" },
        likely: { DEFAULT: "#3F9B6E", soft: "#E1F1E9" },
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

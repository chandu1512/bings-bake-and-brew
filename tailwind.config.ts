import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  // Hover styles only where a real pointer can hover, so taps never stick.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        // Token names are kept from the first build; the values are the Heritage gold palette.
        porcelain: { DEFAULT: "#F4EADB", deep: "#EADCC6", light: "#FBF5EA" },
        ink: { DEFAULT: "#1A100C", soft: "#4A3A32", faint: "#6B5A50" },
        cherry: { DEFAULT: "#7A1F2B", deep: "#5E1721", light: "#96303D" },
        burgundy: "#7A1F2B",
        espresso: { DEFAULT: "#1A100C", soft: "#2A1B15" },
        butter: { DEFAULT: "#C9A15A", deep: "#A9803C" },
        gold: { DEFAULT: "#C9A15A", light: "#ECD59C", deep: "#9C7636" },
        leaf: "#1B7447",
      },
      fontFamily: {
        display: ["var(--font-marcellus)", "Georgia", "serif"],
        light: ["var(--font-open-sans)", "system-ui", "sans-serif"],
        sans: ["'Jost Variable'", "Jost", "system-ui", "sans-serif"],
        script: ["Yellowtail", "'Snell Roundhand'", "cursive"],
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.9) inset, 0 18px 40px -24px rgba(29,20,17,0.35), 0 2px 6px -3px rgba(29,20,17,0.18)",
        lift: "0 1px 0 rgba(255,255,255,0.9) inset, 0 30px 60px -28px rgba(29,20,17,0.45), 0 4px 10px -4px rgba(29,20,17,0.2)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0a0a0a",
        surface: "#111111",
        node: "#1a1a1a",
        border: "#2a2a2a",
        accent: "#7c3aed",
        muted: "#a0a0a0",
      },
      animation: {
        "pulse-glow": "pulseGlow 1.5s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%,100%": { boxShadow: "0 0 0px #7c3aed" },
          "50%": { boxShadow: "0 0 20px #7c3aed99" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

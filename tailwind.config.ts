import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        bone: "#D4CFC4",
        ember: "#C9A84C",
        blood: "#7A2020",
        ash: "#1A1A1A",
        smoke: "#777770",
        deep: "#0A0A0A",
      },
      fontFamily: {
        display: ["var(--font-bodoni)", "serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
        body: ["var(--font-eb-garamond)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;

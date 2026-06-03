import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          black: "#0a0a0f",
          card: "#12121a",
          border: "#1e1e2e",
          neon: "#00d4ff",
          purple: "#a855f7",
          glow: "#6366f1",
        },
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 212, 255, 0.3)",
        purple: "0 0 20px rgba(168, 85, 247, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;

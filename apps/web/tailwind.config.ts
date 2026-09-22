import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1220",
          soft: "#121B2E",
          border: "#1E293F",
        },
        teal: {
          DEFAULT: "#0E7C7B",
          dark: "#0A5F5E",
          light: "#14A5A3",
        },
        coral: {
          DEFAULT: "#FF5C4D",
          dark: "#E14536",
        },
        gold: {
          DEFAULT: "#F2B705",
        },
        sand: "#F5EFE6",
        paper: "#FBFAF7",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;

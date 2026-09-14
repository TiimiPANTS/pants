import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        wine: {
          DEFAULT: "#8B1E3F",
          hover: "#731834",
          dark: "#5D1127",
          light: "#A3284D",
          subtle: "rgba(139, 30, 63, 0.2)",
        },
        "dark-bg": "#121316",
        "card-bg": "#18191E",
        "card-border": "#272832",
        "surface-input": "#1f2027",
      },
      fontFamily: {
        headline: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

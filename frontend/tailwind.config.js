/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Bright youth greens */
        burnt: {
          50: "#f3fdf5",
          100: "#e3fbe8",
          200: "#c3f5cd",
          300: "#8eeb9f",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        /* Electric sky / cyan blues */
        primary: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        accent: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        empowa: {
          gold: "#4ade80",
          orange: "#22d3ee",
          amber: "#fbbf24",
          red: "#38bdf8",
          cream: "#e3fbe8",
          gray: "#4c4f56",
        },
        surface: { DEFAULT: "#050505", deep: "#000000", darker: "#000000" },
      },
      backgroundImage: {
        "page-gradient": "linear-gradient(145deg, #000000 0%, #052e16 40%, #083344 100%)",
        "empowa-gradient": "linear-gradient(135deg, #4ade80 0%, #22c55e 30%, #22d3ee 65%, #38bdf8 100%)",
        "glossy-gradient": "linear-gradient(135deg, #86efac 0%, #22c55e 28%, #06b6d4 62%, #38bdf8 88%, #fbbf24 100%)",
        "brand-gradient": "linear-gradient(90deg, #4ade80 0%, #22d3ee 55%, #38bdf8 100%)",
        "youth-gradient": "linear-gradient(120deg, #4ade80 0%, #22d3ee 45%, #fbbf24 100%)",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Manrope", "system-ui", "sans-serif"],
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        floaty: "floaty 4s ease-in-out infinite",
        shimmer: "shimmer 6s ease infinite",
      },
    },
  },
  plugins: [],
};

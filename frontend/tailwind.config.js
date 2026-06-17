/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* Glossy blue — `burnt-*` classes map here for minimal churn */
        burnt: {
          50: "#eff8ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        primary: {
          50: "#eff8ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        accent: {
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
        empowa: {
          gold: "#38bdf8",
          orange: "#0ea5e9",
          amber: "#7dd3fc",
          red: "#2563eb",
          cream: "#dbeafe",
          gray: "#4c4f56",
        },
        surface: { DEFAULT: "#0a0a0a", deep: "#000000", darker: "#000000" },
      },
      backgroundImage: {
        "page-gradient": "linear-gradient(145deg, #000000 0%, #030712 50%, #0a1628 100%)",
        "empowa-gradient": "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 42%, #2563eb 100%)",
        "glossy-gradient": "linear-gradient(135deg, #7dd3fc 0%, #0ea5e9 45%, #1d4ed8 100%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

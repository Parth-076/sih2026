/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef2f8",
          100: "#d4dfee",
          200: "#a9bfdd",
          300: "#7e9fcc",
          400: "#537fbb",
          500: "#33619e",
          600: "#284c7d",
          700: "#1e3a63",
          800: "#152848",
          900: "#0c1729",
        },
        teal: {
          50: "#e9f7f6",
          100: "#c8ebe8",
          200: "#a1ddd8",
          300: "#79cec7",
          400: "#52c0b6",
          500: "#2ea89d",
          600: "#23847b",
          700: "#1a635c",
          800: "#12433d",
          900: "#0a2621",
        },
        success: "#1e8e5a",
        warning: "#c8790a",
        critical: "#c22a2a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

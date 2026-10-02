/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4fd',
          100: '#e0ebfa',
          500: '#1d4ed8',
          600: '#1e40af',
          700: '#1d3587',
          800: '#172554',
          900: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}

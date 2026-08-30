/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        breakfast: "#95dbe5",
        lunch: "#e38a8a",
        dinner: "#6e6bcd",
      },
      fontFamily: {
        sans: ["'Noto Sans KR'", "sans-serif"],
      },
    },
  },
  plugins: [],
}

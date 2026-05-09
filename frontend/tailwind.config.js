/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "cafe-dark": "#0D1F23",
        "cafe-deep": "#132E35",
        "cafe-mid": "#2D4A53",
        "cafe-teal": "#69818D",
        "cafe-light": "#AFB3B7",
        "cafe-gray": "#5A636A",
      },
    },
  },
  plugins: [],
};

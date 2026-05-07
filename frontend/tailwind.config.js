/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cafe: {
          dark: "#0D1F23",
          primary: "#132E35",
          muted: "#2D4A53",
          cool: "#69818D",
          accent: "#AFB3B7",
          gray: "#5A636A",
        },
      },
    },
  },
  plugins: [],
};

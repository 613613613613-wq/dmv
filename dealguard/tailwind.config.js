/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07090d",
          900: "#0d1117",
          800: "#161b24",
          700: "#222a37",
          600: "#2f3a4b",
          400: "#6b7688",
          300: "#98a2b5",
          100: "#e6e9ef",
        },
        flag: "#ff3b4a",
        fact: "#f5c451",
        calm: "#5ad39c",
        link: "#6fb1ff",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d4d8e0",
          300: "#a9b1bf",
          400: "#7d8597",
          500: "#566075",
          600: "#3e475a",
          700: "#2c3344",
          800: "#1c2231",
          900: "#10141d",
        },
        sun: {
          50: "#fff7e6",
          100: "#ffe9b8",
          200: "#ffd47a",
          300: "#ffba3a",
          400: "#f5a000",
          500: "#d68500",
        },
        gulf: {
          50: "#e8f5f7",
          100: "#c6e6eb",
          200: "#8ecdd6",
          300: "#52b1be",
          400: "#1f93a3",
          500: "#0a7785",
          600: "#055a66",
        },
        coral: {
          400: "#ff7a59",
          500: "#f25c3b",
          600: "#cc4624",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,20,29,.06), 0 8px 24px -8px rgba(16,20,29,.12)",
      },
    },
  },
  plugins: [],
};

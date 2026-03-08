/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#6366f1", 50: "#eef2ff", 100: "#e0e7ff", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca" },
        dark: { DEFAULT: "#0f172a", 50: "#f8fafc", 100: "#f1f5f9", 800: "#1e293b", 900: "#0f172a" },
      },
    },
  },
  plugins: [],
};

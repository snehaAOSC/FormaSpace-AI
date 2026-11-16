/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#172B3A",
        ivory: "#F7F4ED",
        terracotta: "#C87960",
        sage: "#9BAE9A",
        sand: "#DCCBB5",
        charcoal: "#252B2E",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        editorial: "0 20px 50px -15px rgba(23, 43, 58, 0.08)",
        card: "0 8px 30px -8px rgba(23, 43, 58, 0.06)",
      },
    },
  },
  plugins: [],
};


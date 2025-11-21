// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f4f3fb",
        foreground: "#1c1c5e",
        primary: "#1e40af",
        accent: "#6d28d9",
        "chart-2": "#facc15",
        "chart-4": "#16a34a",
        card: "#ffffff",
        "card-border": "#e5e7eb",
      },
      keyframes: {
        float: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
          "100%": { transform: "translateY(0px)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

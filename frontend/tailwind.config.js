/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#e7f3ff",
          100: "#d4e8ff",
          500: "#2874f0",
          600: "#1e5bbf",
          700: "#1a4da3",
        },
        // Custom colors for ServicePlans
        "text-primary": "#41434C",
        "text-body": "#5c5c5c",
        "text-secondary": "#666666",
        divider: "#e0e0e0",
        "icon-bg": "#EEF4FF",
        "tag-bg": "#f5f5f5",
        "badge-border": "#CCCCCC",
        "badge-custom": "#2E7D32",
        "fab-blue": "#5C9FFF",
        "btn-primary": "#2f31be",
        "warning-bg": "#FFF9E6",
        "warning-border": "#FFD666",
        "warning-text": "#8B6914",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.12)",
        fab: "0 4px 12px rgba(92, 159, 255, 0.4)",
      },
      spacing: {
        7.5: "30px",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        app: "var(--bg-app)",
        card: "var(--bg-card)",
        "card-soft": "var(--bg-card-soft)",
        "card-border": "var(--border-card)",
        "text-main": "var(--text-primary)",
        "text-muted": "var(--text-secondary)",
        "icon-muted": "var(--icon-muted)",
        chevron: "var(--chevron)",
      },
    },
  },
  plugins: [],
};

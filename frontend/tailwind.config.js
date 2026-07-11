/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["InterVariable", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "elevation-1": "0 1px 2px 0 rgba(0,0,0,0.04), 0 1px 1px 0 rgba(0,0,0,0.03)",
        "elevation-2": "0 4px 12px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04)",
        "elevation-3": "0 12px 32px -8px rgba(0,0,0,0.14), 0 4px 8px -4px rgba(0,0,0,0.06)",
        "glow-accent": "0 0 0 1px rgba(var(--accent-rgb), 0.15), 0 8px 24px -6px rgba(var(--accent-rgb), 0.35)",
      },
      backgroundImage: {
        "radial-fade": "radial-gradient(circle at 50% 0%, rgba(var(--accent-rgb), 0.10), transparent 60%)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        "float-slow": { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: {
        shimmer: "shimmer 1.5s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
      },
      colors: {
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        "ink-faint": "var(--ink-faint)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        online: "var(--online)",
      },
    },
  },
  plugins: [],
};

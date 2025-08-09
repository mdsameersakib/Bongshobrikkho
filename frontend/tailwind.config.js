/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic placeholder colors; actual accent applied via CSS variables
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)'
        },
        surface: {
          50: 'var(--surface-50)',
          100: 'var(--surface-100)',
          200: 'var(--surface-200)',
          800: 'var(--surface-800)',
          900: 'var(--surface-900)'
        }
      },
      boxShadow: {
        soft: '0 4px 12px -2px rgba(0 0 0 / 0.08)',
        card: '0 2px 8px -1px rgba(0 0 0 / 0.1)',
        pop: '0 8px 24px -4px rgba(0 0 0 / 0.15)'
      }
    },
  },
  plugins: [],
}
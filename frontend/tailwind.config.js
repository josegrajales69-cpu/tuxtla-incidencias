/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f17',
        panelBg: 'rgba(15, 23, 42, 0.90)',
      }
    },
  },
  plugins: [],
}

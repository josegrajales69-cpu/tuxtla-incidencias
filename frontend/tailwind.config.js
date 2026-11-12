
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#fafafa', 100: '#f4f5f5', 200: '#e5e7e8', 300: '#c5cace',
          400: '#9ba4aa', 500: '#77838b', 600: '#566169', 700: '#39434a',
          800: '#293238', 900: '#1c2429', 950: '#11181c',
        },
        darkBg: '#0b0f17',
        panelBg: 'rgba(15, 23, 42, 0.90)',
      }
    },
  },
  plugins: [],
}

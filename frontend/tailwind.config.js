module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#c7e0ff',
          300: '#a4cdff',
          400: '#76b4ff',
          500: '#4a90e2',
          600: '#2563eb',
          700: '#1d47a5',
          800: '#1e3a8a',
          900: '#1e293b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

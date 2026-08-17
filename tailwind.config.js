/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          cyan: '#00BFFF'
        },
        risk: {
          green: '#28a745',
          yellow: '#ffc107',
          orange: '#ff5722',
          red: '#dc3545'
        }
      }
    }
  },
  plugins: []
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          50: '#FAF1F3',
          100: '#F5DEE3',
          200: '#EAB9C3',
          300: '#D9899B',
          400: '#BF556E',
          500: '#A12F49',
          600: '#8E253F',
          700: '#6B1D2F', /* Core Deep Burgundy */
          800: '#4D1321', /* Deep Wine Shade */
          900: '#320A14', /* Midnight Maroon */
        },
        gold: {
          300: '#F3D27E',
          400: '#E5B84A',
          500: '#C99726',
          600: '#A67918',
        }
      },
      fontFamily: {
        sans: ['"Helvetica"', '"Arial"', 'sans-serif'],
      },
      boxShadow: {
        'burgundy-glow': '0 8px 30px rgba(107, 29, 47, 0.18)',
        'burgundy-card': '0 20px 45px -10px rgba(77, 19, 33, 0.20), 0 0 1px 1px rgba(107, 29, 47, 0.08)',
      }
    },
  },
  plugins: [],
}

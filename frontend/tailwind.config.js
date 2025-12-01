/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        holly: {
          50: '#fff6f2',
          100: '#ffe1d5',
          200: '#ffc2ab',
          300: '#ff9271',
          400: '#ff6845',
          500: '#ef4120',
          600: '#d12b18',
          700: '#aa1f14',
          800: '#7b1712',
          900: '#4f100e',
        },
      },
      backgroundImage: {
        'login-pattern': "url('/src/assets/login-bg.png')",
        'dashboard-pattern': "url('/src/assets/dashboard-bg.png')",
      },
    },
  },
  plugins: [],
};


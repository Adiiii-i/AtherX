/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        burgundy: {
          50: '#fdf2f2',
          100: '#fbe4e4',
          200: '#f7cdcd',
          300: '#f1a9a9',
          400: '#e57777',
          500: '#d14d4d',
          600: '#b23535',
          700: '#942929',
          800: '#7a2525',
          900: '#5B0E14', // DEEP BURGUNDY
          950: '#3a080c',
        },
        sand: {
          50: '#fefdf6',
          100: '#fdfae9',
          200: '#fbf4d2',
          300: '#f7ebad',
          400: '#f1e194', // GOLDEN SAND
          500: '#e7cf6e',
          600: '#d5b64c',
          700: '#b4933a',
          800: '#947633',
          900: '#7a612d',
          950: '#463618',
        },
        surface: {
          50: '#fefdf6',
          100: '#f1e194', // Golden Sand
          200: '#e7cf6e',
          700: '#7a2525',
          800: '#5B0E14', // Deep Burgundy
          900: '#3a080c',
          950: '#1a0406',
        },
        accent: {
          sand: '#f1e194',
          burgundy: '#5b0e14',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.4s ease-out both',
        'slide-down': 'slideDown 0.3s ease-out both',
        'scale-in': 'scaleIn 0.3s ease-out both',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'bounce-dot': 'bounceDot 1.4s infinite ease-in-out both',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundSize: {
        '300%': '300% 300%',
      },
    },
  },
  plugins: [],
};

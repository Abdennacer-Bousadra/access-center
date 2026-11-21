/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      /* Brand palette — primary dark navy #2B2B68 */
      colors: {
        navy: {
          50: '#f2f2fa',
          100: '#e3e3f3',
          200: '#c7c7e8',
          300: '#a4a4d8',
          400: '#7b7bc5',
          500: '#5555a6',
          600: '#2b2b68',
          700: '#25255c',
          800: '#1e1e4b',
          900: '#171739',
          950: '#0c0c22',
        },
        accent: {
          50: '#f2f2fa',
          100: '#e3e3f3',
          200: '#c7c7e8',
          300: '#a4a4d8',
          400: '#7b7bc5',
          500: '#5555a6',
          600: '#2b2b68',
          700: '#25255c',
          800: '#1e1e4b',
          900: '#171739',
          950: '#0c0c22',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Tajawal',
          'Cairo',
          'system-ui',
          'Segoe UI',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(43, 43, 104, 0.04), 0 8px 24px rgba(43, 43, 104, 0.06)',
        'card-hover':
          '0 18px 44px rgba(43, 43, 104, 0.12), 0 4px 12px rgba(43, 43, 104, 0.08)',
        'hero-card': '0 24px 64px rgba(43, 43, 104, 0.12)',
      },
      keyframes: {
float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.6' },
          '70%': { transform: 'scale(1.7)', opacity: '0' },
          '100%': { transform: 'scale(1.7)', opacity: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
}
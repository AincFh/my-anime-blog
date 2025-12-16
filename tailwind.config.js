/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          '"Noto Sans SC"',
          '"Nunito"',
          'sans-serif',
        ],
        round: [
          '"Comfortaa"',
          '"Noto Sans SC"',
          'sans-serif',
        ],
        serif: [
          '"Noto Serif SC"',
          'serif',
        ],
      },
      fontSize: {
        // Fluid Typography: clamp(min, val, max)
        'xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'base': 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
        'lg': 'clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)',
        'xl': 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
        '2xl': 'clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)',
        '3xl': 'clamp(1.875rem, 1.7rem + 0.875vw, 2.25rem)',
        '4xl': 'clamp(2.25rem, 2rem + 1.25vw, 3rem)',
        '5xl': 'clamp(3rem, 2.5rem + 2.5vw, 4.5rem)',
        '6xl': 'clamp(3.75rem, 3rem + 3.75vw, 6rem)',
      },
      // Colors are defined in app.css using @theme directive (Tailwind v4)
      // colors: {
      //   primary: {
      //     start: '#FF9F43',
      //     end: '#FF6B6B',
      //   },
      // },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.7 },
          '50%': { transform: 'scale(1.1)', opacity: 0.9 },
        },
      },
      boxShadow: {
        'soft-orange': '0 10px 30px -5px rgba(255, 159, 67, 0.2)',
        'soft-pink': '0 10px 30px -5px rgba(255, 107, 107, 0.2)',
      },
    },
  },
  plugins: [],
};
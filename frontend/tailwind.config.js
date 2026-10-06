/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        acrobat: {
          black: '#000000', // Pure black as requested
          dark: '#0f172a', // Deep navy from image
          surface: '#1e293b', // Lighter navy for surface
          'surface-light': '#334155',
          'surface-lighter': '#475569',
          primary: '#8b1a1a', // Deep red from image
          'primary-light': '#a52a2a',
          text: '#ffffff', // Pure white as requested
          'text-muted': '#94a3b8',
          green: '#8b1a1a', // Overriding green with the theme red
        },
        primary: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#9e1220',
          600: '#be123c',
          700: '#9f1239',
          800: '#881337',
          900: '#4c0519',
        }
      },
      borderRadius: {
        'xl': '0.5rem',
        '2xl': '0.75rem',
        '3xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      scale: {
        '98': '0.98',
      }
    },
  },
  plugins: [],
}
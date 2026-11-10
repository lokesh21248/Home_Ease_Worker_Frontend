/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0052FF',
          soft: '#EAF1FF',
          dark: '#0040CC',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F8FAFC',
        },
        background: '#F4F7FC',
        text: {
          main: '#101B35',
          sub: '#718096',
          muted: '#94A3B8',
        },
        border: {
          DEFAULT: '#E6EBF3',
          light: '#F1F5F9',
        },
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      borderRadius: {
        card: '18px',
        md: '14px',
      },
    },
  },
  plugins: [],
};

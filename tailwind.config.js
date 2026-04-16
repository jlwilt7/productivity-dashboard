/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0D0D0D',
          elevated: '#141414',
        },
        card: {
          DEFAULT: '#1A1A1A',
          hover: '#222222',
          border: '#2A2A2A',
        },
        status: {
          green: '#22C55E',
          yellow: '#EAB308',
          red: '#EF4444',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          hover: '#A78BFA',
        },
        mute: {
          DEFAULT: '#6B7280',
          light: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4), 0 4px 14px rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
};

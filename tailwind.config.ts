import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
      colors: {
        canvas: '#F8F9FF',
        surface: '#F8F9FF',
        'surface-low': '#EFF4FF',
        'surface-container': '#E6EEFF',
        'surface-high': '#DEE9FC',
        'surface-highest': '#D9E3F6',
        ink: '#121C2A',
        'on-surface': '#121C2A',
        'on-surface-variant': '#404944',
        muted: '#6B7280',
        border: '#E2E8F0',
        nexus: {
          primary: '#003527',
          'primary-container': '#064E3B',
          'primary-fixed': '#B0F0D6',
          'on-primary': '#FFFFFF',
          'on-primary-container': '#80BEA6',
          secondary: '#99462A',
          'secondary-container': '#FE9572',
          'secondary-fixed': '#FFDBD0',
          'on-secondary': '#FFFFFF',
          tertiary: '#4A2400',
          'tertiary-container': '#6A3700',
          'surface-tint': '#2B6954',
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
          800: '#312E81',
          900: '#1E1B4B',
        },
        accent: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
        },
      },
      boxShadow: {
        soft: '0 12px 30px rgba(17, 24, 39, 0.06)',
        glow: '0 0 30px rgba(79, 70, 229, 0.15)',
        'glow-lg': '0 0 60px rgba(79, 70, 229, 0.2)',
        elevated: '0 20px 60px rgba(17, 24, 39, 0.1)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.7s ease-out both',
        'fade-in': 'fadeIn 0.5s ease-out both',
        'scale-in': 'scaleIn 0.6s ease-out both',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

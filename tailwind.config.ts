import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F8F9FA',
        surface: '#FFFFFF',
        ink: '#1A1A1A',
        muted: '#6B7280',
        border: '#E5E7EB',
        brand: {
          50: '#EEF2FF',
          100: '#E2E8F0',
          500: '#1F2A37',
          600: '#182332',
          700: '#111827',
        },
      },
      boxShadow: {
        soft: '0 12px 30px rgba(17, 24, 39, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;

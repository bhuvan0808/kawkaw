import type { Config } from 'tailwindcss';

/**
 * Kaw Kaw admin theme. Brand is the same warm amber used across the customer /
 * rider apps, on a slate-grey console surface tuned for dense data tables.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F59E0B',
          50: '#FFF8EB',
          100: '#FEefC7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        ink: {
          DEFAULT: '#0F172A',
          soft: '#1E293B',
          muted: '#64748B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8FAFC',
          border: '#E2E8F0',
        },
        status: {
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
          info: '#2563EB',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

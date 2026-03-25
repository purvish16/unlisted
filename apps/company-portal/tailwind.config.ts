import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ── Design System Colors (from DESIGN.md) ──────────────────────────────
      colors: {
        // Brand primary — Institutional Blue
        primary: {
          DEFAULT: '#005bbf',
          container: '#1a73e8',
          fixed: '#d8e2ff',
          'fixed-dim': '#adc7ff',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#ffffff',
        'on-primary-fixed': '#001a41',
        'on-primary-fixed-variant': '#004493',
        'inverse-primary': '#adc7ff',

        // Secondary — Success Green (gains, positive P&L)
        secondary: {
          DEFAULT: '#006d31',
          container: '#92f9a5',
          fixed: '#92f9a5',
          'fixed-dim': '#76dc8b',
        },
        'on-secondary': '#ffffff',
        'on-secondary-container': '#007434',
        'on-secondary-fixed': '#00210a',
        'on-secondary-fixed-variant': '#005323',

        // Tertiary — Amber (warnings, limited supply)
        tertiary: {
          DEFAULT: '#835100',
          container: '#a56700',
          fixed: '#ffddb9',
          'fixed-dim': '#ffb962',
        },
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#fffbff',
        'on-tertiary-fixed': '#2b1700',
        'on-tertiary-fixed-variant': '#663e00',

        // Surface Hierarchy — Tonal Layering (no borders, use bg shifts)
        surface: {
          DEFAULT: '#f8f9fa',   // Base canvas
          dim: '#d9dadb',
          bright: '#f8f9fa',
          variant: '#e1e3e4',
          tint: '#005bc0',
          container: {
            DEFAULT: '#edeeef',
            low: '#f3f4f5',     // Large structural blocks
            lowest: '#ffffff',  // Interactive cards (lifted)
            high: '#e7e8e9',   // Sunken elements (search bars)
            highest: '#e1e3e4',
          },
        },
        background: '#f8f9fa',
        'on-background': '#191c1d',
        'on-surface': '#191c1d',    // Primary text — never use #000000
        'on-surface-variant': '#414754', // Secondary text / labels

        // Error — Red (losses, errors)
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        // Borders & Outlines
        outline: {
          DEFAULT: '#727785',   // Tertiary text, icons
          variant: '#c1c6d6',  // Ghost borders (use at low opacity)
        },

        // Inverse
        'inverse-surface': '#2e3132',
        'inverse-on-surface': '#f0f1f2',
        'surface-tint': '#005bc0',
      },

      // ── Typography ─────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },

      // ── Border Radius ──────────────────────────────────────────────────────
      borderRadius: {
        none: '0',
        sm: '0.25rem',     // 4px
        DEFAULT: '0.25rem',
        md: '0.375rem',    // 6px
        lg: '0.5rem',      // 8px — buttons
        xl: '0.75rem',     // 12px — cards
        '2xl': '1rem',     // 16px — modals
        full: '9999px',
      },

      // ── Box Shadows ────────────────────────────────────────────────────────
      boxShadow: {
        // Ambient — for cards (on-surface tinted, not pure black)
        ambient: '0 4px 20px rgba(25, 28, 29, 0.04)',
        // Floating — for modals, dropdowns
        floating: '0 12px 40px rgba(25, 28, 29, 0.08)',
        // None — flat elements use tonal layering, not shadow
        none: 'none',
      },

      // ── Letter Spacing ─────────────────────────────────────────────────────
      letterSpacing: {
        institutional: '-0.02em', // For large portfolio values
        label: '0.05em',          // For metadata labels (ISIN, sector tags)
      },

      // ── Keyframes for Framer Motion compatibility ──────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

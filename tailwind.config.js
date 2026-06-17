/** @type {import('tailwindcss').Config} */
const colors = ['amber', 'violet', 'emerald', 'sky', 'rose', 'slate'];
const opacities = ['5', '10', '15', '20', '25', '30'];
const shades = ['200', '300', '400', '500', '600'];
const safelist = [];
colors.forEach((c) => {
  shades.forEach((s) => {
    safelist.push(`text-${c}-${s}`);
    safelist.push(`bg-${c}-${s}`);
    safelist.push(`border-${c}-${s}`);
  });
  opacities.forEach((o) => {
    safelist.push(`bg-${c}-500/${o}`);
    safelist.push(`text-${c}-500/${o}`);
    safelist.push(`border-${c}-500/${o}`);
  });
});

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // CRITICAL: only apply hover: styles on devices that actually support hover
  // (mouse, trackpad). On touch devices, hover styles cause the "tap twice
  // to click" bug because the first tap activates :hover, the second clicks.
  future: {
    hoverOnlyWhenSupported: true,
  },
  safelist,
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        ink: {
          950: '#06060b',
          900: '#0a0a14',
          850: '#0e0e1a',
          800: '#13131f',
          700: '#1a1a2a',
          600: '#22223a',
          500: '#2c2c48',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        emerald2: {
          400: '#34d399',
          500: '#10b981',
        },
        violet2: {
          400: '#a78bfa',
          500: '#8b5cf6',
        },
        sky2: {
          400: '#38bdf8',
          500: '#0ea5e9',
        },
        rose2: {
          400: '#fb7185',
          500: '#f43f5e',
        },
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(245,158,11,0.35)',
        'glow-violet': '0 0 60px -20px rgba(139,92,246,0.4)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

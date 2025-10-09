import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: '#FF6F61',
        beige: '#F8EDEB',
        blush: '#E6B8C2',
        nude: '#F5CBA7',
        charcoal: '#2B2B2B',
        offwhite: '#FAF9F7',
        salmon: '#FF8A80',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config

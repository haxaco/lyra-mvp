import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        foreground: "var(--color-fg)",
        card: "var(--color-bg-card)",
        "card-foreground": "var(--color-fg-card)",
        popover: "var(--color-bg-popover)",
        "popover-foreground": "var(--color-fg-popover)",
        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",
        secondary: "var(--color-secondary)",
        "secondary-foreground": "var(--color-secondary-foreground)",
        muted: "var(--color-muted)",
        "muted-foreground": "var(--color-muted-foreground)",
        accent: "var(--color-accent)",
        "accent-foreground": "var(--color-accent-foreground)",
        destructive: "var(--color-destructive)",
        "destructive-foreground": "var(--color-destructive-foreground)",
        border: "var(--color-border)",
        input: "var(--color-bg-input)",
        "input-background": "var(--color-bg-input)",
        ring: "var(--color-ring)",
        
        // Keep legacy colors for backward compatibility
        coral: '#FF6F61',
        beige: '#F8EDEB',
        blush: '#E6B8C2',
        nude: '#F5CBA7',
        charcoal: '#2B2B2B',
        offwhite: '#FAF9F7',
        salmon: '#FF8A80',
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        heading: ["var(--font-heading)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
    },
  },
  plugins: [],
} satisfies Config

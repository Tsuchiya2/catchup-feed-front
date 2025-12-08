import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        glow: {
          primary: 'hsl(var(--glow-primary))',
          secondary: 'hsl(var(--glow-secondary))',
        },
        cyber: {
          blue: '#00d4ff',
          'blue-dark': '#0099cc',
          'blue-light': '#66e5ff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        glow: '0 0 15px hsl(var(--glow-primary) / 0.4), 0 0 30px hsl(var(--glow-primary) / 0.2)',
        'glow-sm': '0 0 10px hsl(var(--glow-primary) / 0.3), 0 0 20px hsl(var(--glow-primary) / 0.1)',
        'glow-lg': '0 0 20px hsl(var(--glow-primary) / 0.5), 0 0 40px hsl(var(--glow-primary) / 0.3)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 10px hsl(var(--glow-primary) / 0.3), 0 0 20px hsl(var(--glow-primary) / 0.1)',
          },
          '50%': {
            boxShadow: '0 0 20px hsl(var(--glow-primary) / 0.5), 0 0 40px hsl(var(--glow-primary) / 0.3)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, hsl(220 50% 4%) 0%, hsl(220 45% 8%) 50%, hsl(220 50% 4%) 100%)',
        'cyber-radial': 'radial-gradient(ellipse at center, hsl(220 45% 10%) 0%, hsl(220 50% 4%) 70%)',
        'glow-gradient': 'linear-gradient(90deg, transparent, hsl(var(--glow-primary) / 0.3), transparent)',
      },
    },
  },
  plugins: [],
};

export default config;

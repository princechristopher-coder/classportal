import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        cf: {
          black: '#0a0a0b',
          charcoal: '#141416',
          charcoal2: '#1c1c1f',
          red: '#c81e3a',
          redDark: '#8f1229',
          gold: '#d4af37',
          goldLight: '#f1d67a',
          white: '#f8f7f4'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        script: ['var(--font-script)', 'cursive']
      },
      backgroundImage: {
        'cf-radial': 'radial-gradient(circle at 50% 0%, rgba(200,30,58,0.15), transparent 60%)',
        'cf-gold-line': 'linear-gradient(90deg, transparent, #d4af37, transparent)'
      },
      boxShadow: {
        glow: '0 0 40px rgba(200,30,58,0.35)',
        goldGlow: '0 0 30px rgba(212,175,55,0.35)'
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' }
        },
        glow: {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        glow: 'glow 3s ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;

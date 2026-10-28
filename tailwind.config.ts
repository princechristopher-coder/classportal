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
          black: '#070c1f',
          charcoal: 'rgba(255,255,255,0.035)',
          charcoal2: 'rgba(255,255,255,0.07)',
          red: '#ff8f7a',
          redDark: '#e2607a',
          gold: '#5ce1e6',
          goldLight: '#8f7bff',
          violet: '#8f7bff',
          white: '#eaf1ff'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
        script: ['var(--font-script)', 'cursive']
      },
      backgroundImage: {
        'cf-radial': 'radial-gradient(circle at 50% 0%, rgba(92,225,230,0.16), transparent 60%)',
        'cf-gold-line': 'linear-gradient(90deg, transparent, #5ce1e6, transparent)'
      },
      boxShadow: {
        glow: '0 0 40px rgba(255,143,122,0.35)',
        goldGlow: '0 12px 32px -8px rgba(92,225,230,0.6)'
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

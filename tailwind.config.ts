/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-clash)', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0f0ff',
          100: '#e0e0ff',
          200: '#c4c4ff',
          300: '#a3a3ff',
          400: '#7c7cff',
          500: '#5c5cff',
          600: '#4040ff',
          700: '#2e2ece',
          800: '#2020a0',
          900: '#141478',
          950: '#0a0a50',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #5c5cff 0%, #a855f7 50%, #ec4899 100%)',
        'gradient-dark':  'linear-gradient(135deg, #0a0a1a 0%, #0f0f2e 50%, #0a0a1a 100%)',
        'mesh-1': `radial-gradient(at 40% 20%, hsla(240,100%,74%,0.15) 0px, transparent 50%),
                   radial-gradient(at 80% 0%,  hsla(270,100%,76%,0.12) 0px, transparent 50%),
                   radial-gradient(at 0%  50%,  hsla(330,100%,72%,0.10) 0px, transparent 50%)`,
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'glow':        'glow 3s ease-in-out infinite',
        'slide-up':    'slideUp 0.4s ease-out',
        'fade-in':     'fadeIn 0.3s ease-out',
        'pulse-slow':  'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        float:   { '0%,100%': {transform:'translateY(0)'}, '50%': {transform:'translateY(-8px)'} },
        glow:    { '0%,100%': {opacity:'0.6'}, '50%': {opacity:'1'} },
        slideUp: { from: {opacity:'0', transform:'translateY(16px)'}, to: {opacity:'1', transform:'translateY(0)'} },
        fadeIn:  { from: {opacity:'0'}, to: {opacity:'1'} },
      },
      boxShadow: {
        'brand':  '0 0 40px rgba(92,92,255,0.3)',
        'card':   '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glow-sm':'0 0 12px rgba(92,92,255,0.5)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
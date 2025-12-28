/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sophisticated Dark Palette
        background: {
          DEFAULT: '#0A0A0F',
          elevated: '#12121A',
          surface: '#1A1A24',
          hover: '#22222E',
        },
        
        // Fibonacci-Inspired Brand Colors
        primary: {
          50: '#FFF7E6',
          100: '#FFE9B8',
          200: '#FFD88A',
          300: '#FFC75C',
          400: '#FFB62E',
          500: '#FFA500', // Golden Orange
          600: '#E69400',
          700: '#CC8300',
          800: '#B37200',
          900: '#996100',
        },
        
        accent: {
          cyan: '#00D4FF',
          purple: '#A78BFA',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#FB7185',
        },
        
        // Semantic Colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      
      fontSize: {
        'display-2xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      
      boxShadow: {
        'glow-sm': '0 0 20px rgba(255, 165, 0, 0.15)',
        'glow-md': '0 0 40px rgba(255, 165, 0, 0.2)',
        'glow-lg': '0 0 60px rgba(255, 165, 0, 0.25)',
        'inner-glow': 'inset 0 0 20px rgba(255, 165, 0, 0.1)',
        'elevation-1': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'elevation-2': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'elevation-3': '0 8px 32px rgba(0, 0, 0, 0.6)',
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(28,100%,74%,0.3) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.3) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,100%,93%,0.3) 0px, transparent 50%)',
      },
      
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient': 'gradient 8s linear infinite',
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 20px rgba(255, 165, 0, 0.5)' },
          'to': { boxShadow: '0 0 40px rgba(255, 165, 0, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
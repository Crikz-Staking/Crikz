/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Dark Theme Palette
        background: '#050505', // Almost black, deeper than pure black
        surface: '#0F0F0F',    // Slightly lighter for cards
        surfaceHighlight: '#1A1A1A',
        
        // Brand Colors (Sophisticated Gold & Emerald)
        primary: {
          DEFAULT: '#FFD700',
          dim: 'rgba(255, 215, 0, 0.1)',
          glow: 'rgba(255, 215, 0, 0.5)',
        },
        accent: {
          DEFAULT: '#10B981', // Emerald
          glow: 'rgba(16, 185, 129, 0.4)',
        }
      },
      fontFamily: {
        // 'Inter' is the industry standard for clean UI. Ensure it's imported or available.
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'], // Tech feel
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(255, 215, 0, 0.1)',
        'glow-md': '0 0 20px rgba(255, 215, 0, 0.15)',
        'glow-lg': '0 0 40px rgba(255, 215, 0, 0.2)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'premium-gradient': 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)', // Gold gradient
      }
    },
  },
  plugins: [],
}
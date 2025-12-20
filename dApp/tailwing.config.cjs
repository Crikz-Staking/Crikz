/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Crikz brand colors
        crikzGold: '#FFD700',
        crikzAccent: '#00ff88',
        crikzDark: '#050505',
        crikzGray: '#1a1a1a',
      },
      fontFamily: {
        mono: ['"SF Mono"', '"Roboto Mono"', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 4s infinite',
        'float': 'float 6s infinite ease-in-out',
        'block-fade': 'blockFade 8s infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 255, 136, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 255, 136, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        blockFade: {
          '0%': { opacity: '0', transform: 'translateY(-30%) rotate(45deg)' },
          '20%': { opacity: '0.5', transform: 'translateY(-50%) rotate(45deg)' },
          '80%': { opacity: '0.5', transform: 'translateY(-50%) rotate(45deg)' },
          '100%': { opacity: '0', transform: 'translateY(-70%) rotate(45deg)' },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        crikz: {
          ...require("daisyui/src/theming/themes")["dark"],
          "primary": "#FFD700",
          "secondary": "#00ff88",
          "accent": "#00d4ff",
          "base-100": "#000000",
          "base-200": "#111111",
          "base-300": "#1a1a1a",
          "neutral": "#333333",
          "info": "#00d4ff",
          "success": "#00ff88",
          "warning": "#ffaa00",
          "error": "#ff3333",
        },
      },
    ],
  },
}
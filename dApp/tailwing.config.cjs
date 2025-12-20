/** @type {import('tailwindcss').Config} */
module.exports = {
  // CRITICAL: Ensure the content path is correct for your files
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Check for a missing file extension like 'js'
  ],
  theme: {
    extend: {
      colors: {
        albanianRed: "#DA291C", 
        albanianGold: "#FFD700", 
      },
    },
  },
  // CRITICAL: The plugin must be required correctly
  plugins: [require("daisyui")],
  
  // DaisyUI specific config
  daisyui: {
    themes: [
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          "primary": "#FFD700",
          "secondary": "#DA291C",
          "accent": "#FFD700",
          "base-100": "#000000",
          "base-200": "#111111",
          "base-300": "#1a1a1a",
        },
      },
    ],
  },
}
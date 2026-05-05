import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        manila:      "#d4c69d",
        "manila-warm": "#c9b682",
        "manila-dark": "#9a8a5e",
        ink:         "#14110d",
        "ink-soft":  "#2a221a",
        purple: {
          DEFAULT: "#4a2d75",
          stamp:   "#5b3c8c",
          glow:    "#8b5cf6",
        },
        salmon:      "#b8523a",
        "salmon-pale":"#c9624a",
        mustard:     "#c9a02d",
        "mustard-dark":"#8a6810",
        bg:          "#0e0c0a",
      },
      fontFamily: {
        mono: ["Special Elite", "Courier New", "monospace"],
        display: ["Bebas Neue", "Impact", "sans-serif"],
        serif: ["Cormorant Garamond", "serif"],
        crt: ["VT323", "monospace"],
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
};
export default config;

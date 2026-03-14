import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#f8f5f0",
          dark: "#f0ebe3",
        },
        wavelength: {
          accent: "#ff2d6b",
          "accent-light": "#ff5a8a",
          "blob-blush": "#ff5aa5",
          "blob-peach": "#ffb36b",
          "blob-mauve": "#8b6cff",
          "blob-amber": "#ffd24a",
          "text": "#241515",
          "text-muted": "#7a5b55",
        },
      },
    },
  },
  plugins: [],
};

export default config;

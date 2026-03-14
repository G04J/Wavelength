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
          DEFAULT: "#faf8f5",
          dark: "#f5f0e8",
        },
        wavelength: {
          red: "#e07a5f",
          orange: "#f2a07b",
          peach: "#f4d1ae",
          lavender: "#b8a9c9",
        },
      },
    },
  },
  plugins: [],
};

export default config;

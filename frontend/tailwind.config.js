import { base } from 'daisyui/imports';

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"], // Include JSX and TSX files
  theme: {
    extend: {},
  },
  plugins: [],
  important: true, // Make Tailwind CSS styles important
};
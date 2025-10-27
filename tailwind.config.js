/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{components,services,types,constants,App,index}.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
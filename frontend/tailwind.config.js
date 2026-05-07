/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lamar: {
          bg: '#121212',
          primary: '#003087',
          secondary: '#1e1e1e',
          text: '#f0f0f0',
          bubbleUser: '#003087',
          bubbleAi: '#1e1e1e',
        }
      }
    },
  },
  plugins: [],
}

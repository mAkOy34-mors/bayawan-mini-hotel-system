module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#e2c476',
          dark: '#9a7a2e',
        },
        dark: {
          1: '#0e0b07',
          2: '#1a1208',
          3: '#241a0e',
        },
        cream: {
          DEFAULT: '#f8f3e8',
          2: '#f0e8d4',
        },
        text: {
          DEFAULT: '#2d2416',
          2: '#5a4a30',
          3: '#8a7a5a',
        },
      },
      fontFamily: {
        sans: ['Jost', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
    },
  },
  plugins: [],
}
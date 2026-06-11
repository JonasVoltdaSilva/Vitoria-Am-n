/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec1ff',
          400: '#599fff',
          500: '#337bff',
          600: '#1c5ef5',
          700: '#1549e1',
          800: '#173cb6',
          900: '#19388f',
        },
      },
      fontSize: {
        // Tamanhos maiores para uso hospitalar
        base: ['1.05rem', '1.6rem'],
      },
    },
  },
  plugins: [],
}

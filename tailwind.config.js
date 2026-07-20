/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Oasis-Doc design palette: deep forest, cream, charcoal, sage and neutral gray.
        oasis: {
          blue: '#1F4A37',
          'blue-dark': '#102E22',
          'blue-light': '#E5F0E6',
          green: '#2E6A4B',
          'green-dark': '#163E2D',
          'green-light': '#D9EAD9',
          bg: '#FCF9F2',
          cream: '#FCF9F2',
          charcoal: '#202521',
          sage: '#A9C9AF',
          neutral: '#89918B'
        }
      }
    }
  },
  plugins: []
}

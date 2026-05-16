import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        plum:   '#5b2750',
        gold:   '#c9a055',
        rose:   '#d4849a',
        blush:  '#fdf0f5',
        petal:  '#f8e0e8',
        ivory:  '#fefaf5',
      },
      fontFamily: {
        script:  ['Great Vibes', 'cursive'],
        display: ['Cormorant Garamond', 'Georgia', 'ui-serif', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

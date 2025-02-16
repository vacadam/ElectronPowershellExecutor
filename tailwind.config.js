/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ["./**/*.{html,js}", "!./node_modules"],
  darkMode: 'class',
  theme: {
    extend: {
        
        fontFamily: {
            chakra: ['"Chakra Petch"', 'serif'],
        },
        colors: {
            'epe': '#0369a1',
            'epe-active': '#0ea5e9',
            'gray': {
                "600": "#4a4a4a",
                "700": "#363636",
                "800": "#222222",
                "900": "#0e0e0e",
                "950": "#000000"
            }
        },
        spacing: {
            '108': '27rem',
            '86': '21.5rem',
        },
        dropShadow: {
            'svg': '0 1px 1px rgba(0, 0, 0, 0.8)',
            'btn': '0 1px 1px rgba(0, 0, 0, 0.6)',
            'ser': '0 3px 2px rgba(0, 0, 0, 0.20)',
            'serd': '0 3px 2px rgba(0, 0, 0, 0.40)',
        }
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
    plugin(function ({ addVariant }) {
        addVariant('has-favorites', '&:has(> .fav-child)');
    }),
  ],
};

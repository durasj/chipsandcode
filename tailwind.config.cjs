const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      ringWidth: ['focus-visible'],
      ringColor: ['focus-visible'],
      ringOffsetWidth: ['focus-visible'],
    },
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['[data-theme=light]'],
          primary: '#4f46e5',
          secondary: '#0284c7',

          '--btn-text-case': 'none',

          // Default has low contrast
          '.btn-primary': { color: '#e0e7ff' },
          '.text-primary-content': { color: '#e0e7ff' },
        },
        dark: {
          ...require('daisyui/src/theming/themes')['[data-theme=dark]'],
          primary: '#4f46e5',
          'base-100': '#27272a',
          'base-200': '#18181b',
          'base-300': '#09090b',
          neutral: '#2F2F33',

          '--btn-text-case': 'none',
        },
      },
    ],
  },
};

module.exports = config;

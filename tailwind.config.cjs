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
          ...require('daisyui/src/colors/themes')['[data-theme=light]'],
          primary: '#4f46e5',
          secondary: '#0284c7',

          '--btn-text-case': 'none',
        },
        dark: {
          ...require('daisyui/src/colors/themes')['[data-theme=dark]'],
          primary: '#4f46e5',
          'base-100': '#292524',
          'base-200': '#1c1917',
          'base-300': '#0b0a09',
          neutral: '#34302f',

          '--btn-text-case': 'none',
        },
      },
    ],
  },
};

module.exports = config;

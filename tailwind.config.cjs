const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      ringWidth: ['focus-visible'],
      ringColor: ['focus-visible'],
      ringOffsetWidth: ['focus-visible'],
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};

module.exports = config;

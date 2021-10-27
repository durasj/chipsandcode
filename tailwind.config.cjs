const config = {
  mode: 'jit',
  purge: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      ringWidth: ['focus-visible'],
      ringColor: ['focus-visible'],
      ringOffsetWidth: ['focus-visible'],
    },
  },
  plugins: [],
};

module.exports = config;

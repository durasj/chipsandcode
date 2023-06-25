import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte'],

  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    preprocess({
      postcss: true,
    }),
  ],

  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      routes: {
        include: ['/*'],
        exclude: ['<all>'],
      },
    }),
    prerender: {
      crawl: true,
    },
  },
};

export default config;

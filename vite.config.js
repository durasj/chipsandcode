import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

import NearleyPlugin from './src/lib/editor/nearleyPlugin.js';
import contentPlugin from './src/lib/content/plugin.js';

/** @type {import('vite').UserConfig} */
const config = defineConfig(() => {
  return {
    resolve: {
      alias: {
        src: path.resolve('./src'),
      },
    },
    plugins: [sveltekit(), NearleyPlugin(), contentPlugin()],
    ssr: {
      noExternal: ['date-fns'],
    },
  };
});

export default config;

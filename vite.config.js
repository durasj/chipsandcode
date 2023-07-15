import { defineConfig, loadEnv } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

import NearleyPlugin from './src/lib/editor/nearleyPlugin.js';
import contentPlugin from './src/lib/content/plugin.js';

/** @type {import('vite').UserConfig} */
const config = defineConfig(() => {
  // Proxying should be development-only feature
  const env = loadEnv('development', process.cwd(), '');

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
    server: env.PROXY_API_URL
      ? {
          proxy: {
            [env.VITE_API_PREFIX]: {
              target: env.PROXY_API_URL,
              rewrite: (path) =>
                path.replace(new RegExp(`^${env.VITE_API_PREFIX.replace('/', '\\/')}`), ''),
              changeOrigin: true,
            },
          },
        }
      : undefined,
  };
});

export default config;
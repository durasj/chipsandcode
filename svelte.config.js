import { mdsvex } from 'mdsvex';
import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import { defineConfig, loadEnv } from 'vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import path from 'path';

import mdsvexConfig from './mdsvex.config.js';
import NearleyPlugin from './src/editor/nearleyPlugin.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', ...mdsvexConfig.extensions],

  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: [
    preprocess({
      postcss: true,
    }),
    mdsvex(mdsvexConfig),
  ],

  kit: {
    adapter: adapter({
      // default options are shown
      pages: 'build',
      assets: 'build',
      fallback: null,
    }),
    vite: defineConfig(() => {
      // Proxying should be development-only feature
      const env = loadEnv('development', process.cwd(), '');

      return {
        resolve: {
          alias: {
            src: path.resolve('./src'),
          },
        },
        plugins: [
          NearleyPlugin(),
          monacoEditorPlugin.default({ languageWorkers: ['editorWorkerService'] }),
        ],
        server: env.PROXY_URL
          ? {
              proxy: {
                [env.VITE_API_PATH]: {
                  target: env.PROXY_URL,
                  rewrite: (path) =>
                    path.replace(new RegExp(`^${env.VITE_API_PATH.replace('/', '\\/')}`), ''),
                  changeOrigin: true,
                },
              },
            }
          : undefined,
      };
    }),
  },
};

export default config;

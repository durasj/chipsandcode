import { mdsvex } from 'mdsvex';
import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import { defineConfig } from 'vite';
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
    // hydrate the <body> element in src/app.html
    target: 'body',
    adapter: adapter({
      // default options are shown
      pages: 'build',
      assets: 'build',
      fallback: null,
    }),
    vite: defineConfig({
      resolve: {
        alias: {
          src: path.resolve('./src'),
        },
      },
      plugins: [
        NearleyPlugin(),
        monacoEditorPlugin.default({ languageWorkers: ['editorWorkerService'] }),
      ],
    }),
  },
};

export default config;

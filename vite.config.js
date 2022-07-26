import { defineConfig, loadEnv } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import path from 'path';

import NearleyPlugin from './src/editor/nearleyPlugin.js';

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
    plugins: [
      sveltekit(),
      NearleyPlugin(),
      monacoEditorPlugin.default({ languageWorkers: ['editorWorkerService'] }),
    ],
    ssr: {
      noExternal: ['date-fns'],
    },
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
});

export default config;

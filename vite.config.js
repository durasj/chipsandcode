import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { imagetools } from '@zerodevx/svelte-img/vite';
import { VitePWA } from 'vite-plugin-pwa';
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
    plugins: [
      sveltekit(),
      imagetools(),
      NearleyPlugin(),
      contentPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Chips and Code',
          shortName: 'Chips&Code',
          description:
            'Find out how computers work by embarking on the journey of building your own computer from scratch, from chips to code. No prerequisites - start from the browser now.',
          categories: ['books', 'education', 'developer', 'developer tools', 'development'],
          display: 'minimal-ui',
          icons: [
            {
              src: 'logo.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'logo.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    ssr: {
      noExternal: ['date-fns'],
    },
  };
});

export default config;

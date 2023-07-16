import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { imagetools } from '@zerodevx/svelte-img/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
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
      SvelteKitPWA({
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
              src: 'pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
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

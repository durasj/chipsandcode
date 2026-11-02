import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { withPwa } from '@vite-pwa/sveltekit';
import path from 'path';

import NearleyPlugin from './src/lib/editor/nearleyPlugin.js';
import contentPlugin from './src/lib/content/plugin.js';

/** @type {import('vite').UserConfig} */
const config = defineConfig(() => {
  return {
    resolve: {
      alias: {
        src: path.resolve('./src'),
        // Monaco 0.57 vendors DOMPurify 3.4.15; replacing its npm dependency alone is insufficient.
        './dompurify/dompurify.js': path.resolve('./node_modules/dompurify/dist/purify.es.mjs'),
      },
    },
    plugins: [
      enhancedImages(),
      NearleyPlugin(),
      contentPlugin(),
      withPwa(
        {
          adapter: adapter({ runtime: 'nodejs26.x' }),
          preprocess: vitePreprocess({ script: true }),
          prerender: {
            entries: ['*', '/learn/reference', '/learn/reference/boolean-logic', '/learn/hardware/boolean-logic'],
          },
          serviceWorker: { register: false },
        },
        {
          registerType: 'autoUpdate',
          manifest: {
            name: 'Chips and Code',
            short_name: 'Chips&Code',
            description:
              'Find out how computers work by embarking on the journey of building your own computer from scratch, from chips to code. No prerequisites - start from the browser now.',
            categories: ['books', 'education', 'developer', 'developer tools', 'development'],
            display: 'standalone',
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
          strategies: 'generateSW',
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          generateSW: {
            navigateFallbackDenylist: [/^\/api\//],
          },
        },
      ),
    ],
    test: {
      clearMocks: true,
      include: ['src/**/*.test.{ts,js}', 'scripts/**/*.test.mjs'],
      coverage: {
        provider: 'v8',
        include: ['src/lib/**/*.ts'],
        exclude: ['src/lib/**/*.d.ts', 'src/lib/**/testing/**', 'src/lib/editor/index.ts'],
        thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
      },
    },
  };
});

export default config;

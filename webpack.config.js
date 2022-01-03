/**
 * Webpack is used for backend only!
 *
 * Frontend is managed by Sveltekit (vite), see svelte.config.js
 */

import path from 'path';

export default {
  entry: './src/backend/index.ts',
  output: {
    filename: 'worker.js',
    path: path.join(process.cwd(), 'dist'),
  },
  devtool: 'cheap-module-source-map',
  mode: 'development',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /backend\/.*\.ts$/,
        loader: 'ts-loader',
        options: {
          onlyCompileBundledFiles: true,
        },
      },
    ],
  },
};

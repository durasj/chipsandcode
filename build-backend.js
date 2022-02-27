#!/usr/bin/env node
import estrella from 'estrella';

const { build } = estrella;

build({
  entry: './src/backend/index.ts',
  bundle: true,
  outfile: './dist/worker.mjs',
  minify: false,
  external: ['__STATIC_CONTENT_MANIFEST'],
  outExtension: { '.js': '.mjs' },
  format: 'esm',
});

import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
if (resolve(process.cwd()) !== resolve(root)) {
  throw new Error('Run the build from the repository root.');
}
// Only generated output: avoid stale chunks and function symlinks on repeated/cached builds.
for (const directory of ['.svelte-kit/output', '.vercel/output']) {
  await rm(new URL(directory, new URL('../', import.meta.url)), { recursive: true, force: true });
}

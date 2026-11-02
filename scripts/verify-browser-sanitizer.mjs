import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory()
        ? javascriptFiles(path)
        : Promise.resolve(path.endsWith('.js') ? [path] : []);
    }),
  );
  return groups.flat();
}

const files = await javascriptFiles('.svelte-kit/output/client');
const bundles = await Promise.all(files.map((path) => readFile(path, 'utf8')));
if (bundles.some((source) => source.includes('3.4.15'))) {
  throw new Error('The browser build still contains Monaco’s vulnerable vendored DOMPurify.');
}
if (!bundles.some((source) => source.includes('3.4.17'))) {
  throw new Error('The patched DOMPurify version was not found in the browser build.');
}
console.log('Verified DOMPurify 3.4.17 in the browser build; vendored 3.4.15 is absent.');

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { prepareImport } from './lib/legacy-data.mjs';

const output = resolve(process.argv[2] || 'backups/cloudflare-kv.json');
const { CF_API_TOKEN, CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID } = process.env;
if (!CF_API_TOKEN || !CF_ACCOUNT_ID || !CF_KV_NAMESPACE_ID) {
  throw new Error('Set CF_API_TOKEN, CF_ACCOUNT_ID and CF_KV_NAMESPACE_ID locally.');
}
const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(CF_ACCOUNT_ID)}/storage/kv/namespaces/${encodeURIComponent(CF_KV_NAMESPACE_ID)}`;
async function read(path) {
  const response = await fetch(`${base}/${path}`, {
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
  });
  if (!response.ok) throw new Error(`Cloudflare export request failed (${response.status}).`);
  return response.json();
}
let cursor = '';
const records = [];
do {
  const page = await read(
    `keys?limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
  );
  if (!page.success || !Array.isArray(page.result))
    throw new Error('Cloudflare key listing failed.');
  const keys = page.result.filter(
    ({ name }) => name.startsWith('user-') || name.startsWith('experiment-'),
  );
  for (const { name: key } of keys)
    records.push({ key, value: await read(`values/${encodeURIComponent(key)}`) });
  const next = page.result_info?.cursor || '';
  if (!page.result.length) break;
  if (next && next === cursor) throw new Error('Cloudflare pagination did not advance.');
  cursor = next;
} while (cursor);
const snapshot = { version: 1, exportedAt: new Date().toISOString(), records };
// Retain the complete export even if validation identifies legacy inconsistencies.
await mkdir(dirname(output), { recursive: true, mode: 0o700 });
await writeFile(output, JSON.stringify(snapshot), { mode: 0o600, flag: 'wx' });
console.log(`Exported ${records.length} records to the requested local file.`);
const prepared = prepareImport(snapshot);
console.log(
  `Validated ${prepared.sessions.length} sessions and ${prepared.experiments.length} experiments.`,
);

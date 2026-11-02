import { createHash } from 'node:crypto';
import { experimentSchema } from '../../src/lib/shared.ts';

/** Validate the complete export before writing anything. Never silently discard ownership. */
export function prepareImport(snapshot) {
  if (snapshot?.version !== 1 || !Array.isArray(snapshot.records)) {
    throw new Error('Expected a version 1 Cloudflare KV export.');
  }
  const sessions = new Map();
  const owners = new Map();
  const experiments = new Map();
  const keys = new Set();
  for (const [index, record] of snapshot.records.entries()) {
    if (typeof record.key !== 'string' || keys.has(record.key)) {
      throw new Error(`Duplicate or invalid record at index ${index}.`);
    }
    keys.add(record.key);
    if (record.key.startsWith('user-')) {
      const token = record.key.slice(5);
      if (!/^[A-Za-z0-9_-]{64,256}$/.test(token) || !Array.isArray(record.value?.experiments)) {
        throw new Error(`Invalid user record at index ${index}.`);
      }
      const id = createHash('sha256').update(token).digest('hex');
      sessions.set(id, {
        id,
        name: typeof record.value.name === 'string' ? record.value.name : 'Anonym',
      });
      for (const item of record.value.experiments) {
        if (typeof item.id !== 'string' || (owners.has(item.id) && owners.get(item.id) !== id)) {
          throw new Error('An experiment has ambiguous ownership. Resolve it before import.');
        }
        owners.set(item.id, id);
      }
    } else if (record.key.startsWith('experiment-')) {
      const value = record.value;
      const parsed = experimentSchema.safeParse(value);
      if (
        !parsed.success ||
        typeof value.id !== 'string' ||
        record.key !== `experiment-${value.id}` ||
        typeof value.created !== 'string' ||
        !Number.isFinite(Date.parse(value.created)) ||
        (value.updated !== undefined && !Number.isFinite(Date.parse(value.updated)))
      ) {
        throw new Error(`Invalid experiment record at index ${index}.`);
      }
      experiments.set(value.id, {
        ...parsed.data,
        id: value.id,
        created: value.created,
        ...(value.updated ? { updated: value.updated } : {}),
      });
    } else {
      throw new Error(`Unexpected record type at index ${index}.`);
    }
  }
  for (const id of experiments.keys()) {
    if (!owners.has(id)) throw new Error('An experiment has no owner. Resolve it before import.');
  }
  for (const id of owners.keys()) {
    if (!experiments.has(id))
      throw new Error(
        'A user references a missing experiment. Export again after freezing writes.',
      );
  }
  return {
    sessions: [...sessions.values()],
    experiments: [...experiments.values()].map((payload) => ({
      ownerId: owners.get(payload.id),
      payload,
    })),
  };
}

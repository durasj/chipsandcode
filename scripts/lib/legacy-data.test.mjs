import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { prepareImport } from './legacy-data.mjs';

const token = 'a'.repeat(128);
const experiment = {
  id: 'one',
  name: 'And',
  type: 'HARDWARE',
  code: 'CHIP And {}',
  tests: '',
  compare: '',
  visibility: 'PRIVATE',
  created: '2023-01-01T00:00:00.000Z',
};
const snapshot = () => ({
  version: 1,
  records: [
    { key: `user-${token}`, value: { name: 'Anonym', experiments: [{ id: 'one', name: 'And' }] } },
    { key: 'experiment-one', value: { ...experiment } },
  ],
});

describe('Cloudflare migration validation', () => {
  it('preserves complete content, IDs, visibility and dates while hashing legacy identity', () => {
    const result = prepareImport(snapshot());
    expect(result.experiments).toEqual([
      { ownerId: createHash('sha256').update(token).digest('hex'), payload: experiment },
    ]);
    expect(JSON.stringify(result)).not.toContain(token);
  });
  it('rejects conflicting ownership rather than exposing private data', () => {
    const data = snapshot();
    data.records.push({ key: `user-${'b'.repeat(128)}`, value: { experiments: [{ id: 'one' }] } });
    expect(() => prepareImport(data)).toThrow('ambiguous ownership');
  });
  it('rejects unowned experiments and dangling references', () => {
    const data = snapshot();
    data.records.shift();
    expect(() => prepareImport(data)).toThrow('no owner');
    const missing = snapshot();
    missing.records.pop();
    expect(() => prepareImport(missing)).toThrow('missing experiment');
  });
  it('rejects duplicate records, invalid content, IDs and dates', () => {
    const data = snapshot();
    data.records.push(data.records[0]);
    expect(() => prepareImport(data)).toThrow('Duplicate');
    for (const patch of [{ visibility: 'BAD' }, { id: 'two' }, { created: 'yesterday' }]) {
      const data = snapshot();
      Object.assign(data.records[1].value, patch);
      expect(() => prepareImport(data)).toThrow('Invalid experiment');
    }
  });
  it('rejects the wrong export format', () => {
    expect(() => prepareImport({ records: [] })).toThrow('version 1');
  });
});

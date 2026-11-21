import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import {
  experimentResponse,
  deleteExperiment,
  listExperiments,
  readExperiment,
  saveExperiment,
  sessionId,
} from './experiments';

const { sql } = vi.hoisted(() => ({ sql: Object.assign(vi.fn(), { transaction: vi.fn() }) }));
vi.mock('./database', () => ({ getDatabase: () => sql }));
const token = 'a'.repeat(128);
const otherToken = 'b'.repeat(128);
const payload = {
  name: 'And',
  type: 'HARDWARE',
  code: 'CHIP And {}',
  tests: '',
  compare: '',
  visibility: 'PRIVATE',
};
function cookies(value?: string) {
  return { get: vi.fn(() => value), set: vi.fn() } as unknown as Cookies;
}
function request(body: unknown = payload) {
  return new Request('https://chipsandcode.com/api/experiments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Experiment API ownership and persistence', () => {
  it('returns storage failures as JSON without exposing connection details', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await experimentResponse(async () => {
        throw new Error('postgres://example-secret@database.invalid');
      });
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain('example-secret');
      expect(JSON.stringify(log.mock.calls)).not.toContain('example-secret');
    } finally {
      log.mockRestore();
    }
  });

  beforeEach(() => {
    sql.mockReset();
    sql.transaction.mockReset();
    sql.mockResolvedValue([]);
  });

  it('does not return another anonymous session’s private experiment', async () => {
    sql.mockResolvedValue([{ owner_id: sessionId(token), payload }]);
    expect((await readExperiment('one', cookies(otherToken))).status).toBe(403);
    expect((await readExperiment('one', cookies())).status).toBe(401);
    const response = await readExperiment('one', cookies(token));
    expect(response.status).toBe(200);
    expect((await response.json()).experiment).toEqual(payload);
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('permits public sharing without a session', async () => {
    sql.mockResolvedValue([
      { owner_id: sessionId(token), payload: { ...payload, visibility: 'PUBLIC' } },
    ]);
    expect((await readExperiment('one', cookies())).status).toBe(200);
  });

  it('returns 404 for missing experiments', async () => {
    expect((await readExperiment('missing', cookies(token))).status).toBe(404);
  });

  it('lists only experiments owned by the exact session', async () => {
    expect(await (await listExperiments(cookies())).json()).toEqual({ experiments: [] });
    expect(sql).not.toHaveBeenCalled();
    await listExperiments(cookies(token));
    expect(sql.mock.calls[0][0].join('?')).toMatch(/WHERE owner_id = \?/);
    expect(sql.mock.calls[0][1]).toBe(sessionId(token));
  });

  it('atomically creates an experiment and issues a secure, httpOnly session', async () => {
    const jar = cookies();
    const response = await saveExperiment(request(), jar);
    expect(response.status).toBe(200);
    expect(sql.transaction).toHaveBeenCalledOnce();
    const [key, cookie, options] = vi.mocked(jar.set).mock.calls[0];
    expect(key).toBe('auth');
    expect(cookie).toMatch(/^[A-Za-z0-9_-]{128}$/);
    expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
    expect(sql.mock.calls[0][1]).toBe(sessionId(cookie));
    expect(JSON.stringify(sql.mock.calls)).not.toContain(cookie);
  });

  it('does not issue a cookie when persistence fails', async () => {
    sql.transaction.mockRejectedValue(new Error('unavailable'));
    const jar = cookies();
    await expect(saveExperiment(request(), jar)).rejects.toThrow('unavailable');
    expect(jar.set).not.toHaveBeenCalled();
  });

  it('persists custom chips and test files together with the saved experiment', async () => {
    const project = {
      ...payload,
      code: 'CHIP Probe { IN in; OUT out; PARTS: Custom(in=in, out=out); }',
      dependencies: ['CHIP Custom { IN in; OUT out; PARTS: Not(in=in, out=out); }'],
      testFiles: { 'Program.hack': '0000000000000111', 'Probe.cmp': '| out |\n| 1 |' },
    };
    const response = await saveExperiment(request(project), cookies());
    expect(response.status).toBe(200);
    const saved = (await response.json()).experiment;
    const insert = sql.mock.calls.find(([query]) =>
      query.join('?').includes('INSERT INTO cnc_experiments'),
    );
    expect(JSON.parse(insert![3])).toEqual(saved);
    expect(saved).toMatchObject(project);

    sql.mockResolvedValue([{ owner_id: sessionId(token), payload: saved }]);
    expect((await (await readExperiment(saved.id, cookies(token))).json()).experiment).toEqual(
      saved,
    );
  });

  it('accepts explicit empty project fields when removing the last custom chip or test file', async () => {
    sql.mockResolvedValue([
      { payload: { ...payload, id: 'one', dependencies: [], testFiles: {} } },
    ]);
    const response = await saveExperiment(
      request({ ...payload, dependencies: [], testFiles: {} }),
      cookies(token),
      'one',
    );
    expect(response.status).toBe(200);
    expect(JSON.parse(sql.mock.calls[0][1])).toMatchObject({ dependencies: [], testFiles: {} });
  });

  it.each([
    { dependencies: [42] },
    { dependencies: Array(101).fill('CHIP Custom {}') },
    { dependencies: ['x'.repeat(1000001)] },
    { testFiles: { 'rom.hack': 42 } },
    { testFiles: { '': 'contents' } },
    { testFiles: { ['x'.repeat(201)]: 'contents' } },
    { testFiles: { 'rom.hack': 'x'.repeat(2000001) } },
    { testFiles: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`${i}.hack`, '0'])) },
  ])('rejects malformed or oversized project files before accessing storage', async (fields) => {
    expect((await saveExperiment(request({ ...payload, ...fields }), cookies())).status).toBe(400);
    expect(sql).not.toHaveBeenCalled();
  });

  it('rejects invalid payloads and malformed JSON before accessing storage', async () => {
    expect((await saveExperiment(request({}), cookies())).status).toBe(400);
    expect(
      (
        await saveExperiment(
          new Request('https://chipsandcode.com/api/experiments', { method: 'POST', body: '{' }),
          cookies(),
        )
      ).status,
    ).toBe(400);
    expect(sql).not.toHaveBeenCalled();
  });

  it('scopes updates and deletion to both ID and owner, even for users with other experiments', async () => {
    expect((await saveExperiment(request(), cookies(otherToken), 'someone-elses-id')).status).toBe(
      404,
    );
    const [update, patch, , id, owner] = sql.mock.calls[0];
    expect(update.join('?')).toMatch(/WHERE id = \? AND owner_id = \?/);
    expect(JSON.parse(patch)).toMatchObject(payload);
    expect(id).toBe('someone-elses-id');
    expect(owner).toBe(sessionId(otherToken));
    expect((await deleteExperiment('someone-elses-id', cookies(otherToken))).status).toBe(404);
    expect(sql.mock.calls[1][0].join('?')).toMatch(/WHERE id = \?\s+AND owner_id = \?/);
  });

  it('rejects unauthenticated and malformed-session mutations', async () => {
    expect((await saveExperiment(request(), cookies('invalid'), 'one')).status).toBe(401);
    expect((await deleteExperiment('one', cookies())).status).toBe(401);
  });

  it('reuses known legacy sessions without replacing their cookie', async () => {
    sql.mockResolvedValueOnce([{ id: sessionId(token) }]);
    const jar = cookies(token);
    expect((await saveExperiment(request(), jar)).status).toBe(200);
    expect(jar.set).not.toHaveBeenCalled();
    expect(sql.mock.calls[1][1]).toBe(sessionId(token));
  });

  it('returns the persisted result for authorized updates and deletions', async () => {
    sql.mockResolvedValue([{ payload: { ...payload, id: 'one' } }]);
    expect(await (await saveExperiment(request(), cookies(token), 'one')).json()).toEqual({
      experiment: { ...payload, id: 'one' },
    });
    expect(await (await deleteExperiment('one', cookies(token))).json()).toEqual({
      experiment: { ...payload, id: 'one' },
    });
  });
});

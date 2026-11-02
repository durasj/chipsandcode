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

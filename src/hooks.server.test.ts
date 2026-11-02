import { describe, expect, it, vi } from 'vitest';
import { handle } from './hooks.server';

function call(origin?: string, method = 'POST', type = 'application/json') {
  const request = new Request('https://chipsandcode.com/api/experiments', {
    method,
    headers: { ...(origin ? { origin } : {}), 'content-type': type },
  });
  const resolve = vi.fn(async () => Response.json({ ok: true }));
  const response = handle({ event: { request, url: new URL(request.url) }, resolve } as never);
  return { response, resolve };
}
describe('Cookie-authenticated API origin checks', () => {
  it('blocks hostile and missing origins for mutations', async () => {
    for (const origin of ['https://attacker.test', undefined]) {
      const result = call(origin);
      expect((await result.response).status).toBe(403);
      expect(result.resolve).not.toHaveBeenCalled();
    }
  });
  it('allows same-origin JSON and marks responses uncacheable', async () => {
    const result = call('https://chipsandcode.com');
    expect((await result.response).status).toBe(200);
    expect((await result.response).headers.get('cache-control')).toBe('private, no-store');
  });
  it('rejects non-JSON writes while allowing public reads', async () => {
    expect((await call('https://chipsandcode.com', 'POST', 'text/plain').response).status).toBe(
      415,
    );
    expect((await call(undefined, 'GET').response).status).toBe(200);
  });
});

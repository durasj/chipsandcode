import { describe, expect, it, vi } from 'vitest';
import apiCall from './api';

const fetchJson = vi.fn(() => 'Return value');
const fetch = vi.fn(() => ({
  ok: true,
  headers: {},
  json: fetchJson,
}));
vi.stubGlobal('fetch', fetch);

describe('API call abstraction', () => {
  it('Calls fetch with credentials', async () => {
    const response = await apiCall('/smt');

    expect(response).toBe('Return value');
    expect(fetch).toHaveBeenCalledWith(`${process.env.VITE_API_PREFIX}/smt`, {
      credentials: 'include',
    });
  });

  it('Forwards options', async () => {
    const response = await apiCall('/smt');

    expect(response).toBe('Return value');
    expect(fetch).toHaveBeenCalledWith(`${process.env.VITE_API_PREFIX}/smt`, {
      credentials: 'include',
    });
  });

  it('Handles errors with explicit message', async () => {
    // @ts-ignore This check doesn't help
    fetchJson.mockImplementationOnce(() => ({ message: 'Error message' }));
    // @ts-ignore This check doesn't help
    fetch.mockImplementationOnce(() => ({
      ok: false,
      headers: { get: () => ['application/json'] },
      json: fetchJson,
    }));

    await expect(() => apiCall('/smt')).rejects.toMatch(/Error message/);
  });

  it('Handles errors without explicit message', async () => {
    // @ts-ignore This check doesn't help
    fetch.mockImplementationOnce(() => ({
      ok: false,
      headers: { get: () => [] },
      json: fetchJson,
      statusText: 'Unlucky',
    }));

    await expect(() => apiCall('/smt')).rejects.toMatch(/Unlucky/);
  });
});

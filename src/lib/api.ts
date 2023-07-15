import type { ErrorResponse } from './shared';

export default async function api<T>(url: string, options?: RequestInit) {
  const resourceUrl = `${import.meta.env.VITE_API_PREFIX}${url}`;

  const response = await fetch(resourceUrl, {
    credentials: 'include',
    ...options,
  });
  if (!response.ok) {
    throw new Error(
      response.headers.get('content-type')?.includes('application/json')
        ? ((await response.json()) as ErrorResponse)?.message
        : response.statusText,
    );
  }

  return response.json() as T;
}

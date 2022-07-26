import type { ErrorResponse } from './backend/shared';

export default async function api<T>(url: string, options?: RequestInit) {
  const response = await fetch(`${import.meta.env.VITE_API_PATH}${url}`, options);
  if (!response.ok) {
    throw new Error(
      response.headers.get('content-type')?.includes('application/json')
        ? (await response.json<ErrorResponse>())?.message
        : response.statusText,
    );
  }

  return response.json<T>();
}

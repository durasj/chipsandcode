import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
  if (!event.url.pathname.startsWith('/api/')) return resolve(event);
  // Cookies authenticate all API mutations. Also protect JSON requests from cross-origin callers.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(event.request.method)) {
    const origin = event.request.headers.get('origin');
    if (origin !== event.url.origin) {
      return Response.json({ message: 'Cross-origin mutations are forbidden.' }, { status: 403 });
    }
    if (
      event.request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' &&
      event.request.method !== 'DELETE'
    ) {
      return Response.json({ message: 'Content-Type must be application/json.' }, { status: 415 });
    }
  }
  try {
    const response = await resolve(event);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch {
    return Response.json(
      { message: 'The experiment service is unavailable.' },
      {
        status: 503,
        headers: { 'Cache-Control': 'private, no-store' },
      },
    );
  }
};

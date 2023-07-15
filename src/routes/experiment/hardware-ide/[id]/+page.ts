import type { PageLoad } from './$types';

// We just forward params - any easier way to do it?
export const load = (async ({ params }) => ({
  id: params.id,
})) satisfies PageLoad;

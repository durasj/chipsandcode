import type { PageLoad } from './$types';
export const load = (async ({ params }) => ({ id: params.id })) satisfies PageLoad;
export const prerender = false;
export const ssr = false;

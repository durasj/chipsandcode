import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
export const prerender = false;
export const load: PageLoad = ({ params, url }) =>
  redirect(308, `/tools/hardware-simulator/${encodeURIComponent(params.id)}${url.search}`);

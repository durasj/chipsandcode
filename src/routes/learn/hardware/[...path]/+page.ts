import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
export const prerender = 'auto';
export const load: PageLoad = ({ params }) =>
  redirect(308, `/learn/reference/${params.path || 'boolean-logic'}`);

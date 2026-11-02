import type { RequestHandler } from './$types';
import { experimentResponse, listExperiments, saveExperiment } from '#lib/server/experiments.js';

export const prerender = false;
export const GET: RequestHandler = ({ cookies }) =>
  experimentResponse(() => listExperiments(cookies));
export const POST: RequestHandler = ({ request, cookies }) =>
  experimentResponse(() => saveExperiment(request, cookies));

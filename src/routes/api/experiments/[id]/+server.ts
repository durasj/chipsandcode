import type { RequestHandler } from './$types';
import {
  experimentResponse,
  deleteExperiment,
  readExperiment,
  saveExperiment,
} from '#lib/server/experiments.js';

export const prerender = false;
export const GET: RequestHandler = ({ params, cookies }) =>
  experimentResponse(() => readExperiment(params.id, cookies));
export const PUT: RequestHandler = ({ params, request, cookies }) =>
  experimentResponse(() => saveExperiment(request, cookies, params.id));
export const DELETE: RequestHandler = ({ params, cookies }) =>
  experimentResponse(() => deleteExperiment(params.id, cookies));

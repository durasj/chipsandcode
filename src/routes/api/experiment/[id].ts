import type { RequestHandler } from '@sveltejs/kit';
import type { Experiment } from 'src/backend/endpoints/experiment';

export const GET: RequestHandler<{ id: string }> = async ({ params, platform }) => {
  const { id } = params;
  const KV = platform.env.KV;

  const experiment = await KV.get<Experiment>(`experiment-${id}`, 'json');
  if (!experiment) {
    return {
      status: 404,
      body: { message: 'Experiment not found.' },
    };
  }

  return {
    status: 200,
    body: { experiment },
  };
};

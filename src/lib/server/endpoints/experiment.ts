import { z } from 'zod';
import createHttpError from 'http-errors';

import type { AppEndpoints } from '..';
import { AUTH_KEY, generateRandom, USER_DATA_KEY, type UserData } from '../../shared';

const experimentSchema = z.object({
  name: z.string(),
  type: z.enum(['HARDWARE']),
  code: z.string().describe('HDL code'),
  tests: z.string().describe('Test script'),
  compare: z.string().describe('Expected test script output'),
  visibility: z.enum(['PRIVATE', 'PUBLIC']),
});

export type ExperimentRequest = z.infer<typeof experimentSchema>;
export type Experiment = ExperimentRequest & {
  id: string;
  created: Date;
  modified?: Date;
};

const addExperimentEndpoints: AppEndpoints = (router) => {
  router.get('/experiments', async ({ response, data }) => {
    const experiments = data[USER_DATA_KEY]?.experiments || [];

    try {
      response.body = JSON.stringify({ experiments });
    } catch (e) {
      console.error(e);

      throw createHttpError(500, 'Retrieval failed.', { expose: true });
    }
  });

  router.post('/experiment', async ({ response, request, env, data }) => {
    const { KV } = env;

    const body = await request.json<ExperimentRequest>();

    const validation = experimentSchema.safeParse(body);
    if (!validation.success) {
      throw createHttpError(400, 'Experiment data are invalid.', {
        details: validation.error.errors,
      });
    }

    const id = generateRandom(24).replace(/\/|\+/, 'a');

    const userKey = data[AUTH_KEY];
    const existingExperiments = data[USER_DATA_KEY]?.experiments;
    const newUserDataItem = { id, name: body.name };
    const userData = {
      ...data[USER_DATA_KEY],
      experiments: existingExperiments
        ? [...existingExperiments, newUserDataItem]
        : [newUserDataItem],
    };
    const experiment: Experiment = { id, ...body, created: new Date() };

    try {
      await KV.put(`experiment-${id}`, JSON.stringify(experiment));
      await KV.put(`user-${userKey}`, JSON.stringify(userData));

      response.body = { experiment };
    } catch (e) {
      console.error(e);

      throw createHttpError(500, 'Saving failed.', { expose: true });
    }
  });

  router.get('/experiment/:id', async ({ response, params, env, data }) => {
    const { KV } = env;
    const { id } = params;

    const experiment = await KV.get<Experiment>(`experiment-${id}`, 'json');
    if (!experiment) {
      throw createHttpError(404, 'Experiment not found.');
    }

    if (
      experiment.visibility === 'PRIVATE' &&
      !data[USER_DATA_KEY]?.experiments.find((e) => e.id)
    ) {
      throw createHttpError(
        !data[USER_DATA_KEY] ? 401 : 403,
        'Experiment is available only to the author.',
      );
    }

    response.body = { experiment };
  });

  router.put('/experiment/:id', async ({ response, request, params, env, data }) => {
    const { KV } = env;
    const { id } = params;

    const body = await request.json<ExperimentRequest>();

    const validation = experimentSchema.safeParse(body);
    if (!validation.success) {
      throw createHttpError(400, 'Experiment data are invalid.', {
        details: validation.error.errors,
      });
    }

    const experiment = await KV.get<Experiment>(`experiment-${id}`, 'json');
    if (!experiment) {
      throw createHttpError(404, 'Experiment not found.');
    }

    if (!data[USER_DATA_KEY]?.experiments.find((e) => e.id)) {
      throw createHttpError(
        !data[USER_DATA_KEY] ? 401 : 403,
        'Experiment can be modified only by the author.',
      );
    }

    const updatedExperiment = { ...experiment, ...body, updated: new Date() };

    const userKey = data[AUTH_KEY];
    const userData = data[USER_DATA_KEY];
    let updatedUserData: UserData | undefined;
    if (updatedExperiment.name !== experiment.name && userData) {
      const existingExperiments = userData.experiments;
      const newUserDataItem = { id, name: updatedExperiment.name };
      updatedUserData = {
        ...userData,
        experiments: existingExperiments
          ? existingExperiments.map((e) => (e.id === experiment.id ? newUserDataItem : e))
          : [newUserDataItem],
      };
    }

    try {
      await KV.put(`experiment-${id}`, JSON.stringify(updatedExperiment));
      if (updatedUserData) {
        await KV.put(`user-${userKey}`, JSON.stringify(updatedUserData));
      }

      response.body = JSON.stringify({ experiment: updatedExperiment });
    } catch (e) {
      console.error(e);
      throw createHttpError(500, 'Saving failed.', { expose: true });
    }
  });

  router.delete('/experiment/:id', async ({ response, params, env, data }) => {
    const { KV } = env;
    const { id } = params;

    const experiment = await KV.get<Experiment>(`experiment-${id}`, 'json');
    if (!experiment) {
      throw createHttpError(404, 'Experiment not found.');
    }

    if (!data[USER_DATA_KEY]?.experiments.find((e) => e.id)) {
      throw createHttpError(
        !data[USER_DATA_KEY] ? 401 : 403,
        'Experiment can be deleted only by the author.',
      );
    }

    const userKey = data[AUTH_KEY];
    const existingExperiments = data[USER_DATA_KEY]?.experiments;
    const userData = {
      ...data[USER_DATA_KEY],
      experiments: existingExperiments ? existingExperiments.filter((e) => e.id !== id) : [],
    };

    try {
      await KV.delete(`experiment-${id}`);
      await KV.put(`user-${userKey}`, JSON.stringify(userData));

      response.body = JSON.stringify({ experiment });
    } catch (e) {
      console.error(e);
      throw createHttpError(500, 'Deleting failed.', { expose: true });
    }
  });
};

export default addExperimentEndpoints;

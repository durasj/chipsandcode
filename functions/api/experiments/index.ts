import {
  AUTH_KEY,
  USER_DATA_KEY,
  generateRandom,
  Experiment,
  ExperimentRequest,
  experimentSchema,
} from '../../../src/lib/shared';

export const onRequestGet: BackendFunction = async ({ data }) => {
  const experiments = data[USER_DATA_KEY]?.experiments || [];

  try {
    return Response.json({ experiments });
  } catch (e) {
    console.error(e);

    return Response.json({ message: 'Retrieval failed.' }, { status: 500 });
  }
};

export const onRequestPost: BackendFunction = async ({ data, env, request }) => {
  const { KV } = env;

  const body = await request.json<ExperimentRequest>();

  const validation = experimentSchema.safeParse(body);
  if (!validation.success) {
    return Response.json(
      {
        message: 'Experiment data are invalid.',
        details: validation.error.errors,
      },
      { status: 400 },
    );
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

    return Response.json({ experiment });
  } catch (e) {
    console.error(e);

    return Response.json({ message: 'Saving failed.' }, { status: 500 });
  }
};

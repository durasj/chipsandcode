import {
  AUTH_KEY,
  USER_DATA_KEY,
  UserData,
  Experiment,
  ExperimentRequest,
  experimentSchema,
} from '../../../src/lib/shared';

export const onRequestGet: BackendFunction<'id'> = async ({ data, params, env }) => {
  const { KV } = env;
  const { id } = params;

  const experiment = await KV.get<Experiment>(`experiment-${id}`, 'json');
  if (!experiment) {
    return Response.json({ message: 'Experiment not found.' }, { status: 404 });
  }

  if (experiment.visibility === 'PRIVATE' && !data[USER_DATA_KEY]?.experiments.find((e) => e.id)) {
    return Response.json(
      { message: 'Experiment is available only to the author.' },
      { status: !data[USER_DATA_KEY] ? 401 : 403 },
    );
  }

  return Response.json({ experiment });
};

export const onRequestPut: BackendFunction<'id'> = async ({ data, params, env, request }) => {
  const { KV } = env;
  const id = params.id as string;

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

  const experiment = await KV.get<Experiment>(`experiment-${id}`, 'json');
  if (!experiment) {
    return Response.json({ message: 'Experiment not found.' }, { status: 404 });
  }

  if (!data[USER_DATA_KEY]?.experiments.find((e) => e.id)) {
    return Response.json(
      { message: 'Experiment can be modified only by the author.' },
      { status: !data[USER_DATA_KEY] ? 401 : 403 },
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

    return Response.json({ experiment: updatedExperiment });
  } catch (e) {
    console.error(e);

    return Response.json({ message: 'Saving failed.' }, { status: 500 });
  }
};

export const onRequestDelete: BackendFunction<'id'> = async ({ data, params, env }) => {
  const { KV } = env;
  const { id } = params;

  const experiment = await KV.get<Experiment>(`experiment-${id}`, 'json');
  if (!experiment) {
    return Response.json({ message: 'Experiment not found.' }, { status: 404 });
  }

  if (!data[USER_DATA_KEY]?.experiments.find((e) => e.id)) {
    return Response.json(
      { message: 'Experiment can be modified only by the author.' },
      { status: !data[USER_DATA_KEY] ? 401 : 403 },
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

    return Response.json({ experiment });
  } catch (e) {
    console.error(e);

    return Response.json({ message: 'Deleting failed.' }, { status: 500 });
  }
};

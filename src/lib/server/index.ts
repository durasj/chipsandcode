import { Sunder, Router } from 'sunder';
import type { ContextData, Environment } from '../shared';

import authMiddleware from './middleware/auth';
import errorMiddleware from './middleware/error';
import corsMiddleware from './middleware/cors';
import addExperimentEndpoints from './endpoints/experiment';

const app = new Sunder<Environment>();
const router = new Router<Environment, ContextData>();

export type AppMiddleware = Parameters<typeof app.use>[0];
export type AppEndpoints = (r: typeof router) => void;

app.use(errorMiddleware);
app.use(corsMiddleware);
app.use(authMiddleware);

addExperimentEndpoints(router);
app.use(router.middleware);

export default {
  fetch(request: Request, env: Environment, ctx: FetchEvent) {
    return app.fetch(request, env, ctx);
  },
};

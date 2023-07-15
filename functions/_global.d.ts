import { ContextData, Environment } from '../src/lib/shared';

declare global {
  export type BackendFunction<Params extends string = ''> = (
    context: EventContext<Environment, Params, ContextData>,
  ) => Response | Promise<Response>;

  export type Middleware = (
    context: EventContext<Environment, '', ContextData>,
  ) => Response | Promise<Response>;
}

import { PagesFunction, Response } from '@cloudflare/workers-types';

import { Environment } from '../src/lib/shared';

export const onRequest: PagesFunction<Environment> = () => {
  return new Response('Hello, world!');
};

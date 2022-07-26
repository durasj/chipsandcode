import { parse, serialize } from 'cookie';

import {
  AUTH_KEY,
  generateRandom,
  HTTP_MUTATION_METHODS,
  type UserData,
  USER_DATA_KEY,
} from '../shared';
import type { AppMiddleware } from '..';

/**
 * Loads user data using cookie auth, creates anonymous users if the request is a mutation
 */
const authMiddleware: AppMiddleware = async (ctx, next) => {
  const { request, response, env } = ctx;
  const { KV } = env;

  const cookies = parse(request.get('Cookie') || '');

  // All requests that perform mutations must be authenticated
  let token = cookies?.[AUTH_KEY];
  if (!token) {
    if (!HTTP_MUTATION_METHODS.has(request.method)) {
      await next();
      return;
    }

    token = generateRandom(96);
  }
  response.set(
    'Set-Cookie',
    serialize(AUTH_KEY, token, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
    }),
  );

  // Verify token
  let user = await KV.get<UserData>(`user-${token}`, 'json');
  if (!user) {
    user = { name: 'Anonym', experiments: [] };
  }
  ctx.data[AUTH_KEY] = token;
  ctx.data[USER_DATA_KEY] = user;

  await next();
};

export default authMiddleware;

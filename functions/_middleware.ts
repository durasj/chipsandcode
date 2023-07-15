import { parse, serialize } from 'cookie';

import {
  AUTH_KEY,
  HTTP_MUTATION_METHODS,
  USER_DATA_KEY,
  UserData,
  generateRandom,
} from '../src/lib/shared';

/**
 * Catches errors
 */
const errorMiddleware: Middleware = async (context) => {
  try {
    return await context.next();
  } catch (e) {
    console.error(e);

    return Response.json({ message: 'Unexpected error' }, { status: 500 });
  }
};

/**
 * Handles user sessions
 */
const authMiddleware: Middleware = async (context) => {
  const { request, env } = context;
  const { KV } = env;

  const cookies = parse(request.headers.get('Cookie') || '');

  // All requests that perform mutations must be authenticated
  let token = cookies?.[AUTH_KEY];
  if (!token) {
    if (!HTTP_MUTATION_METHODS.has(request.method)) {
      return await context.next();
    }

    token = generateRandom(96);
  }
  request.headers.set(
    'Set-Cookie',
    serialize(AUTH_KEY, token, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: true,
    }),
  );

  // Verify token
  let user = await KV.get<UserData>(`user-${token}`, 'json');
  if (!user) {
    user = { name: 'Anonym', experiments: [] };
  }
  context.data[AUTH_KEY] = token;
  context.data[USER_DATA_KEY] = user;

  return await context.next();
};

export const onRequest = [errorMiddleware, authMiddleware];

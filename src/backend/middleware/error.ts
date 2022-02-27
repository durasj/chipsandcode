import type { AppMiddleware } from '..';
import createError from 'http-errors';

/**
 * Catches errors
 */
const errorMiddleware: AppMiddleware = async (ctx, next) => {
  const start = Date.now();

  try {
    await next();
  } catch (e) {
    if (createError.isHttpError(e) && e.expose) {
      ctx.response.status = e.statusCode || e.status || 500;
      ctx.response.body = {
        message: e.message,
        details: e.details,
      };
    } else {
      console.error(e);

      ctx.response.status = 500;
      ctx.response.body = { message: 'Unexpected error' };
    }
  }

  const ms = Date.now() - start;
  ctx.response.set('X-Response-Time', `${ms}ms`);
};

export default errorMiddleware;

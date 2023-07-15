import type { AppMiddleware } from '../index';

/**
 * Adds CORS headers if DOMAIN is set
 */
const authMiddleware: AppMiddleware = async (ctx, next) => {
  const { request, response, env } = ctx;
  const { DOMAIN } = env;

  if (DOMAIN) {
    response.set('Access-Control-Allow-Origin', `https://${DOMAIN}`);
    response.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,DELETE,OPTIONS');
    response.set('Access-Control-Allow-Credentials', 'true');
  }

  const requestedHeaders = request.get('Access-Control-Request-Headers');
  if (request.get('Origin') && requestedHeaders) {
    response.set('Access-Control-Allow-Headers', requestedHeaders);
  }

  if (request.method !== 'OPTIONS') await next();
};

export default authMiddleware;

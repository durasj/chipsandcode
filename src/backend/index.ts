import { Sunder, Router } from 'sunder';

const app = new Sunder();
const router = new Router();

// Example route with a named parameter
router.get('/hello/:username', ({ response, params }) => {
  response.body = `Hello ${decodeURI(params.username)}`;
});

// Example middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();

  const ms = Date.now() - start;
  ctx.response.set('X-Response-Time', `${ms}ms`);
});
app.use(router.middleware);

addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(app.handle(event));
});

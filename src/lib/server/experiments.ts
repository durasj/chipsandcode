import { createHash, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { getDatabase } from './database';
import { AUTH_KEY, experimentSchema, type Experiment } from '../shared';

export const sessionId = (token: string) => createHash('sha256').update(token).digest('hex');

function readSession(cookies: Cookies) {
  const token = cookies.get(AUTH_KEY);
  return token && /^[A-Za-z0-9_-]{64,256}$/.test(token) ? sessionId(token) : undefined;
}

function apiError(message: string, status: number, details?: unknown) {
  return Response.json({ message, ...(details ? { details } : {}) }, { status });
}

export async function experimentResponse(action: () => Promise<Response>) {
  try {
    return await action();
  } catch {
    console.error(
      'Experiment persistence request failed. Check database configuration and connectivity.',
    );
    return apiError('The experiment service is unavailable. Please try again later.', 503);
  }
}

export async function listExperiments(cookies: Cookies) {
  const owner = readSession(cookies);
  if (!owner) return Response.json({ experiments: [] });
  const sql = getDatabase();
  const rows = await sql`SELECT id, payload->>'name' AS name FROM cnc_experiments
    WHERE owner_id = ${owner} ORDER BY created_at, id`;
  return Response.json({ experiments: rows });
}

export async function readExperiment(id: string, cookies: Cookies) {
  const sql = getDatabase();
  const rows = await sql`SELECT owner_id, payload FROM cnc_experiments WHERE id = ${id}`;
  const row = rows[0];
  if (!row) return apiError('Experiment not found.', 404);
  const owner = readSession(cookies);
  if (row.payload.visibility === 'PRIVATE' && row.owner_id !== owner) {
    return apiError('Experiment is available only to the author.', owner ? 403 : 401);
  }
  return Response.json(
    { experiment: row.payload },
    {
      headers: { 'Cache-Control': 'private, no-store' },
    },
  );
}

export async function saveExperiment(request: Request, cookies: Cookies, id?: string) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Request body must be valid JSON.', 400);
  }
  const validation = experimentSchema.safeParse(body);
  if (!validation.success)
    return apiError('Experiment data are invalid.', 400, validation.error.issues);

  const sql = getDatabase();
  let owner = readSession(cookies);
  const now = new Date().toISOString();
  if (id) {
    if (!owner) return apiError('Experiment can be modified only by the author.', 401);
    const rows = await sql`UPDATE cnc_experiments
      SET payload = payload || ${JSON.stringify({ ...validation.data, updated: now })}::jsonb,
        updated_at = ${now}
      WHERE id = ${id} AND owner_id = ${owner} RETURNING payload`;
    if (!rows.length) return apiError('Experiment not found or not owned by you.', 404);
    return Response.json({ experiment: rows[0].payload });
  }

  // Only reuse a known session. An unrecognised client token must not choose a new identity.
  const known = owner ? await sql`SELECT id FROM cnc_sessions WHERE id = ${owner}` : [];
  const token = !known.length ? randomBytes(96).toString('base64url') : undefined;
  if (token) owner = sessionId(token);
  const experiment: Experiment = {
    ...validation.data,
    id: randomBytes(24).toString('base64url'),
    created: now,
  };
  await sql.transaction([
    sql`INSERT INTO cnc_sessions (id) VALUES (${owner!}) ON CONFLICT (id) DO NOTHING`,
    sql`INSERT INTO cnc_experiments (id, owner_id, payload)
      VALUES (${experiment.id}, ${owner!}, ${JSON.stringify(experiment)}::jsonb)`,
  ]);
  // Set identity only after the transaction succeeds. Legacy cookies keep working on the same domain.
  if (token)
    cookies.set(AUTH_KEY, token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: new URL(request.url).protocol === 'https:',
      maxAge: 60 * 60 * 24 * 365,
    });
  return Response.json({ experiment });
}

export async function deleteExperiment(id: string, cookies: Cookies) {
  const owner = readSession(cookies);
  if (!owner) return apiError('Experiment can be deleted only by the author.', 401);
  const sql = getDatabase();
  const rows = await sql`DELETE FROM cnc_experiments WHERE id = ${id}
    AND owner_id = ${owner} RETURNING payload`;
  if (!rows.length) return apiError('Experiment not found or not owned by you.', 404);
  return Response.json({ experiment: rows[0].payload });
}

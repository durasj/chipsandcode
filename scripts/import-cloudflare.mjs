import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { prepareImport } from './lib/legacy-data.mjs';

const file = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
if (!file) throw new Error('Usage: npm run data:import -- <export.json> [--apply]');
const prepared = prepareImport(JSON.parse(await readFile(file, 'utf8')));
console.log(
  `Validated ${prepared.sessions.length} sessions and ${prepared.experiments.length} experiments.`,
);
if (!process.argv.includes('--apply')) {
  console.log('Dry run complete. No database writes. Use --apply after verifying the destination.');
} else {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL locally.');
  const sql = neon(process.env.DATABASE_URL);
  const [counts] = await sql`SELECT (SELECT count(*) FROM cnc_sessions)::int AS sessions,
    (SELECT count(*) FROM cnc_experiments)::int AS experiments`;
  if (counts.sessions || counts.experiments)
    throw new Error('Import requires empty target tables. No existing data will be overwritten.');
  await sql.transaction([
    ...prepared.sessions.map(
      (session) => sql`INSERT INTO cnc_sessions (id, name) VALUES (${session.id}, ${session.name})`,
    ),
    ...prepared.experiments.map(
      ({
        ownerId,
        payload,
      }) => sql`INSERT INTO cnc_experiments (id, owner_id, payload, created_at, updated_at)
      VALUES (${payload.id}, ${ownerId}, ${JSON.stringify(payload)}::jsonb, ${payload.created}, ${payload.updated || null})`,
    ),
  ]);
  // Verify every record's owner and complete payload, not merely the number of rows.
  const rows = await sql`SELECT id, owner_id, payload FROM cnc_experiments`;
  const expected = new Map(prepared.experiments.map((item) => [item.payload.id, item]));
  const canonical = (v) => JSON.stringify(v, Object.keys(v).sort());
  if (
    rows.length !== expected.size ||
    rows.some((row) => {
      const item = expected.get(row.id);
      return (
        !item || row.owner_id !== item.ownerId || canonical(row.payload) !== canonical(item.payload)
      );
    })
  )
    throw new Error(
      'Post-import verification failed. Keep Cloudflare live and investigate the destination.',
    );
  console.log(
    `Imported and verified ${rows.length} experiments. Session tokens are stored only as SHA-256 hashes.`,
  );
}

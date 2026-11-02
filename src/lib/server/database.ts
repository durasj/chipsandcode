import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { DATABASE_URL } from '$app/env/private';

let database: NeonQueryFunction<false, false> | undefined;

export function getDatabase() {
  if (!DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return (database ??= neon(DATABASE_URL));
}

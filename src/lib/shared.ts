import type { KVNamespace } from '@cloudflare/workers-types';
import { z } from 'zod';

export const experimentSchema = z.object({
  name: z.string(),
  type: z.enum(['HARDWARE']),
  code: z.string().describe('HDL code'),
  tests: z.string().describe('Test script'),
  compare: z.string().describe('Expected test script output'),
  visibility: z.enum(['PRIVATE', 'PUBLIC']),
});

export type ExperimentRequest = z.infer<typeof experimentSchema>;
export type Experiment = ExperimentRequest & {
  id: string;
  created: string;
  updated?: string;
};

export const AUTH_KEY = 'auth';
export const USER_DATA_KEY = 'user';
export const HTTP_MUTATION_METHODS = new Set(['POST', 'PUT', 'DELETE']);

export type Environment = {
  KV: KVNamespace;
  ENVIRONMENT: 'dev' | 'production';
  DOMAIN?: string;
};

export type UserData = {
  name: string;
  experiments: { id: string; name: string }[];
};

export type ContextData = {
  [AUTH_KEY]?: string;
  [USER_DATA_KEY]?: UserData;
};

export type ErrorResponse = {
  message?: string;
  details?: unknown;
  code?: unknown;
};

/**
 * Generates random alphanumeric (plus dash -) string of requested length
 */
export const generateRandom = (bytes: number) =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes)))).replaceAll(
    /[/=+]/g,
    '-',
  );

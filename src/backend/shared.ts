export const AUTH_KEY = 'auth';
export const USER_DATA_KEY = 'user';
export const HTTP_MUTATION_METHODS = new Set(['POST', 'PUT', 'DELETE']);

export type Environment = {
  KV: KVNamespace;
};

export type UserData = {
  name: string;
  experiments: string[];
};

export type ContextData = {
  [AUTH_KEY]?: string;
  [USER_DATA_KEY]?: UserData;
};

export const generateRandom = (bytes: number) =>
  btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes))));

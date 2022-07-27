/* eslint-disable @typescript-eslint/no-empty-interface */
/// <reference types="@sveltejs/kit" />
/// <reference types="@sveltejs/adapter-cloudflare" />

declare namespace App {
  interface Locals {}

  interface Platform {
    env: {
      KV: KVNamespace;
      ENVIRONMENT: 'dev' | 'production';
    };
    context: {
      waitUntil(promise: Promise<unknown>): void;
    };
    caches: CacheStorage & { default: Cache };
  }

  interface Session {}

  interface Stuff {}
}

declare module '*.ne' {
  import { CompiledRules } from 'nearley';

  const rules: CompiledRules;
  export default rules;
}

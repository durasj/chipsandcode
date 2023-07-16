/* eslint-disable @typescript-eslint/no-empty-interface */
/// <reference types="@sveltejs/kit" />

declare module '*.ne' {
  import { CompiledRules } from 'nearley';

  const rules: CompiledRules;
  export default rules;
}

declare module 'virtual:pwa-*' {
  export const pwaInfo: { webManifest: { linkTag: unknown } };

  export const registerSW: (options: unknown) => { manifest: unknown };
}

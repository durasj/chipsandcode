/* eslint-disable @typescript-eslint/no-empty-interface */
/// <reference types="@sveltejs/kit" />

declare module '*.ne' {
  import { CompiledRules } from 'nearley';

  const rules: CompiledRules;
  export default rules;
}

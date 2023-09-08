import type { Experiment } from 'src/lib/shared';

const exampleFiles = import.meta.glob<true, string, { default: Experiment }>('./*.ts', {
  eager: true,
});

const examples = Object.values(exampleFiles)
  .map((m) => m.default)
  .filter((example) => example?.id);

export default examples;

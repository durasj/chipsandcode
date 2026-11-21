import type { Experiment } from '#src/lib/shared.js';
export default {
  id: 'Computer',
  name: 'Computer',
  code: 'CHIP Probe {\n  IN reset;\n  PARTS:\n  Computer(reset=reset);\n}',
  tests: '',
  compare: '',
  type: 'HARDWARE',
  visibility: 'PUBLIC',
  created: '2026-11-21T00:00:00Z',
} satisfies Experiment;

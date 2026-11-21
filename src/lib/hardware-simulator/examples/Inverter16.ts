import type { Experiment } from '#src/lib/shared.js';
export default {
  id: 'Inverter16',
  name: '16-bit inverter',
  code: 'CHIP Probe {\n  IN in[16];\n  OUT out[16];\n  PARTS:\n  Not16(in=in, out=out);\n}',
  tests: '',
  compare: '',
  type: 'HARDWARE',
  visibility: 'PUBLIC',
  created: '2026-11-21T00:00:00Z',
} satisfies Experiment;

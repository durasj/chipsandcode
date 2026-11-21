import type { Experiment } from '#src/lib/shared.js';
export default {
  id: 'Register',
  name: 'Register',
  code: 'CHIP Probe {\n  IN in[16], load;\n  OUT out[16];\n  PARTS:\n  Register(in=in, load=load, out=out);\n}',
  tests: '',
  compare: '',
  type: 'HARDWARE',
  visibility: 'PUBLIC',
  created: '2026-11-21T00:00:00Z',
} satisfies Experiment;

import type { Experiment } from '#src/lib/shared.js';
export default {
  id: 'ALU',
  name: 'ALU',
  code: 'CHIP Probe {\n  IN x[16], y[16], zx, nx, zy, ny, f, no;\n  OUT out[16], zr, ng;\n  PARTS:\n  ALU(x=x, y=y, zx=zx, nx=nx, zy=zy, ny=ny, f=f, no=no, out=out, zr=zr, ng=ng);\n}',
  tests: '',
  compare: '',
  type: 'HARDWARE',
  visibility: 'PUBLIC',
  created: '2026-11-21T00:00:00Z',
} satisfies Experiment;

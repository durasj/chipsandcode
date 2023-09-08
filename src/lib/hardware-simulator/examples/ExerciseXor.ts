import type { Experiment } from 'src/lib/shared';

export default {
  id: 'ExerciseXor',
  name: 'Exercise - Xor',
  code: `/**
 * Xor gate
 *
 * If a!=b then out=1 else out=0.
 */
CHIP Xor {
    IN a, b;
    OUT out;

    // Add PARTS:
}
`,
  compare: `|   a   |   b   |  out  |
|   0   |   0   |   0   |
|   0   |   1   |   1   |
|   1   |   0   |   1   |
|   1   |   1   |   0   |`,
  tests: `output-list a%B3.1.3 b%B3.1.3 out%B3.1.3;

set a 0,
set b 0,
eval,
output;

set a 0,
set b 1,
eval,
output;

set a 1,
set b 0,
eval,
output;

set a 1,
set b 1,
eval,
output;
`,
  type: 'HARDWARE',
  visibility: 'PUBLIC',
  created: '2023-09-07T19:23:43.411Z',
} satisfies Experiment;

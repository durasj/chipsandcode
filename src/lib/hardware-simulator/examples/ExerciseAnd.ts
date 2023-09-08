import type { Experiment } from 'src/lib/shared';

export default {
  id: 'ExerciseAnd',
  name: 'Exercise - And',
  code: `/**
 * Not gate
 *
 * If a=b=1 then out=1 else out=0.
 */
CHIP And {
    IN a, b;
    OUT out;

    // Add PARTS:
    // Hint: Think negative
}
`,
  compare: `|   a   |   b   |  out  |
|   0   |   0   |   0   |
|   0   |   1   |   0   |
|   1   |   0   |   0   |
|   1   |   1   |   1   |`,
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

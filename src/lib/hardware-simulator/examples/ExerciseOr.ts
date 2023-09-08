import type { Experiment } from 'src/lib/shared';

export default {
  id: 'ExerciseOr',
  name: 'Exercise - Or',
  code: `/**
 * Or gate
 *
 * If a=b=0 then out=0 else out=1.
 */
CHIP Or {
    IN a, b;
    OUT out;

    // Add PARTS:
}
`,
  compare: `|   a   |   b   |  out  |
|   0   |   0   |   0   |
|   0   |   1   |   1   |
|   1   |   0   |   1   |
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

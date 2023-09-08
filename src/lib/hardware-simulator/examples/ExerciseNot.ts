import type { Experiment } from 'src/lib/shared';

export default {
  id: 'ExerciseNot',
  name: 'Exercise - Not',
  code: `/**
 * Not gate
 *
 * If in=0 then out=1 else out=0.
 */
CHIP Not {
    IN in;
    OUT out;

    // Add PARTS:
    // Hint: Think positive
    // Hint: Use one Nand()
}
`,
  compare: `|  in   |  out  |
|   0   |   1   |
|   1   |   0   |`,
  tests: `output-list in%B3.1.3 out%B3.1.3;

set in 0,
eval,
output;

set in 1,
eval,
output;
`,
  type: 'HARDWARE',
  visibility: 'PUBLIC',
  created: '2023-09-07T19:23:43.411Z',
} satisfies Experiment;

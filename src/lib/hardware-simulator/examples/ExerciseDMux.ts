import type { Experiment } from 'src/lib/shared';

export default {
  id: 'ExerciseDMux',
  name: 'Exercise - Demultiplexor',
  code: `/**
 * DMux gate
 *
 * If sel=0 then {a=in, b=0} else {a=0, b=in}.
 */
CHIP DMux {
    IN in, sel;
    OUT a, b;

    // Add PARTS:
}
`,
  compare: `|  in   |  sel  |   a   |   b   |
|   0   |   0   |   0   |   0   |
|   0   |   1   |   0   |   0   |
|   1   |   0   |   1   |   0   |
|   1   |   1   |   0   |   1   |`,
  tests: `output-list in%B3.1.3 sel%B3.1.3 a%B3.1.3 b%B3.1.3;

set in 0,
set sel 0,
eval,
output;

set sel 1,
eval,
output;

set in 1,
set sel 0,
eval,
output;

set sel 1,
eval,
output;
`,
  type: 'HARDWARE',
  visibility: 'PUBLIC',
  created: '2023-09-07T19:23:43.411Z',
} satisfies Experiment;

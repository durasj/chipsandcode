import type { Experiment } from 'src/lib/shared';

export default {
  id: 'BuiltinNand',
  name: 'Built-in - Nand',
  code: `/**
 * Nand - NOT AND gate
 *
 * Outputs 0 only if both inputs are 1
 * Else outputs 1
 */
CHIP Nand {
    IN a, b;
    OUT out;

    BUILTIN Nand;
}
`,
  compare: `|   a   |   b   |  out  |
|   0   |   0   |   1   |
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

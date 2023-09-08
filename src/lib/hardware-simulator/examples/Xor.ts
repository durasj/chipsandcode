import type { Experiment } from 'src/lib/shared';

export default {
  id: 'Xor',
  name: 'Xor Gate',
  code: `/**
 * XOR - Exclusive OR gate
 *
 * Outputs 1 only if both inputs differ
 * Else outputs 0
 */
CHIP Xor {
    IN a, b;
    OUT out;

    PARTS:
    Not(in=a, out=nota);
    Not(in=b, out=notb);
    And(a=a, b=notb, out=w1);
    And(a=nota, b=b, out=w2);
    Or(a=w1, b=w2, out=out);
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
  created: '2022-05-10T19:23:43.411Z',
} satisfies Experiment;

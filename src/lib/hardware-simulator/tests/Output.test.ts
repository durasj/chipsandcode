import { describe, expect, it } from 'vitest';

import Output from './Output';
import type { OutputSpecNode } from 'src/lib/editor/tst/tree';

const outputSpec = [
  {
    format: 'B',
    length: 1,
    name: {
      col: 13,
      line: 9,
      type: 'identifier',
      value: 'a',
    },
    padLeft: 3,
    padRight: 3,
    type: 'outputSpec',
  },
  {
    format: 'B',
    length: 1,
    name: {
      col: 22,
      line: 9,
      type: 'identifier',
      value: 'b',
    },
    padLeft: 3,
    padRight: 3,
    type: 'outputSpec',
  },
  {
    format: 'B',
    length: 1,
    name: {
      col: 31,
      line: 9,
      type: 'identifier',
      value: 'out',
    },
    padLeft: 3,
    padRight: 3,
    type: 'outputSpec',
  },
] satisfies OutputSpecNode[];

describe('API call abstraction', () => {
  it('Allows adding and getting rows', async () => {
    const output = new Output([]);

    output.addRow([true, false, true]);

    expect(output.getRow(0)).toStrictEqual([true, false, true]);
  });

  it('Formats without any rows', () => {
    expect(new Output([]).getText()).toBe('||');

    expect(new Output(outputSpec).getText()).toBe('|   a   |   b   |  out  |');
  });

  it('Formats with defined rows', () => {
    const output = new Output(outputSpec);

    output.addRow([false, false, true]);
    output.addRow([true, false, true]);

    expect(output.getText()).toBe(`|   a   |   b   |  out  |
|   0   |   0   |   1   |
|   1   |   0   |   1   |`);
  });

  it('Can be created from existing output text', () => {
    const output = Output.fromText(`|   a   |   b   |  out  |
    |   0   |   0   |   1   |
    |   1   |   0   |   1   |`);

    expect(output.getRow(0)).toStrictEqual([false, false, true]);
    expect(output.getRow(1)).toStrictEqual([true, false, true]);

    expect(output.getText()).toBe(`| a | b |out|
| 0 | 0 | 1 |
| 1 | 0 | 1 |`);
  });
});

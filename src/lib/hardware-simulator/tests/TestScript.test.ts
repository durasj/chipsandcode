import { describe, expect, it, vi } from 'vitest';

import TestScript from './TestScript';
import AndChip from '../chips/builtin/AndChip';
import type { OutputListNode, Root } from 'src/lib/editor/tst/tree';

const andTst = {
  cases: [
    [
      {
        col: 1,
        line: 11,
        name: {
          col: 5,
          line: 11,
          type: 'identifier',
          value: 'a',
        },
        type: 'set',
        value: 0,
      },
      {
        col: 1,
        line: 12,
        name: {
          col: 5,
          line: 12,
          type: 'identifier',
          value: 'b',
        },
        type: 'set',
        value: 0,
      },
      {
        col: 1,
        line: 13,
        type: 'eval',
      },
      {
        col: 1,
        line: 14,
        type: 'output',
      },
    ],
    [
      {
        col: 1,
        line: 16,
        name: {
          col: 5,
          line: 16,
          type: 'identifier',
          value: 'a',
        },
        type: 'set',
        value: 0,
      },
      {
        col: 1,
        line: 17,
        name: {
          col: 5,
          line: 17,
          type: 'identifier',
          value: 'b',
        },
        type: 'set',
        value: 1,
      },
      {
        col: 1,
        line: 18,
        type: 'eval',
      },
      {
        col: 1,
        line: 19,
        type: 'output',
      },
    ],
    [
      {
        col: 1,
        line: 21,
        name: {
          col: 5,
          line: 21,
          type: 'identifier',
          value: 'a',
        },
        type: 'set',
        value: 1,
      },
      {
        col: 1,
        line: 22,
        name: {
          col: 5,
          line: 22,
          type: 'identifier',
          value: 'b',
        },
        type: 'set',
        value: 0,
      },
      {
        col: 1,
        line: 23,
        type: 'eval',
      },
      {
        col: 1,
        line: 24,
        type: 'output',
      },
    ],
    [
      {
        col: 1,
        line: 26,
        name: {
          col: 5,
          line: 26,
          type: 'identifier',
          value: 'a',
        },
        type: 'set',
        value: 1,
      },
      {
        col: 1,
        line: 27,
        name: {
          col: 5,
          line: 27,
          type: 'identifier',
          value: 'b',
        },
        type: 'set',
        value: 1,
      },
      {
        col: 1,
        line: 28,
        type: 'eval',
      },
      {
        col: 1,
        line: 29,
        type: 'output',
      },
    ],
  ],
  preamble: [
    {
      file: {
        col: 6,
        line: 6,
        type: 'identifier',
        value: 'And.hdl',
      },
      type: 'load',
    },
    {
      file: {
        col: 13,
        line: 7,
        type: 'identifier',
        value: 'And.out',
      },
      type: 'output',
    },
    {
      file: {
        col: 12,
        line: 8,
        type: 'identifier',
        value: 'And.cmp',
      },
      type: 'compare',
    },
    {
      outputs: [
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
      ],
      type: 'outputList',
    },
  ],
  type: 'script',
} satisfies Root;

const outputSpec = andTst.preamble.find(({ type }) => type === 'outputList') as OutputListNode;

const expectedAndOut = `|   a   |   b   |  out  |
|   0   |   0   |   0   |
|   0   |   1   |   0   |
|   1   |   0   |   0   |
|   1   |   1   |   1   |`;

const brokenAndOut = `|   a   |   b   |  out  |
|   1   |   0   |   0   |
|   0   |   1   |
|   1   |   0   |   0   |`;

describe('API call abstraction', () => {
  it('Runs empty script', async () => {
    const output = new TestScript([], []);

    const result = output.run(new AndChip(), '', () => 0);

    expect(result).toStrictEqual([]);
  });

  it('Calls side effect on output', async () => {
    const output = new TestScript(outputSpec.outputs, andTst.cases);

    const onOutput = vi.fn();

    const result = output.run(new AndChip(), expectedAndOut, onOutput);

    expect(result).toMatchSnapshot();

    expect(onOutput).toHaveBeenCalledTimes(4);
    expect(onOutput).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        output: `|   a   |   b   |  out  |
|   0   |   0   |   0   |`,
        type: 'output',
      }),
    );
    expect(onOutput).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        output: `|   a   |   b   |  out  |
|   0   |   0   |   0   |
|   0   |   1   |   0   |`,
        type: 'output',
      }),
    );
    expect(onOutput).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        output: `|   a   |   b   |  out  |
|   0   |   0   |   0   |
|   0   |   1   |   0   |
|   1   |   0   |   0   |`,
        type: 'output',
      }),
    );
    expect(onOutput).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        output: expectedAndOut,
        type: 'output',
      }),
    );
  });

  it('Can be created from TST AST', () => {
    const output = TestScript.fromAST(andTst);

    const result = output.run(new AndChip(), '', () => 0);

    expect(result).toMatchSnapshot();
  });

  it('Return error if values, or number of rows/columns do not match', () => {
    const output = TestScript.fromAST(andTst);

    const result = output.run(new AndChip(), brokenAndOut, () => 0);

    expect(result).toMatchSnapshot();
  });

  // TODO: Add testing on all Project 1 files (.tst .cmp and .out)
});

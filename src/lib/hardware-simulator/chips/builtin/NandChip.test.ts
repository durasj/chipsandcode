import { describe, expect, it } from 'vitest';

import NandChip from './NandChip';

describe('Nand Chip', () => {
  it('Provides interface info', async () => {
    const chip = new NandChip();

    expect(chip.name).toBe('Nand');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new NandChip();

    const values = [
      [[false], [false], [true]],
      [[true], [false], [true]],
      [[false], [true], [true]],
      [[true], [true], [false]],
    ];

    values.forEach(([a, b, out]) => {
      chip.setInput('a', a);
      chip.setInput('b', b);
      chip.run();
      expect(chip.getOutput()).toStrictEqual(out);
    });
  });
});

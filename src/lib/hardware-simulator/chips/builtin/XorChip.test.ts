import { describe, expect, it } from 'vitest';

import XorChip from './XorChip';

describe('Xor Chip', () => {
  it('Provides interface info', async () => {
    const chip = new XorChip();

    expect(chip.name).toBe('Xor');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new XorChip();

    const values = [
      [[false], [false], [false]],
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

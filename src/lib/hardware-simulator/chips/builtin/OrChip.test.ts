import { describe, expect, it } from 'vitest';

import OrChip from './OrChip';

describe('Or Chip', () => {
  it('Provides interface info', async () => {
    const chip = new OrChip();

    expect(chip.name).toBe('Or');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new OrChip();

    const values = [
      [[false], [false], [false]],
      [[true], [false], [true]],
      [[false], [true], [true]],
      [[true], [true], [true]],
    ];

    values.forEach(([a, b, out]) => {
      chip.setInput('a', a);
      chip.setInput('b', b);
      chip.run();
      expect(chip.getOutput()).toStrictEqual(out);
    });
  });
});

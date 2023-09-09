import { describe, expect, it } from 'vitest';

import MuxChip from './MuxChip';

describe('Mux Chip', () => {
  it('Provides interface info', async () => {
    const chip = new MuxChip();

    expect(chip.name).toBe('Mux');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new MuxChip();

    const values = [
      [[false], [false], [false], [false]],
      [[true], [false], [false], [true]],
      [[false], [true], [false], [false]],
      [[true], [true], [false], [true]],
      [[false], [false], [true], [false]],
      [[true], [false], [true], [false]],
      [[false], [true], [true], [true]],
      [[true], [true], [true], [true]],
    ];

    values.forEach(([a, b, sel, out]) => {
      chip.setInput('a', a);
      chip.setInput('b', b);
      chip.setInput('sel', sel);
      chip.run();

      expect(chip.getOutput()).toStrictEqual(out);
    });
  });
});

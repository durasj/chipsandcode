import { describe, expect, it } from 'vitest';

import Mux4WayChip from './Mux4WayChip';

describe('Mux4Way Chip', () => {
  it('Provides interface info', async () => {
    const chip = new Mux4WayChip();

    expect(chip.name).toBe('Mux4Way');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new Mux4WayChip();

    const values = [
      [[false], [false], [false], [false], [false, false], [false]],
      [[true], [false], [false], [false], [false, false], [true]],
      [[false], [true], [false], [false], [false, true], [true]],
      [[true], [false], [false], [false], [false, true], [false]],
      [[false], [false], [true], [false], [true, false], [true]],
      [[true], [false], [false], [false], [true, false], [false]],
      [[false], [true], [true], [true], [true, true], [true]],
      [[true], [true], [false], [false], [true, true], [false]],
    ];

    values.forEach(([a, b, c, d, sel, out]) => {
      chip.setInput('a', a);
      chip.setInput('b', b);
      chip.setInput('c', c);
      chip.setInput('d', d);
      chip.setInput('sel', sel);
      chip.run();

      expect(chip.getOutput()).toStrictEqual(out);
    });
  });
});

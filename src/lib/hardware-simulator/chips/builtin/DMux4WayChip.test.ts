import { describe, expect, it } from 'vitest';

import DMux4WayChip from './DMux4WayChip';

describe('DMux4Way Chip', () => {
  it('Provides interface info', async () => {
    const chip = new DMux4WayChip();

    expect(chip.name).toBe('DMux4Way');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new DMux4WayChip();

    const values = [
      [[false], [false, false], [false], [false], [false], [false]],
      [[true], [false, false], [true], [false], [false], [false]],
      [[false], [false, true], [false], [false], [false], [false]],
      [[true], [false, true], [false], [true], [false], [false]],
      [[false], [true, false], [false], [false], [false], [false]],
      [[true], [true, false], [false], [false], [true], [false]],
      [[false], [true, true], [false], [false], [false], [false]],
      [[true], [true, true], [false], [false], [false], [true]],
    ];

    values.forEach(([input, sel, a, b, c, d]) => {
      chip.setInput('in', input);
      chip.setInput('sel', sel);
      chip.run();

      expect(chip.getOutput('a')).toStrictEqual(a);
      expect(chip.getOutput('b')).toStrictEqual(b);
      expect(chip.getOutput('c')).toStrictEqual(c);
      expect(chip.getOutput('d')).toStrictEqual(d);
    });
  });
});

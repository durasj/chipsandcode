import { describe, expect, it } from 'vitest';

import DMuxChip from './DMuxChip';

describe('DMux Chip', () => {
  it('Provides interface info', async () => {
    const chip = new DMuxChip();

    expect(chip.name).toBe('DMux');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new DMuxChip();

    const values = [
      [[false], [false], [false], [false]],
      [[true], [false], [true], [false]],
      [[false], [false], [false], [false]],
      [[true], [false], [true], [false]],
      [[false], [true], [false], [false]],
      [[true], [true], [false], [true]],
      [[false], [true], [false], [false]],
      [[true], [true], [false], [true]],
    ];

    values.forEach(([input, sel, a, b]) => {
      chip.setInput('in', input);
      chip.setInput('sel', sel);
      chip.run();

      expect(chip.getOutput('a')).toStrictEqual(a);
      expect(chip.getOutput('b')).toStrictEqual(b);
    });
  });
});

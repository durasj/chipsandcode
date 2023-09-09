import { describe, expect, it } from 'vitest';

import Or8WayChip from './Or8WayChip';

describe('Or8Way Chip', () => {
  it('Provides interface info', async () => {
    const chip = new Or8WayChip();

    expect(chip.name).toBe('Or8Way');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new Or8WayChip();

    const values = [
      [[false, false, false, false, false, false, false, false], [false]],
      [[false, true, false, false, false, false, false, false], [true]],
      [[false, true, false, false, false, false, false, true], [true]],
      [[true, false, false, false, false, false, false, false], [true]],
      [[true, true, true, true, true, true, true, true], [true]],
    ];

    values.forEach(([input, out]) => {
      chip.setInput('in', input);
      chip.run();
      expect(chip.getOutput()).toStrictEqual(out);
    });
  });
});

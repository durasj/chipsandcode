import { describe, expect, it } from 'vitest';

import NotChip from './NotChip';

describe('Not Chip', () => {
  it('Provides interface info', async () => {
    const chip = new NotChip();

    expect(chip.name).toBe('Not');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new NotChip();

    const values = [
      [[false], [true]],
      [[true], [false]],
    ];

    values.forEach(([input, out]) => {
      chip.setInput('in', input);
      chip.run();
      expect(chip.getOutput()).toStrictEqual(out);
    });
  });
});

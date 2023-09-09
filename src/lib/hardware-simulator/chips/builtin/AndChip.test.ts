import { describe, expect, it } from 'vitest';

import AndChip from './AndChip';

describe('And Chip', () => {
  it('Provides interface info', async () => {
    const chip = new AndChip();

    expect(chip.name).toBe('And');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new AndChip();

    const values = [
      [[false], [false], [false]],
      [[true], [false], [false]],
      [[false], [true], [false]],
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

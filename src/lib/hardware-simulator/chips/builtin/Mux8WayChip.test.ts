import { describe, expect, it } from 'vitest';

import Mux8WayChip from './Mux8WayChip';

describe('Mux8Way Chip', () => {
  it('Provides interface info', async () => {
    const chip = new Mux8WayChip();

    expect(chip.name).toBe('Mux8Way');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new Mux8WayChip();

    const values = [
      [
        [false],
        [true],
        [false],
        [true],
        [false],
        [true],
        [false],
        [true],
        [false, false, false],
        [false],
      ],
      [
        [true],
        [false],
        [false],
        [false],
        [false],
        [true],
        [false],
        [true],
        [false, false, false],
        [true],
      ],
      [
        [false],
        [true],
        [false],
        [false],
        [false],
        [true],
        [false],
        [true],
        [false, false, true],
        [true],
      ],
      [
        [true],
        [false],
        [false],
        [false],
        [false],
        [true],
        [false],
        [true],
        [false, false, true],
        [false],
      ],
      [
        [false],
        [false],
        [true],
        [false],
        [false],
        [true],
        [false],
        [true],
        [false, true, false],
        [true],
      ],
      [
        [true],
        [false],
        [false],
        [false],
        [false],
        [true],
        [false],
        [true],
        [false, true, false],
        [false],
      ],
      [
        [false],
        [true],
        [true],
        [true],
        [false],
        [true],
        [false],
        [true],
        [false, true, true],
        [true],
      ],
      [
        [true],
        [true],
        [false],
        [false],
        [false],
        [true],
        [false],
        [true],
        [false, true, true],
        [false],
      ],
      [
        [false],
        [false],
        [false],
        [false],
        [false],
        [true],
        [false],
        [true],
        [true, false, false],
        [false],
      ],
      [
        [true],
        [false],
        [false],
        [false],
        [true],
        [true],
        [false],
        [true],
        [true, false, false],
        [true],
      ],
      [
        [false],
        [true],
        [false],
        [false],
        [false],
        [true],
        [false],
        [true],
        [true, false, true],
        [true],
      ],
      [
        [true],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [true],
        [true, false, true],
        [false],
      ],
      [
        [false],
        [false],
        [true],
        [false],
        [false],
        [true],
        [true],
        [true],
        [true, true, false],
        [true],
      ],
      [
        [true],
        [false],
        [false],
        [false],
        [false],
        [true],
        [false],
        [true],
        [true, true, false],
        [false],
      ],
      [
        [false],
        [true],
        [true],
        [true],
        [false],
        [true],
        [false],
        [true],
        [true, true, true],
        [true],
      ],
      [
        [true],
        [true],
        [false],
        [false],
        [false],
        [true],
        [false],
        [false],
        [true, true, true],
        [false],
      ],
    ];

    values.forEach(([a, b, c, d, e, f, g, h, sel, out]) => {
      chip.setInput('a', a);
      chip.setInput('b', b);
      chip.setInput('c', c);
      chip.setInput('d', d);
      chip.setInput('e', e);
      chip.setInput('f', f);
      chip.setInput('g', g);
      chip.setInput('h', h);
      chip.setInput('sel', sel);
      chip.run();

      expect(chip.getOutput()).toStrictEqual(out);
    });
  });
});

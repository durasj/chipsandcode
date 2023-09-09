import { describe, expect, it } from 'vitest';

import DMux8WayChip from './DMux8WayChip';

describe('DMux8Way Chip', () => {
  it('Provides interface info', async () => {
    const chip = new DMux8WayChip();

    expect(chip.name).toBe('DMux8Way');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new DMux8WayChip();

    const values = [
      [
        [false],
        [false, false, false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [true],
        [false, false, false],
        [true],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [false],
        [false, false, true],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [true],
        [false, false, true],
        [false],
        [true],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [false],
        [false, true, false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [true],
        [false, true, false],
        [false],
        [false],
        [true],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [false],
        [false, true, true],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [true],
        [false, true, true],
        [false],
        [false],
        [false],
        [true],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [false],
        [true, false, false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [true],
        [true, false, false],
        [false],
        [false],
        [false],
        [false],
        [true],
        [false],
        [false],
        [false],
      ],
      [
        [false],
        [true, false, true],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [true],
        [true, false, true],
        [false],
        [false],
        [false],
        [false],
        [false],
        [true],
        [false],
        [false],
      ],
      [
        [false],
        [true, true, false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [true],
        [true, true, false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [true],
        [false],
      ],
      [
        [false],
        [true, true, true],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
      ],
      [
        [true],
        [true, true, true],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [false],
        [true],
      ],
    ];

    values.forEach(([input, sel, a, b, c, d, e, f, g, h]) => {
      chip.setInput('in', input);
      chip.setInput('sel', sel);
      chip.run();

      expect(chip.getOutput('a')).toStrictEqual(a);
      expect(chip.getOutput('b')).toStrictEqual(b);
      expect(chip.getOutput('c')).toStrictEqual(c);
      expect(chip.getOutput('d')).toStrictEqual(d);
      expect(chip.getOutput('e')).toStrictEqual(e);
      expect(chip.getOutput('f')).toStrictEqual(f);
      expect(chip.getOutput('g')).toStrictEqual(g);
      expect(chip.getOutput('h')).toStrictEqual(h);
    });
  });
});

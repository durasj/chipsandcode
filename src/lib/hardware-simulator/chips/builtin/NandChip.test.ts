import { describe, expect, it } from 'vitest';

import NandChip from './NandChip';

describe('Nand Chip', () => {
  it('Provides interface info', async () => {
    const chip = new NandChip();

    expect(chip.name).toBe('Nand');
    expect(chip.getPins()).toMatchSnapshot();
  });

  it('Has correct logic', async () => {
    const chip = new NandChip();

    const values = [
      [false, false, true],
      [true, false, true],
      [false, true, true],
      [true, true, false],
    ];

    values.forEach(([a, b, out]) => {
      chip.setInput('a', a);
      chip.setInput('b', b);
      chip.run();
      expect(chip.getOutput('out')).toBe(out);
    });
  });

  it('Provides helpful error if setting input on an unknown pin', () => {
    const chip = new NandChip();

    // @ts-ignore We are testing incorrect input on purpose
    expect(() => chip.setInput('c', true)).toThrowError(
      `Input pin 'c' does not exist on 'Nand'. Input pins: a, b.`,
    );

    // @ts-ignore We are testing incorrect input on purpose
    expect(() => chip.setInput('out', true)).toThrowError(
      `Input pin 'out' does not exist on 'Nand'. Input pins: a, b.`,
    );
  });

  it('Provides helpful error if getting output from an unknown pin', () => {
    const chip = new NandChip();

    expect(() => chip.getOutput('b')).toThrowError(
      `Output pin 'b' does not exist on 'Nand'. Output pins: out.`,
    );

    expect(() => chip.getOutput('a')).toThrowError(
      `Output pin 'a' does not exist on 'Nand'. Output pins: out.`,
    );
  });
});

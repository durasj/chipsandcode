import { describe, expect, it } from 'vitest';

import type { ChipPin } from './Chip';
import type Chip from './Chip';
import NotChip from './builtin/NotChip';
import NandChip from './builtin/NandChip';
import CustomChip from './CustomChip';

const name = 'Foo';

const firstNot = new NotChip();
const secondNot = new NotChip();
const pins = new Map<string, ChipPin>([
  ['a', { state: false, type: 'input', connections: [[firstNot, 'in']] }],
  ['i1', { state: false, type: 'internal', connections: [[secondNot, 'in']] }],
  ['out', { state: false, type: 'output', connections: [] }],
]);
const parts = new Map<Chip, readonly [string, string][]>([
  [firstNot, [['out', 'i1']]],
  [secondNot, [['out', 'out']]],
]);

describe('Custom Chip', () => {
  it('Provides interface info', async () => {
    const chip = new CustomChip(name, pins, parts);

    expect(chip.name).toBe('Foo');
    expect(chip.getPins()).toStrictEqual(pins);
  });

  it('Allows setting inputs', async () => {
    const chip = new CustomChip(name, pins, parts);

    expect(chip.getPins().get('a')?.state).toBe(false);

    chip.setInput('a', true);

    expect(chip.getPins().get('a')?.state).toBe(true);
  });

  it('Provides output', async () => {
    const chip = new CustomChip(name, pins, parts);

    expect(chip.getOutput('out')).toBe(false);
  });

  it('Runs internal logic', async () => {
    const chip = new CustomChip(name, pins, parts);

    chip.setInput('a', false);
    chip.run();
    expect(chip.getOutput('out')).toBe(false);

    chip.setInput('a', true);
    chip.run();
    expect(chip.getOutput('out')).toBe(true);
  });

  it('Provides helpful error if setting input on an unknown pin', () => {
    const chip = new CustomChip(name, pins, parts);

    expect(() => chip.setInput('b', true)).toThrowError(
      `Input pin 'b' does not exist on 'Foo'. Input pins: a.`,
    );

    expect(() => chip.setInput('out', true)).toThrowError(
      `Input pin 'out' does not exist on 'Foo'. Input pins: a.`,
    );
  });

  it('Provides helpful error if getting output from an unknown pin', () => {
    const chip = new CustomChip(name, pins, parts);

    expect(() => chip.getOutput('b')).toThrowError(
      `Output pin 'b' does not exist on 'Foo'. Output pins: out.`,
    );

    expect(() => chip.getOutput('a')).toThrowError(
      `Output pin 'a' does not exist on 'Foo'. Output pins: out.`,
    );
  });

  it('Provides helpful error if pin connection is wrong', () => {
    const wrongParts = new Map(parts);
    wrongParts.set(firstNot, [['out', 'i2']]);

    const chip = new CustomChip(name, pins, wrongParts);

    expect(() => chip.run()).toThrowError(
      `Output pin 'out' is connected to a non-existing pin 'i2'`,
    );
  });

  it('Detects loops', () => {
    const wrongParts = new Map(parts);
    wrongParts.set(secondNot, [['out', 'i1']]);

    const chip = new CustomChip(name, pins, wrongParts);

    expect(() => chip.run()).toThrowError(`Implementation contains a loop`);
  });

  it.each([13, 24])(
    'evaluates a %i-stage NAND inverter chain without mistaking fan-out for a loop',
    (length) => {
      const gates = Array.from({ length }, () => new NandChip());
      const chainPins = new Map<string, ChipPin>([
        [
          'in',
          {
            state: false,
            type: 'input',
            connections: [
              [gates[0], 'a'],
              [gates[0], 'b'],
            ],
          },
        ],
        ['out', { state: false, type: 'output', connections: [] }],
      ]);
      const chainParts = new Map<Chip, readonly [string, string][]>();
      gates.forEach((gate, index) => {
        const wire = index === length - 1 ? 'out' : `wire${index}`;
        if (wire !== 'out') {
          chainPins.set(wire, {
            state: false,
            type: 'internal',
            connections: [
              [gates[index + 1], 'a'],
              [gates[index + 1], 'b'],
            ],
          });
        }
        chainParts.set(gate, [['out', wire]]);
      });
      const chip = new CustomChip('InverterChain', chainPins, chainParts);

      for (const input of [false, true, false]) {
        chip.setInput('in', input);
        chip.run();
        expect(chip.getOutput('out')).toBe(length % 2 === 0 ? input : !input);
      }
    },
  );
});

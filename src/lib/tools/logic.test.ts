import { describe, expect, it } from 'vitest';
import parseHdl from '#lib/editor/hdl/parse.js';
import ChipFactory from '#lib/hardware-simulator/chips/ChipFactory.js';
import {
  binaryWord,
  booleanFunctions,
  busComponents,
  busInputNames,
  busSelectorCount,
  canonicalExpression,
  constructWithNand,
  evaluateFunction,
  evaluateNandConstruction,
  functionSignature,
  inputRows,
  nandHDL,
  parseWord,
  simulateBus,
  toggleFunctionRow,
} from './logic';

describe('Boolean functions lab', () => {
  it('gives all sixteen distinct truth tables, in 00, 01, 10, 11 order', () => {
    expect(booleanFunctions).toHaveLength(16);
    expect(new Set(booleanFunctions).size).toBe(16);
    for (let mask = 0; mask < 16; mask++) {
      expect(inputRows.map(([a, b]) => Number(evaluateFunction(mask, a, b))).join('')).toBe(
        functionSignature(mask),
      );
      for (let row = 0; row < 4; row++) {
        const changed = toggleFunctionRow(mask, row);
        inputRows.forEach(([a, b], index) => {
          expect(evaluateFunction(changed, a, b)).toBe(
            index === row ? !evaluateFunction(mask, a, b) : evaluateFunction(mask, a, b),
          );
        });
      }
    }
    expect(functionSignature(1)).toBe('0001');
    expect(functionSignature(14)).toBe('1110');
  });

  it('builds executable NAND-only HDL equivalent to every function on every input', () => {
    for (let mask = 0; mask < 16; mask++) {
      const construction = constructWithNand(mask);
      const parsed = parseHdl(nandHDL(construction));
      if (!parsed?.[0]) throw new Error('Generated NAND HDL did not contain a chip.');
      const chip = new ChipFactory().fromAST(parsed[0]);
      for (const [a, b] of inputRows) {
        const expected = evaluateFunction(mask, a, b);
        expect(evaluateNandConstruction(construction, a, b)).toBe(expected);
        chip.setInput('a', a);
        chip.setInput('b', b);
        chip.run();
        expect(chip.getOutput('out')).toBe(expected);
      }
    }
  });

  it('derives canonical minterms, including the empty and full functions', () => {
    expect(canonicalExpression(0)).toBe('0');
    expect(canonicalExpression(1)).toBe('(a AND b)');
    expect(canonicalExpression(6)).toBe('(NOT a AND b) OR (a AND NOT b)');
    expect(canonicalExpression(15)).toBe(
      '(NOT a AND NOT b) OR (NOT a AND b) OR (a AND NOT b) OR (a AND b)',
    );
  });

  it('rejects malformed function and circuit inputs', () => {
    for (const mask of [-1, 16, NaN, 1.5])
      expect(() => constructWithNand(mask)).toThrow('four binary outputs');
    expect(() => functionSignature(16)).toThrow('four binary outputs');
    expect(() => canonicalExpression(-1)).toThrow('four binary outputs');
    expect(() => toggleFunctionRow(1, 4)).toThrow('Choose a row');
    expect(() => toggleFunctionRow(1, -1)).toThrow('Choose a row');
    expect(() => toggleFunctionRow(1, 0.5)).toThrow('Choose a row');
    expect(() =>
      evaluateNandConstruction(
        { gates: [{ id: 'n', a: 'missing', b: 'a' }], output: 'n' },
        false,
        false,
      ),
    ).toThrow('Unknown NAND input');
    expect(() =>
      evaluateNandConstruction(
        { gates: [{ id: 'n', a: 'a', b: 'missing' }], output: 'n' },
        false,
        false,
      ),
    ).toThrow('Unknown NAND input');
    expect(() => evaluateNandConstruction({ gates: [], output: 'missing' }, false, false)).toThrow(
      'Unknown NAND output',
    );
  });
});

describe('Buses and routing lab', () => {
  it('parses unsigned values without silently truncating invalid input', () => {
    for (const source of ['65535', '0xffff', '0XFFFF', '0b1111111111111111', ' 65535 '])
      expect(parseWord(source)).toEqual({ value: 65535, error: '' });
    expect(parseWord('0')).toEqual({ value: 0, error: '' });
    expect(parseWord('0001')).toEqual({ value: 1, error: '' });
    expect(parseWord('255', 8).value).toBe(255);
    for (const source of [
      '',
      ' ',
      '65536',
      '-1',
      '1.1',
      '1e3',
      '0x',
      '0b2',
      '0x10000',
      '999999999999999999999999',
    ])
      expect(parseWord(source).value).toBeNull();
    expect(parseWord('256', 8).value).toBeNull();
    expect(parseWord('2', 1).value).toBeNull();
    expect(binaryWord(1)).toBe('0000000000000001');
    expect(binaryWord(128, 8)).toBe('10000000');
  });

  it('applies each bit independently, including the most significant bit', () => {
    expect(simulateBus('not16', { in: 0 }).out).toBe(65535);
    expect(simulateBus('not16', { in: 65535 }).out).toBe(0);
    expect(simulateBus('and16', { a: 0xaaaa, b: 0x5555 }).out).toBe(0);
    expect(simulateBus('or16', { a: 0xaaaa, b: 0x5555 }).out).toBe(65535);
    for (let bit = 0; bit < 16; bit++) {
      const value = 2 ** bit;
      expect(simulateBus('not16', { in: value }).out).toBe(65535 - value);
      expect(simulateBus('and16', { a: value, b: 65535 }).out).toBe(value);
      expect(simulateBus('or16', { a: value, b: 0 }).out).toBe(value);
    }
  });

  it('reduces all 256 possible eight-bit inputs to one OR result', () => {
    for (let value = 0; value < 256; value++)
      expect(simulateBus('or8way', { in: value }).out).toBe(Number(value > 0));
  });

  it('routes every selector value to exactly the corresponding word or output', () => {
    for (const component of ['mux16', 'mux4way16', 'mux8way16'] as const) {
      const inputs = Object.fromEntries(
        busInputNames(component).map((name, index) => [name, 2 ** index]),
      );
      for (let selector = 0; selector < busSelectorCount(component); selector++)
        expect(simulateBus(component, inputs, selector).out).toBe(2 ** selector);
    }
    for (const component of ['dmux4way', 'dmux8way'] as const) {
      const count = busSelectorCount(component);
      for (let selector = 0; selector < count; selector++) {
        expect(Object.values(simulateBus(component, { in: 0 }, selector))).toEqual(
          Array(count).fill(0),
        );
        expect(Object.values(simulateBus(component, { in: 1 }, selector))).toEqual(
          Array.from({ length: count }, (_, index) => Number(index === selector)),
        );
      }
    }
  });

  it('validates all required input words and the full selector range', () => {
    expect(busComponents.map((component) => component.id)).toHaveLength(9);
    expect(busSelectorCount('not16')).toBe(0);
    for (const value of [-1, 65536, 1.5, NaN])
      expect(() => simulateBus('not16', { in: value })).toThrow('unsigned 16-bit');
    expect(() => simulateBus('and16', { a: 1 })).toThrow('Input b');
    expect(() => simulateBus('or8way', { in: 256 })).toThrow('unsigned 8-bit');
    expect(() => simulateBus('dmux4way', { in: 2 })).toThrow('unsigned 1-bit');
    for (const selector of [-1, 8, 0.5, NaN])
      expect(() =>
        simulateBus(
          'mux8way16',
          Object.fromEntries(busInputNames('mux8way16').map((name) => [name, 0])),
          selector,
        ),
      ).toThrow('Selector');
  });
});

import { describe, it, expect } from 'vitest';
import { bitmapWords, bitmapAssembly, bitmapJack } from './bitmap.js';
import { assemble, createMachine } from './hack.js';
describe('Bitmap exports', () => {
  it('maps leftmost pixel to bit zero and crosses word boundaries at unaligned positions', () => {
    const bitmap = { width: 3, height: 2, pixels: [true, true, false, false, false, true] };
    expect(bitmapWords(bitmap, 15, 1)).toEqual([
      { address: 16416, value: 32768 },
      { address: 16417, value: 1 },
      { address: 16448, value: 0 },
      { address: 16449, value: 2 },
    ]);
  });
  it('assembles exported high-bit words into identical screen memory', () => {
    const bitmap = {
      width: 16,
      height: 2,
      pixels: Array.from({ length: 32 }, (_, i) => i === 15 || i >= 16),
    };
    const expected = bitmapWords(bitmap);
    const machine = createMachine(assemble(bitmapAssembly(bitmap)).words);
    machine.run(100);
    for (const word of expected) expect(machine.read(word.address)).toBe(word.value);
    expect(bitmapJack(bitmap)).toContain('Memory.poke(16384, ~32767)');
    expect(bitmapJack(bitmap)).toContain('Memory.poke(16416, -1)');
  });
  it('rejects dimensions, incorrect pixel length and positions outside the screen', () => {
    expect(() => bitmapWords({ width: 16, height: 1, pixels: [] })).toThrow();
    expect(() => bitmapWords({ width: 1, height: 1, pixels: [true] }, 512, 0)).toThrow();
    expect(() => bitmapWords({ width: 1, height: 1, pixels: [true] }, 0, 256)).toThrow();
  });
});

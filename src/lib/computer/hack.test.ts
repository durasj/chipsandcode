import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assemble,
  AssemblyError,
  binary16,
  signed16,
  parseHack,
  disassemble,
  HACK_COMP,
  HACK_DEST,
  HACK_JUMP,
  predefinedSymbols,
  alu,
  cpuStep,
  createMachine,
} from './hack';

const fixture = (name: string) =>
  readFileSync(new URL(`./testing/fixtures/hack/${name}.asm`, import.meta.url), 'utf8');

describe('Hack assembler', () => {
  it('matches the official Add binary and retains one-based source locations', () => {
    const result = assemble(fixture('Add'));
    expect(result.words).toEqual([2, 0xec10, 3, 0xe090, 0, 0xe308]);
    expect(parseHack(result.binary)).toEqual(result.words);
    expect(result.instructions.map((item) => item.address)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(result.instructions[0]).toMatchObject({ source: '@2', type: 'A', word: 2 });
    expect(result.sourceMap).toEqual([8, 9, 10, 11, 12, 13]);
  });
  it.each(['Max', 'Rect', 'Pong'])(
    'translates official %s identically with and without symbols',
    (name) => {
      expect(assemble(fixture(name)).words).toEqual(assemble(fixture(`${name}L`)).words);
    },
  );
  it('resolves forward labels before allocating variables, with case-sensitive symbols', () => {
    const result = assemble(
      '// header\n @end // future ROM label\n@value\n@Value\n(value.label)\nD = A + 1 ; JGT\n(end)\n@value\n@SCREEN\n@KBD\n@R15',
    );
    expect(result.symbols.end).toBe(4);
    expect(result.symbols['value.label']).toBe(3);
    expect(result.symbols.value).toBe(16);
    expect(result.symbols.Value).toBe(17);
    expect(result.words).toEqual([4, 16, 17, 0xedd1, 16, 16384, 24576, 15]);
    expect(result.sourceMap).toEqual([2, 3, 4, 6, 8, 9, 10, 11]);
    expect(predefinedSymbols()).toMatchObject({
      SP: 0,
      LCL: 1,
      ARG: 2,
      THIS: 3,
      THAT: 4,
      R0: 0,
      R15: 15,
    });
    expect(assemble('@__proto__\n@constructor').words).toEqual([16, 17]);
  });
  it('encodes every documented computation, destination and jump combination', () => {
    for (const [comp, c] of Object.entries(HACK_COMP)) {
      for (const [dest, d] of Object.entries(HACK_DEST)) {
        for (const [jump, j] of Object.entries(HACK_JUMP)) {
          const source = `${dest ? `${dest}=` : ''}${comp}${jump ? `;${jump}` : ''}`;
          const [word] = assemble(source).words;
          expect(word).toBe(0xe000 | (c << 6) | (d << 3) | j);
          expect(disassemble(word)).toBe(source);
        }
      }
    }
    expect(disassemble(32767)).toBe('@32767');
    expect(disassemble(0x8000)).toBe(binary16(0x8000));
    expect(disassemble(0xffff)).toBe(binary16(0xffff));
  });
  it.each([
    '@',
    '@-1',
    '@32768',
    '@999999999999999999',
    '@2.5',
    '@0x10',
    '@1a',
    '(bad-label)',
    '(foo',
    '(a)(b)',
    'D=',
    '=D',
    'D;;JGT',
    'DD=M',
    'D=A+D',
    'D;NOPE',
    'D=__proto__',
    'constructor=D',
  ])('rejects malformed assembly %s with its original line', (source) => {
    expect(() => assemble(`// first\n\n${source}`)).toThrow(AssemblyError);
    expect(() => assemble(`// first\n\n${source}`)).toThrow('Line 3:');
  });
  it('rejects conflicting symbols and exhausted address spaces', () => {
    expect(() => assemble('(SP)')).toThrow('already defined');
    expect(() => assemble('(loop)\n(loop)')).toThrow('already defined');
    expect(assemble('@0\n'.repeat(32768)).words).toHaveLength(32768);
    expect(() => assemble('@0\n'.repeat(32769))).toThrow('at most 32768');
    expect(() => assemble('@0\n'.repeat(32768) + '(END)')).toThrow('15-bit ROM');
    expect(() =>
      assemble(Array.from({ length: 16369 }, (_, i) => `@variable${i}`).join('\n')),
    ).toThrow('overlap screen');
    expect(assemble(' // nothing\n').binary).toBe('');
  });
  it('validates binary files strictly', () => {
    expect(parseHack(' \r\n0000000000000001\r\n1111111111111111')).toEqual([1, 65535]);
    for (const code of ['0', '0000000000000002', '00000000000000001', '// comment'])
      expect(() => parseHack(code)).toThrow(AssemblyError);
    expect(() => parseHack('0000000000000000\n'.repeat(32769))).toThrow('at most 32768');
    expect(binary16(-1)).toBe('1111111111111111');
    expect(signed16(65535)).toBe(-1);
  });
});

describe('Hack ALU and CPU', () => {
  it('implements all 64 control combinations with two’s-complement flags', () => {
    for (const x of [0, 1, 32767, 32768, 65535, 0xaaaa]) {
      for (const y of [0, 1, 32767, 32768, 65535, 0x5555]) {
        for (let control = 0; control < 64; control++) {
          const [zx, nx, zy, ny, f, no] = control
            .toString(2)
            .padStart(6, '0')
            .split('')
            .map(Number);
          let left = zx ? 0 : signed16(x),
            right = zy ? 0 : signed16(y);
          if (nx) left = ~left;
          if (ny) right = ~right;
          let output = f ? left + right : left & right;
          if (no) output = ~output;
          output &= 65535;
          expect(alu(x, y, control)).toEqual({
            out: output,
            zr: Number(output === 0),
            ng: Number(output >= 32768),
          });
        }
      }
    }
  });
  it('evaluates every documented computation independently', () => {
    const expected: Record<string, (d: number, a: number) => number> = {
      '0': () => 0,
      '1': () => 1,
      '-1': () => -1,
      D: (d) => d,
      A: (_, a) => a,
      '!D': (d) => ~d,
      '!A': (_, a) => ~a,
      '-D': (d) => -d,
      '-A': (_, a) => -a,
      'D+1': (d) => d + 1,
      'A+1': (_, a) => a + 1,
      'D-1': (d) => d - 1,
      'A-1': (_, a) => a - 1,
      'D+A': (d, a) => d + a,
      'D-A': (d, a) => d - a,
      'A-D': (d, a) => a - d,
      'D&A': (d, a) => d & a,
      'D|A': (d, a) => d | a,
    };
    for (const [comp, code] of Object.entries(HACK_COMP)) {
      for (const d of [0, 1, 32767, 32768, 65535]) {
        const state = { a: 17, d, pc: 9 },
          memory = 301;
        const result = cpuStep(state, 0xe010 | (code << 6), memory);
        expect(result.d).toBe(
          expected[comp.replaceAll('M', 'A')](d, comp.includes('M') ? memory : state.a) & 65535,
        );
      }
    }
  });
  it('uses the old A register for simultaneous memory writes and jumps', () => {
    const instruction = assemble('AMD=D+1;JMP').words[0];
    expect(cpuStep({ a: 123, d: 7, pc: 2 }, instruction, 99)).toEqual({
      a: 8,
      d: 8,
      pc: 123,
      addressM: 123,
      outM: 8,
      writeM: true,
      jumped: true,
    });
    expect(
      cpuStep({ a: 0xffff, d: 0xffff, pc: 32767 }, assemble('MD=D+1').words[0], 0),
    ).toMatchObject({ a: 65535, d: 0, pc: 0, addressM: 32767, outM: 0 });
    expect(cpuStep({ a: 123, d: 7, pc: 2 }, instruction, 99, true)).toMatchObject({
      a: 8,
      d: 8,
      pc: 0,
      writeM: true,
      jumped: false,
    });
  });
  it('implements all jumps for negative, zero and positive ALU results', () => {
    const predicates = [
      () => false,
      (n: number) => n > 0,
      (n: number) => n === 0,
      (n: number) => n >= 0,
      (n: number) => n < 0,
      (n: number) => n !== 0,
      (n: number) => n <= 0,
      () => true,
    ];
    for (let jump = 0; jump < 8; jump++)
      for (const d of [0, 1, 32767, 32768, 65535]) {
        const result = cpuStep({ a: 21, d, pc: 4 }, 0xe300 | jump, 0);
        const shouldJump = predicates[jump](signed16(d));
        expect(result.pc).toBe(shouldJump ? 21 : 5);
        expect(result.jumped).toBe(shouldJump);
      }
    expect(cpuStep({ a: 123, d: 9, pc: 4 }, 32767, 0)).toMatchObject({
      a: 32767,
      d: 9,
      pc: 5,
      writeM: false,
      jumped: false,
    });
  });
});

describe('Hack computer execution', () => {
  it('runs official Add and stops at the loaded extent without inventing a HALT opcode', () => {
    const machine = createMachine(assemble(fixture('Add')).words);
    const trace = machine.run(20)!;
    expect(machine.ram[0]).toBe(5);
    expect(machine.cycles).toBe(6);
    expect(machine.halted).toBe(true);
    expect(trace).toMatchObject({
      cycle: 6,
      before: { a: 0 },
      after: { pc: 6 },
      addressM: 0,
      outM: 5,
      writeM: true,
    });
    expect(machine.step()).toBeNull();
    expect(machine.step(true)).toBeNull();
    expect(machine.pc).toBe(0);
  });
  it('runs official Max for both branches and equality', () => {
    const machine = createMachine(assemble(fixture('Max')).words);
    for (const [a, b] of [
      [1, 2],
      [7, 3],
      [9, 9],
    ]) {
      machine.reset();
      machine.ram[0] = a;
      machine.ram[1] = b;
      machine.run(100);
      expect(machine.ram[2]).toBe(Math.max(a, b));
    }
  });
  it('runs official Rect against the memory-mapped screen, including its zero-height branch', () => {
    const machine = createMachine(assemble(fixture('Rect')).words);
    machine.ram[0] = 3;
    machine.run(200);
    expect(Array.from(machine.screen).filter(Boolean)).toHaveLength(3);
    expect(machine.screen[0]).toBe(65535);
    expect(machine.screen[32]).toBe(65535);
    expect(machine.screen[64]).toBe(65535);
    expect(machine.screen[1]).toBe(0);
    machine.reset();
    machine.run(100);
    expect(machine.screen.every((word) => word === 0)).toBe(true);
  });
  it('keeps memory writes on old A while loading A and observes keyboard as read-only', () => {
    const machine = createMachine(assemble('@123\nD=A\n@7\nAM=D\n@KBD\nD=M\nM=0').words);
    machine.setKeyboard(130);
    machine.run(7);
    expect(machine.ram[7]).toBe(123);
    expect(machine.ram[123]).toBe(0);
    expect(machine.d).toBe(130);
    expect(machine.read(24576)).toBe(130);
    machine.write(16384, -1);
    expect(machine.read(16384)).toBe(65535);
    machine.write(24575, 17);
    expect(machine.read(24575)).toBe(17);
    machine.write(24577, 10);
    expect(machine.read(24577)).toBe(0);
    machine.reset(false);
    expect(machine.screen[0]).toBe(65535);
    expect(machine.keyboard).toBe(130);
    machine.reset();
    expect(machine.screen[0]).toBe(0);
    expect(machine.keyboard).toBe(0);
    expect(machine.ram[7]).toBe(0);
    machine.d = 17;
    machine.step(true);
    expect(machine.pc).toBe(0);
    expect(machine.d).toBe(17);
  });
  it('rejects invalid ROM, keyboard and run inputs without unbounded execution', () => {
    for (const words of [[-1], [65536], [0.5], [NaN], new Array(32769).fill(0)])
      expect(() => createMachine(words)).toThrow('ROM accepts');
    const machine = createMachine([0]);
    for (const n of [-1, 32768, NaN, 1.2])
      expect(() => machine.setKeyboard(n)).toThrow('Keyboard code');
    for (const n of [-1, 1000001, NaN, 1.2]) expect(() => machine.run(n)).toThrow('Run between');
    expect(machine.run(0)).toBeNull();
  });
});

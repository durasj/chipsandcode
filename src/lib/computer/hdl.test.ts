import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { compileHDL, builtinContracts, HDLError } from './hdl.js';
const fixtureRoot = new URL('./testing/official/', import.meta.url);
function wrapper(name: string) {
  const spec = builtinContracts[name];
  const pins = (values: Record<string, number>) =>
    Object.entries(values)
      .map(([pin, width]) => `${pin}${width > 1 ? `[${width}]` : ''}`)
      .join(', ');
  return `CHIP Probe { ${Object.keys(spec.inputs).length ? `IN ${pins(spec.inputs)};` : ''} ${Object.keys(spec.outputs).length ? `OUT ${pins(spec.outputs)};` : ''} PARTS: ${name}(${[...Object.keys(spec.inputs), ...Object.keys(spec.outputs)].map((pin) => `${pin}=${pin}`).join(',')}); }`;
}
const read = (name: string) => readFileSync(new URL(name, fixtureRoot), 'utf8');
/** Only the explicitly supported official TDL commands are accepted. */
function runOfficial(name: string) {
  const chip = name === 'CPU-external' ? 'CPU' : name === 'ALU-nostat' ? 'ALU' : name;
  const circuit = compileHDL(wrapper(chip));
  const script = read(name + '.tst').replace(/\/\/[^\n]*/g, '');
  const expected = read(name + '.cmp')
    .trim()
    .split(/\r?\n/)
    .map((row) =>
      row
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
  const header = expected.shift()!;
  let row = 0;
  const formats: Record<string, string> = {};
  for (const raw of script.split(/[,;]/)) {
    const command = raw.trim();
    if (!command) continue;
    if (/^(load|output-file|compare-to)\s/.test(command)) continue;
    if (command.startsWith('output-list ')) {
      for (const [, pin, type] of command.matchAll(/([\w]+)%([BDS])/g)) formats[pin] = type;
      continue;
    }
    const setting = command.match(/^set\s+(\w+)\s+(-?\d+|%B[01]+)$/);
    if (setting) {
      circuit.evaluate({
        [setting[1]]: setting[2].startsWith('%B')
          ? parseInt(setting[2].slice(2), 2)
          : Number(setting[2]),
      });
      continue;
    }
    if (command === 'eval') {
      circuit.evaluate();
      continue;
    }
    if (command === 'tick') {
      circuit.tick();
      continue;
    }
    if (command === 'tock') {
      circuit.tock();
      continue;
    }
    if (command === 'output') {
      const values = { ...circuit.inputs, ...circuit.outputs };
      const cells = expected[row++];
      expect(cells, `${name} output row ${row}`).toBeDefined();
      Object.keys(formats).forEach((pin, i) => {
        if (pin === 'time' || cells[i].includes('*')) return;
        const expectedNumber = formats[pin] === 'B' ? parseInt(cells[i], 2) : Number(cells[i]);
        expect(values[pin], `${name} row ${row} pin ${pin}`).toBe(
          expectedNumber & (2 ** (circuit.inputWidths[pin] ?? circuit.outputWidths[pin]) - 1),
        );
      });
      continue;
    }
    throw new Error(`Unsupported official TDL command: ${command}`);
  }
  expect(Object.keys(formats)).toHaveLength(header.length);
  expect(row).toBe(expected.length);
}
describe('Official Nand2Tetris hardware contracts', () => {
  for (const name of readdirSync(fixtureRoot)
    .filter(
      (name) =>
        name.endsWith('.tst') &&
        !name.startsWith('Computer') &&
        name !== 'Memory.tst' &&
        name !== 'CPU.tst',
    )
    .map((name) => name.slice(0, -4)))
    it(name, () => runOfficial(name));
});
describe('Structural HDL wiring and state', () => {
  it('supports bus splitting, concatenation, fanout and constants', () => {
    const chip = compileHDL(
      'CHIP Probe { IN x[16]; OUT a[8], b[8], copy[16]; PARTS: And16(a=x,b=true,out[0..7]=a,out[8..15]=b,out=copy); }',
    );
    expect(chip.evaluate({ x: 0xabcd })).toEqual({ a: 0xcd, b: 0xab, copy: 0xabcd });
    expect(chip.evaluate({ x: -1 })).toEqual({ a: 255, b: 255, copy: 65535 });
    const slices = compileHDL(
      'CHIP Probe { IN x[8], y[8]; OUT out[16]; PARTS: Or16(a[0..7]=x,a[8..15]=y,b=false,out=out); }',
    );
    expect(slices.evaluate({ x: 52, y: 18 }).out).toBe(0x1234);
  });
  it('resolves parts independently of declaration order and supports custom dependencies', () => {
    const chip = compileHDL(
      'CHIP Probe { IN in; OUT out; PARTS: DelayFree(in=w,out=out); Not(in=in,out=w); }',
      { DelayFree: 'CHIP DelayFree { IN in; OUT out; PARTS: Not(in=in,out=out); }' },
    );
    expect(chip.evaluate({ in: 1 }).out).toBe(1);
    expect(chip.evaluate({ in: 0 }).out).toBe(0);
  });
  it('infers internal buses from slices and rejects no legal fanout', () => {
    const chip = compileHDL(
      'CHIP Probe { IN a[8],b[8]; OUT out[16]; PARTS: Or16(a=false,b[0..7]=a,b[8..15]=b,out[0..7]=wire[0..7],out[8..15]=wire[8..15]); And16(a=wire,b=wire,out=out); }',
    );
    expect(chip.evaluate({ a: 255, b: 64 }).out).toBe(16639);
  });
  it('captures all flip flops simultaneously, permits feedback, and separates tick from tock', () => {
    const chip = compileHDL(
      'CHIP Probe { IN in; OUT first,second; PARTS: DFF(in=in,out=first); DFF(in=first,out=second); }',
    );
    expect(chip.tick({ in: 1 })).toEqual({ first: 0, second: 0 });
    chip.evaluate({ in: 0 });
    expect(chip.tock()).toEqual({ first: 1, second: 0 });
    expect(chip.cycle()).toEqual({ first: 0, second: 1 });
    expect(chip.reset()).toEqual({ first: 0, second: 0 });
    const feedback = compileHDL(
      'CHIP Probe { OUT out; PARTS: Not(in=out,out=next); DFF(in=next,out=out); }',
    );
    expect(feedback.cycle().out).toBe(1);
    expect(feedback.cycle().out).toBe(0);
  });
  it('handles GUI register aliases and built-in keyboard/ROM', () => {
    for (const name of ['ARegister', 'DRegister']) {
      const c = compileHDL(wrapper(name));
      expect(c.cycle({ in: 123, load: 1 }).out).toBe(123);
      expect(c.cycle({ in: 456, load: 0 }).out).toBe(123);
    }
    const keyboard = compileHDL(wrapper('Keyboard'));
    keyboard.setKeyboard(65);
    expect(keyboard.outputs.out).toBe(65);
    const rom = compileHDL(wrapper('ROM32K'));
    rom.loadROM([123, 456]);
    expect(rom.evaluate({ address: 1 }).out).toBe(456);
    rom.loadROM([7]);
    expect(rom.outputs.out).toBe(0);
  });
  it('maps RAM, screen and keyboard with read-before-write and ROM-backed computer execution', () => {
    const memory = compileHDL(wrapper('Memory'));
    memory.setKeyboard(65);
    for (const address of [0, 16383, 16384, 24575]) {
      expect(memory.tick({ address, in: 0xcafe, load: 1 }).out).toBe(0);
      expect(memory.tock().out).toBe(0xcafe);
      expect(memory.readMemory(address)).toBe(0xcafe);
    }
    expect(memory.cycle({ address: 24576, in: 0, load: 1 }).out).toBe(65);
    expect(memory.readMemory(24576)).toBe(65);
    expect(memory.readMemory(32767)).toBe(0);
    expect(memory.evaluate({ address: 32767 }).out).toBe(0);
    memory.reset();
    expect(memory.readMemory(0)).toBe(0);
    const screen = compileHDL(wrapper('Screen'));
    screen.cycle({ in: 1, load: 1, address: 8191 });
    expect(screen.readMemory(24575)).toBe(1);
    const computer = compileHDL(wrapper('Computer'));
    computer.loadROM([7, 0xec10, 0, 0xe308]);
    for (let i = 0; i < 4; i++) computer.cycle();
    expect(computer.readMemory(0)).toBe(7);
    computer.reset();
    expect(computer.readMemory(0)).toBe(0);
  });
  it('inspects a structurally composed Memory through the real dependency', () => {
    const c = compileHDL(
      'CHIP Probe { IN reset; PARTS: Memory(in=1,load=reset,address=false,out=unused); }'.replace(
        'in=1',
        'in=true',
      ),
      {
        Memory:
          'CHIP Memory { IN in[16],load,address[15]; OUT out[16]; PARTS: RAM16K(in=in,load=load,address=address[0..13],out=out); }',
      },
    );
    c.cycle({ reset: 1 });
    expect(c.readMemory(0)).toBe(65535);
  });
  it('evaluates custom CPU-memory feedback without false combinational loops', () => {
    const c = compileHDL(
      'CHIP Probe { IN reset; PARTS: ROM32K(address=pc,out=instruction); CPU(inM=data,instruction=instruction,reset=reset,outM=out,writeM=write,addressM=address,pc=pc); Memory(in=out,load=write,address=address,out=data); }',
    );
    c.loadROM([10, 0xec10, 1, 0xe308]);
    for (let i = 0; i < 4; i++) c.cycle();
    expect(c.readMemory(1)).toBe(10);
  });
});
describe('HDL diagnostics', () => {
  const errors: [string, string][] = [
    ['', 'Expected CHIP'],
    ['CHIP 7 {}', 'Expected a name'],
    ['CHIP P { IN a[x]; PARTS: }', 'bus width'],
    ['CHIP P { IN a,a; PARTS: }', 'Duplicate'],
    ['CHIP P { IN true; PARTS: }', 'reserved'],
    ['CHIP P { IN a[0]; PARTS: }', 'widths'],
    ['CHIP P { IN a[17]; PARTS: }', 'widths'],
    ['CHIP P { PARTS: }', 'at least one'],
    ['CHIP P { PARTS: Keyboard(); } extra', 'Unexpected'],
    ['CHIP P { IN a; OUT out; PARTS: Missing(in=a,out=out); }', 'Unknown chip'],
    ['CHIP P { IN a; OUT out; PARTS: Not(wrong=a,out=out); }', 'has no pin'],
    ['CHIP P { IN a; OUT out; PARTS: Not(in[1]=a,out=out); }', 'exceeds'],
    ['CHIP P { IN a; OUT out; PARTS: Not(in=true[0],out=out); }', 'Constants'],
    ['CHIP P { IN a; OUT out; PARTS: Not(in=a,out=false); }', 'constant'],
    ['CHIP P { IN a[16]; OUT out; PARTS: Not(in=a,out=out); }', 'Width mismatch'],
    ['CHIP P { IN a[16]; OUT out; PARTS: Not(in=a[0..1],out=out); }', 'Slice width'],
    ['CHIP P { IN a; OUT out; PARTS: Not(in=a[1],out=out); }', 'Slice exceeds'],
    ['CHIP P { IN a; OUT out; PARTS: Not(in=a[1..0],out=out); }', 'ascending'],
    ['CHIP P { IN a; OUT out; PARTS: Not(in=a[16],out=out); }', 'ascending'],
    ['CHIP P { IN a; OUT out; PARTS: Not(in=a,in=a,out=out); }', 'connected twice'],
    ['CHIP P { IN a; OUT out; PARTS: Not(in=a,out=out); Not(in=a,out=out); }', 'multiple drivers'],
    ['CHIP P { IN a; OUT out; PARTS: Not(out=out); }', 'Connect input'],
    ['CHIP P { OUT out; PARTS: Not(in=missing,out=out); }', 'no driver'],
    ['CHIP P { OUT out; PARTS: Not(in=out,out=out); }', 'loop'],
    ['CHIP P { OUT out; PARTS: Keyboard(out=unused); }', 'no driver'],
  ];
  it.each(errors)('rejects invalid source %s', (source, message) =>
    expect(() => compileHDL(source)).toThrow(message),
  );
  it('rejects invalid dependencies and recursive definitions', () => {
    expect(() =>
      compileHDL(wrapper('Not'), { Thing: 'CHIP Other { OUT out; PARTS: Keyboard(out=out); }' }),
    ).toThrow('declares CHIP');
    expect(() =>
      compileHDL('CHIP Probe { IN in; OUT out; PARTS: Echo(in=in,out=out); }', {
        Echo: 'CHIP Echo { IN in; OUT out; PARTS: Echo(in=in,out=out); }',
      }),
    ).toThrow('Recursive');
  });
  it('validates input values, external devices and clock sequencing', () => {
    const c = compileHDL(wrapper('DFF'));
    expect(c.phase).toBe('tock');
    expect(() => c.tock()).toThrow('Tick');
    c.tick();
    expect(c.phase).toBe('tick');
    expect(() => c.tick()).toThrow('already high');
    c.tock();
    expect(() => c.evaluate({ bad: 0 })).toThrow('Unknown input');
    for (const value of [2, NaN, 0.5, -2])
      expect(() => c.evaluate({ in: value })).toThrow(HDLError);
    expect(() => c.loadROM([65536])).toThrow('ROM');
    expect(() => c.loadROM(Array(32769).fill(0))).toThrow('ROM');
    expect(() => c.setKeyboard(-1)).toThrow('Keyboard');
    expect(() => c.readMemory(-1)).toThrow('address');
    expect(() => c.readMemory(0)).toThrow('no mapped');
  });
});

import { compileHDL } from '#lib/computer/hdl.js';
import { assemble, createMachine } from '#lib/computer/hack.js';
import { permittedParts, symbolProgram, type CourseTask } from './data.js';
export interface CheckResult {
  passed: boolean;
  message: string;
  cases: number;
}
const fail = (message: string, cases = 0): CheckResult => ({ passed: false, message, cases });
const pass = (cases: number): CheckResult => ({
  passed: true,
  message: `${cases} checks passed.`,
  cases,
});
const u = (v: number) => v & 65535;
function alu(v: Record<string, number>) {
  let x = v.zx ? 0 : v.x,
    y = v.zy ? 0 : v.y;
  if (v.nx) x = u(~x);
  if (v.ny) y = u(~y);
  let out = u(v.f ? x + y : x & y);
  if (v.no) out = u(~out);
  return { out, zr: Number(out === 0), ng: out >>> 15 };
}
export function expectedCombinational(
  name: string,
  v: Record<string, number>,
): Record<string, number> {
  if (name === 'Not16') return { out: u(~v.in) };
  if (name === 'And16') return { out: v.a & v.b };
  if (name === 'Or16') return { out: v.a | v.b };
  if (name === 'Mux16') return { out: v.sel ? v.b : v.a };
  if (name === 'Or8Way') return { out: Number(v.in !== 0) };
  if (name.startsWith('Mux')) return { out: v[String.fromCharCode(97 + v.sel)] };
  if (name.startsWith('DMux'))
    return Object.fromEntries(
      Array.from({ length: name === 'DMux4Way' ? 4 : 8 }, (_, i) => [
        String.fromCharCode(97 + i),
        i === v.sel ? v.in : 0,
      ]),
    );
  if (name === 'HalfAdder' || name === 'FullAdder') {
    const sum = v.a + v.b + (v.c ?? 0);
    return { sum: sum & 1, carry: sum >>> 1 };
  }
  if (name === 'Add16') return { out: u(v.a + v.b) };
  if (name === 'Inc16') return { out: u(v.in + 1) };
  if (name === 'ALU') return alu(v);
  throw new Error(`No combinational contract for ${name}.`);
}
function mismatch(
  actual: Record<string, number>,
  expected: Record<string, number>,
): string | undefined {
  return Object.entries(expected).flatMap(([name, value]) =>
    actual[name] === value ? [] : [`${name}: expected ${value}, got ${actual[name] ?? 'no value'}`],
  )[0];
}
export function verifyHardware(task: CourseTask, source: string): CheckResult {
  let count = 0;
  try {
    if (!task.chip) return fail('This task has no chip contract.');
    const uncommented = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const parts = [...uncommented.matchAll(/(\w+)\s*\(/g)].map((match) => match[1]);
    const forbidden = parts.find((part) => !permittedParts(task).includes(part));
    if (forbidden)
      return fail(
        `Use previously introduced parts. ${forbidden} is not available in this construction.`,
      );
    const circuit = compileHDL(source);
    const same = (a: Record<string, number>, b: Record<string, number>) =>
      JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
    if (
      !same(circuit.inputWidths, task.inputs ?? {}) ||
      !same(circuit.outputWidths, task.outputs ?? {})
    )
      return fail('Keep the chip’s declared inputs, outputs, and widths unchanged.');
    const check = (
      actual: Record<string, number>,
      expected: Record<string, number>,
      context: string,
    ) => {
      const why = mismatch(actual, expected);
      count++;
      if (why) throw new Error(`${context}: ${why}.`);
    };
    const name = task.chip;
    if (name === 'Bit' || name === 'Register') {
      const width = name === 'Bit' ? 1 : 65535;
      let stored = 0;
      for (const [value, load] of [
        [width, 0],
        [width, 1],
        [0, 0],
        [0, 1],
        [width, 1],
        [0, 0],
        ...[0xaaaa, 0x5555, 0x8000, 1, 0x1234].flatMap((value) => [
          [value & width, 1],
          [~value & width, 0],
        ]),
      ]) {
        check(circuit.evaluate({ in: value, load }), { out: stored }, 'Before tick');
        check(circuit.tick(), { out: stored }, 'Tick captures without publishing');
        if (load) stored = value;
        check(circuit.tock(), { out: stored }, 'After tock');
      }
    } else if (name.startsWith('RAM')) {
      const size = 2 ** (task.inputs?.address ?? 0);
      const addresses = [
        ...new Set([
          0,
          size - 1,
          ...Array.from({ length: task.inputs?.address ?? 0 }, (_, bit) => [
            2 ** bit,
            2 ** bit - 1,
          ]).flat(),
        ]),
      ];
      const expected = new Map<number, number>();
      for (const address of addresses) {
        const value = u(0x1234 + address * 31);
        check(
          circuit.evaluate({ address, in: value, load: 1 }),
          { out: 0 },
          `Address ${address} before write`,
        );
        circuit.tick();
        check(circuit.outputs, { out: 0 }, 'Write is not visible during tick');
        circuit.tock();
        expected.set(address, value);
        check(circuit.evaluate(), { out: value }, `Address ${address} after write`);
      }
      for (const address of addresses) {
        check(
          circuit.evaluate({ address, in: 0, load: 0 }),
          { out: expected.get(address)! },
          `Read address ${address}`,
        );
        circuit.cycle();
        check(circuit.outputs, { out: expected.get(address)! }, 'load=0 holds memory');
      }
    } else if (name === 'PC') {
      let value = 0;
      for (const controls of [
        { in: 65535, load: 1, inc: 1, reset: 0 },
        { in: 17, load: 0, inc: 1, reset: 0 },
        { in: 9, load: 0, inc: 0, reset: 0 },
        { in: 42, load: 1, inc: 1, reset: 1 },
        { in: 32768, load: 1, inc: 0, reset: 0 },
        { in: 0, load: 0, inc: 1, reset: 0 },
      ]) {
        check(circuit.evaluate(controls), { out: value }, 'Before clock');
        circuit.tick();
        check(circuit.outputs, { out: value }, 'Tick captures');
        value = controls.reset
          ? 0
          : controls.load
            ? controls.in
            : controls.inc
              ? u(value + 1)
              : value;
        check(circuit.tock(), { out: value }, 'Control priority');
      }
    } else if (name === 'Memory') {
      for (const address of [0, 16383, 16384, 24575]) {
        circuit.cycle({ address, in: address + 7, load: 1 });
        check(
          circuit.evaluate({ address, in: 0, load: 0 }),
          { out: u(address + 7) },
          `Read address ${address}`,
        );
      }
      for (const address of [0, 16383, 16384, 24575])
        check(
          circuit.evaluate({ address, in: 0, load: 0 }),
          { out: u(address + 7) },
          `Preserve independent address ${address}`,
        );
      circuit.setKeyboard(65);
      check(circuit.evaluate({ address: 24576, in: 999, load: 1 }), { out: 65 }, 'Keyboard read');
      circuit.cycle();
      check(circuit.outputs, { out: 65 }, 'Keyboard ignores writes');
      circuit.setKeyboard(0);
      check(circuit.evaluate(), { out: 0 }, 'Keyboard release');
    } else if (name === 'CPU') {
      let a = 0,
        d = 0,
        pc = 0;
      const jumpPrograms = ['0', '1', '-1']
        .flatMap((value) =>
          ['', 'JGT', 'JEQ', 'JGE', 'JLT', 'JNE', 'JLE', 'JMP'].map(
            (jump) => `D=${value}\n@123\nAM=D${jump ? ';' + jump : ''}`,
          ),
        )
        .join('\n');
      const program = assemble(
        '@7\nD=A\n@3\nD=D+A\n@8\nAM=D\nD=M\n@2\nD=D-A\n@1\nD;JGT\n' + jumpPrograms,
      ).words;
      for (let i = 0; i < program.length; i++) {
        const instruction = program[i % program.length],
          inM = u(i * 113),
          reset = Number(i === 35);
        const isC = (instruction & 32768) !== 0;
        const result = alu({
          x: d,
          y: instruction & 4096 ? inM : a,
          zx: (instruction >> 11) & 1,
          nx: (instruction >> 10) & 1,
          zy: (instruction >> 9) & 1,
          ny: (instruction >> 8) & 1,
          f: (instruction >> 7) & 1,
          no: (instruction >> 6) & 1,
        });
        const writeM = Number(isC && Boolean(instruction & 8));
        const outputs = {
          addressM: a & 32767,
          pc: pc & 32767,
          writeM,
          ...(writeM ? { outM: result.out } : {}),
        };
        check(circuit.evaluate({ instruction, inM, reset }), outputs, 'CPU before clock');
        const jump = instruction & 7;
        const negative = result.ng === 1,
          zero = result.zr === 1;
        const taken =
          isC &&
          Boolean((jump & 4 && negative) || (jump & 2 && zero) || (jump & 1 && !negative && !zero));
        const nextPC = reset ? 0 : taken ? a : u(pc + 1);
        if (isC) {
          if (instruction & 16) d = result.out;
          if (instruction & 32) a = result.out;
        } else a = instruction & 32767;
        pc = nextPC;
        circuit.cycle();
        check(circuit.outputs, { addressM: a & 32767, pc: pc & 32767 }, 'CPU after clock');
      }
    } else if (name === 'Computer') {
      const program = assemble('@17\nD=A\n@23\nD=D+A\n@0\nM=D\n@16384\nM=-1\n@8\n0;JMP').words;
      circuit.loadROM(program);
      circuit.cycle({ reset: 1 });
      for (let i = 0; i < 40; i++) circuit.cycle({ reset: 0 });
      check(
        { ram: circuit.readMemory(0), pixel: circuit.readMemory(16384) },
        { ram: 40, pixel: 65535 },
        'Program result',
      );
      circuit.cycle({ reset: 1 });
      check({ ram: circuit.readMemory(0) }, { ram: 40 }, 'CPU reset preserves data memory');
      circuit.loadROM(
        assemble(
          '@0\nD=M\n@11\nD;JGT\n@1\nM=-1\n@6\n0;JMP\n@0\n0;JMP\n@0\n@1\nM=D\n@24576\nD=M\n@16385\nM=D\n@17\n0;JMP',
        ).words,
      );
      circuit.setKeyboard(65);
      circuit.cycle({ reset: 1 });
      for (let i = 0; i < 60; i++) circuit.cycle({ reset: 0 });
      check(
        { value: circuit.readMemory(1), pixel: circuit.readMemory(16385) },
        { value: 40, pixel: 65 },
        'Branch, preserved data, and keyboard path',
      );
    } else {
      const widths = task.inputs ?? {};
      const names = Object.keys(widths);
      const bits = Object.values(widths).reduce((n, w) => n + w, 0);
      const cases = bits <= 10 ? 2 ** bits : name === 'ALU' ? 256 : 96;
      for (let i = 0; i < cases; i++) {
        let offset = 0;
        const values: Record<string, number> = {};
        for (const [index, key] of names.entries()) {
          const width = widths[key],
            mask = 2 ** width - 1;
          if (bits <= 10) {
            values[key] = (i >> offset) & mask;
            offset += width;
          } else if (width === 1) {
            values[key] = (i >> (index % 6)) & 1;
          } else if (key === 'sel') {
            values[key] = i & mask;
          } else {
            const edges = [0, 65535, 32768, 32767, 1, 0xaaaa, 0x5555, 0x00ff];
            values[key] =
              (i < edges.length
                ? edges[(i + index) % edges.length]
                : Math.imul(i + 1, 1103515245) ^ Math.imul(index + 3, 12345)) & mask;
          }
        }
        if (name === 'ALU') {
          for (const [j, key] of ['zx', 'nx', 'zy', 'ny', 'f', 'no'].entries())
            values[key] = (i >> j) & 1;
        }
        check(
          circuit.evaluate(values),
          expectedCombinational(name, values),
          `Inputs ${Object.entries(values)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ')}`,
        );
      }
    }
    return pass(count);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'The design could not be checked.', count);
  }
}
export function verifyAssembly(task: CourseTask, source: string): CheckResult {
  try {
    if (task.kind === 'symbols') {
      const answer = JSON.parse(source);
      const symbols = assemble(symbolProgram).symbols;
      return ['LOOP', 'value', 'END'].every((k) => answer[k] === symbols[k])
        ? pass(3)
        : fail(
            'One or more addresses differ. Count only instructions for labels; allocate variables from 16.',
          );
    }
    if (task.kind === 'encode') {
      const expected = assemble(
        task.id === 'instruction' ? '@21\nD=A' : '@7\nD=A\n@3\nD=D+A\n@0\nM=D',
      ).binary;
      const words = source
        .split('\n')
        .map((s) => s.replace(/\/\/.*$/, '').trim())
        .filter(Boolean);
      if (words.some((w) => !/^[01]{16}$/.test(w)))
        return fail('Each instruction must be exactly sixteen 0/1 digits.');
      return words.join('\n') === expected
        ? pass(words.length)
        : fail(
            'The machine words do not match yet. Check instruction order and the comp/dest/jump fields.',
          );
    }
    const { words } = assemble(source);
    if (!words.length) return fail('Write a program before running the checks.');
    const machine = createMachine(words);
    if (task.id === 'mult') {
      const pairs = [
        [0, 0],
        [0, 7],
        [8, 0],
        [1, 19],
        [7, 6],
        [13, 11],
        [31, 17],
        [127, 100],
      ];
      for (const [a, b] of pairs) {
        machine.reset();
        machine.ram[0] = a;
        machine.ram[1] = b;
        machine.ram[2] = 12345;
        machine.run(50000);
        if (machine.ram[2] !== a * b)
          return fail(`R0=${a}, R1=${b}: expected R2=${a * b}, got ${machine.ram[2]}.`);
      }
      return pass(pairs.length);
    }
    if (task.id === 'fill') {
      machine.screen.fill(0xaaaa);
      for (const key of [0, 65, 0, 32]) {
        machine.setKeyboard(key);
        machine.run(900000);
        const expected = key ? 65535 : 0;
        const bad = machine.screen.findIndex((value) => value !== expected);
        if (bad !== -1)
          return fail(
            `Keyboard ${key}: screen word ${bad} should be ${expected}; got ${machine.screen[bad]}.`,
          );
      }
      return pass(4);
    }
    return fail('No program contract found.');
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'The program could not be checked.');
  }
}
export const assemblerCases = [
  '@0\n@32767\nD=A\nM=D',
  '// names and forward labels\n@END\n0;JMP\n(LOOP)\n@counter\nM=M+1\n@LOOP\n0;JMP\n(END)\n@counter\nD=M',
  '@R0\n@R15\n@SP\n@LCL\n@ARG\n@THIS\n@THAT\n@SCREEN\n@KBD',
  [
    '0',
    '1',
    '-1',
    'D',
    'A',
    'M',
    '!D',
    '!A',
    '!M',
    '-D',
    '-A',
    '-M',
    'D+1',
    'A+1',
    'M+1',
    'D-1',
    'A-1',
    'M-1',
    'D+A',
    'D+M',
    'D-A',
    'D-M',
    'A-D',
    'M-D',
    'D&A',
    'D&M',
    'D|A',
    'D|M',
  ]
    .map((comp) => `AMD=${comp};JMP`)
    .join('\n'),
  ['', 'JGT', 'JEQ', 'JGE', 'JLT', 'JNE', 'JLE', 'JMP']
    .map((jump) => `D${jump ? ';' + jump : ''}`)
    .join('\n'),
  ['M', 'D', 'MD', 'A', 'AM', 'AD', 'AMD'].map((dest) => `${dest}=D`).join('\n'),
  '  @foo // allocate16\n D = M \n @bar\n M = D + 1 \n @foo\n D=M\n (last)\n @last\n 0;JMP\n',
];
export function gradeAssemblerOutputs(outputs: unknown): CheckResult {
  if (!Array.isArray(outputs) || outputs.length !== assemblerCases.length)
    return fail('Return one translation for every test program.');
  for (let i = 0; i < assemblerCases.length; i++) {
    if (typeof outputs[i] !== 'string') return fail('assemble(source) must return a string.');
    const actual = outputs[i]
      .trim()
      .split(/\r?\n/)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .join('\n');
    const expected = assemble(assemblerCases[i]).binary;
    if (actual !== expected)
      return fail(
        `Translation ${i + 1} differs: ${['numeric A-instructions', 'labels and variables', 'predefined symbols', 'computation encodings', 'jump encodings', 'destination encodings', 'whitespace and repeated variables'][i]}.`,
      );
  }
  return pass(assemblerCases.length);
}

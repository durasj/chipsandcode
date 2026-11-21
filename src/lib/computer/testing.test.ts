import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { builtinContracts, compileHDL } from './hdl.js';
import { createHDLTest } from './testing.js';
const directory = new URL('./testing/official/', import.meta.url);
const files = Object.fromEntries(
  readdirSync(directory).map((name) => [name, readFileSync(new URL(name, directory), 'utf8')]),
);
function source(name: string) {
  const spec = builtinContracts[name];
  const pins = (widths: Record<string, number>) =>
    Object.entries(widths)
      .map(([pin, width]) => `${pin}${width > 1 ? `[${width}]` : ''}`)
      .join(',');
  return `CHIP ${name} { ${Object.keys(spec.inputs).length ? `IN ${pins(spec.inputs)};` : ''} ${Object.keys(spec.outputs).length ? `OUT ${pins(spec.outputs)};` : ''} PARTS: ${name}(${[...Object.keys(spec.inputs), ...Object.keys(spec.outputs)].map((pin) => `${pin}=${pin}`).join(',')}); }`;
}
const probe = () => compileHDL(source('Not16'));
describe('Production hardware test runner', () => {
  for (const file of Object.keys(files).filter(
    (file) => file.endsWith('.tst') && !file.startsWith('Memory'),
  )) {
    const name = file.slice(0, -4);
    const chip = name.startsWith('Computer')
      ? 'Computer'
      : name.startsWith('CPU')
        ? 'CPU'
        : name === 'ALU-nostat'
          ? 'ALU'
          : name;
    it(`runs official ${name}`, () => {
      const test = createHDLTest(compileHDL(source(chip)), files[file], { files });
      test.run(10000);
      expect(test.error).toBeNull();
      expect(
        test.failed,
        JSON.stringify(test.rows.filter((row) => row.pass === false).slice(0, 3)),
      ).toBe(0);
      expect(test.status).toBe('complete');
      expect(test.rows.length).toBeGreaterThan(0);
      expect(test.passed).toBe(test.rows.length);
    });
  }
  it('pauses an interactive keyboard condition, resumes after input, and handles echo punctuation', () => {
    const c = compileHDL(source('Memory'));
    const t = createHDLTest(
      c,
      'set address 24576; echo "Press K, then continue!"; while out <> 75 { eval; } clear-echo; output-list out%D1.6.1; output;',
    );
    t.run(10);
    expect(t.status).toBe('paused');
    expect(t.messages).toEqual(['Press K, then continue!']);
    c.setKeyboard(75);
    t.run();
    expect(t.status).toBe('complete');
    expect(t.messages).toEqual([]);
    expect(t.rows[0].values.out).toBe('75');
    expect(t.rows[0].pass).toBeNull();
  });
  it('runs the official interactive Memory script with controlled keyboard responses', () => {
    const c = compileHDL(source('Memory'));
    const t = createHDLTest(c, files['Memory.tst'], { files });
    t.run(1000);
    expect(t.status).toBe('paused');
    c.setKeyboard(75);
    t.run(1000);
    expect(t.status).toBe('paused');
    c.setKeyboard(89);
    t.run(1000);
    expect(t.error).toBeNull();
    expect(t.status).toBe('complete');
    expect(t.failed).toBe(0);
    expect(c.readMemory(16384 + 256 * 16)).toBeDefined();
  });
  it('supports stepping, nested and zero repeats, numeric formats, and complete-state controls', () => {
    const c = probe();
    const t = createHDLTest(
      c,
      '/* setup */ load Not16.hdl; set in %X00FF; output-list in%X1.4.1 out%B1.16.1; repeat 0 { eval; } repeat 2 { repeat 2 { eval; output; } }',
    );
    t.step();
    expect(t.status).toBe('paused');
    t.run();
    expect(t.status).toBe('complete');
    expect(t.rows).toHaveLength(4);
    expect(t.rows[0].values.in).toBe('00FF');
    expect(t.output).toContain('1111111100000000');
    t.run();
    expect(t.rows).toHaveLength(4);
    const clock = compileHDL(source('Register'));
    const state = createHDLTest(
      clock,
      'set Register[] %D-1; output-list out; output; set in 42; set load 1; ticktock; output;',
    );
    state.run();
    expect(state.rows.map((row) => row.values.out)).toEqual(['-1', '42']);
  });
  it('evaluates all numeric condition operators and bounded indefinite repeats', () => {
    for (const [condition, finish] of [
      ['in = 0', 1],
      ['in <= 0', 1],
      ['in >= 1', 0],
      ['in < 1', 1],
      ['in > 0', 0],
    ] as const) {
      const test = createHDLTest(
        probe(),
        `set in ${condition.startsWith('in >') ? 1 : 0}; while ${condition} { set in ${finish}; }`,
        { maxSteps: 10 },
      );
      test.run();
      expect(test.error).toBeNull();
    }
    const test = createHDLTest(probe(), 'repeat { eval; }', { maxSteps: 12 });
    test.run(4);
    expect(test.status).toBe('paused');
    test.run();
    expect(test.status).toBe('failed');
    expect(test.error).toContain('exceeded');
  });
  it('reports cell and row mismatches, supports wildcard values and files supplied directly', () => {
    const c = probe();
    const script = 'output-list in%B1.16.1 out%D1.6.1; output;';
    const t = createHDLTest(c, script, { compare: '|in|out|\n|0000000000000000|99|' });
    t.run();
    expect(t.failed).toBe(1);
    expect(t.rows[0].differences).toEqual(['out: expected 99, got -1.']);
    const wild = createHDLTest(c, script, { compare: '|in|out|\n|00000000********|******|' });
    wild.run();
    expect(wild.passed).toBe(1);
    const short = createHDLTest(c, script, { compare: '|in|out|\n|0|\n|0|' });
    short.run();
    expect(short.error).toContain('Expected 2 output rows');
    expect(short.rows[0].differences[0]).toContain('column count');
    const extra = createHDLTest(c, script + script, {
      compare: '|in|out|\n|****************|******|',
    });
    extra.run();
    expect(extra.rows[1].differences).toContain('Unexpected additional output row.');
  });
  it('loads array ROM files and handles keyboard assignment', () => {
    const c = compileHDL(source('Computer'));
    const t = createHDLTest(
      c,
      'ROM32K load Test.hack; set Keyboard 65; output-list Keyboard%D1.6.1; output;',
      { files: { 'Test.hack': [0, 0] } },
    );
    t.run();
    expect(t.error).toBeNull();
    expect(t.rows[0].values.Keyboard).toBe('65');
  });
});
describe('Test runner diagnostics', () => {
  it.each(['/*', 'echo "oops;', 'eval', '}', 'repeat 2 eval;', 'repeat 2 { }', 'repeat 2 { eval;'])(
    'rejects malformed script %s',
    (script) => expect(() => createHDLTest(probe(), script)).toThrow(),
  );
  it.each([
    ['vmstep;', 'Unsupported'],
    ['load Other.hdl;', 'compile CHIP'],
    ['compare-to missing.cmp;', 'expected output file'],
    ['ROM32K load absent.hack;', 'Provide ROM'],
    ['ROM32K load bad.hack;', '16-bit binary'],
    ['output;', 'output-list'],
    ['output-list out%Q1.6.1;', 'Invalid output'],
    ['output-list out%D1.999.1;', 'column dimensions'],
    ['output-list unknown;', 'No inspectable'],
    ['set in invalid;', 'numeric'],
    ['set x.y 1;', 'signal'],
    ['while nonsense { eval; }', 'condition'],
    ['output-list time%D1.4.1; output;', 'string formatting'],
  ])('reports %s', (script, error) => {
    const t = createHDLTest(probe(), script, { files: { 'bad.hack': 'no' } });
    t.run();
    expect(t.status).toBe('failed');
    expect(t.error).toContain(error);
  });
  it('resets inputs when loading a test and rejects prototype chip names', () => {
    const c = probe();
    c.evaluate({ in: 123 });
    const t = createHDLTest(c, 'load Not16.hdl; output-list in; output;');
    t.run();
    expect(t.rows[0].values.in).toBe('0');
    expect(() => compileHDL('CHIP P { PARTS: constructor(); }')).toThrow('Unknown chip');
  });
  it('edits and inspects individual bus bits without changing neighboring bits', () => {
    const c = probe();
    const t = createHDLTest(
      c,
      'set in[] 2; set in[15] 1; output-list in[15]%B1.1.1 out[15]%B1.1.1 in%D1.6.1; output; while in[15]=1 { set in[15] 0; } output;',
    );
    t.run();
    expect(t.error).toBeNull();
    expect(t.rows[0].values).toEqual({ 'in[15]': '1', 'out[15]': '0', in: '-32766' });
    expect(c.inputs.in).toBe(2);
    for (const script of ['set in[16] 1;', 'set in[0] 2;', 'output-list out[16];']) {
      const failed = createHDLTest(probe(), script);
      failed.run();
      expect(failed.status).toBe('failed');
    }
  });
  it('checks comparison format and execution budgets', () => {
    expect(() => createHDLTest(probe(), 'eval;', { compare: 'not a table' })).toThrow(
      'pipe-delimited',
    );
    expect(() => createHDLTest(probe(), 'eval;', { maxSteps: 0 })).toThrow('step limit');
    expect(() => createHDLTest(probe(), 'eval;').run(0)).toThrow('Run budget');
  });
  it('rejects invalid state access and changes halfway through a cycle', () => {
    const c = compileHDL(source('Register'));
    expect(() => c.getState('Other')).toThrow('No inspectable');
    expect(() => c.getState('Register', 1)).toThrow('Index');
    expect(() => c.setState('Other', 0)).toThrow('No inspectable');
    expect(() => c.setState('Register', 0, 1)).toThrow('Index');
    expect(() => c.setState('Register', 65536)).toThrow('16-bit');
    c.tick();
    expect(() => c.setState('Register', 0)).toThrow('complete clock');
    const cpu = compileHDL(source('CPU'));
    cpu.setState('DRegister', 7);
    expect(cpu.getState('DRegister')).toBe(7);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import * as hdl from '#lib/computer/hdl.js';
import { assemble } from '#lib/computer/hack.js';
import { courseChapters, permittedParts, chapterById, taskKey } from './data.js';
import {
  verifyHardware,
  verifyAssembly,
  expectedCombinational,
  assemblerCases,
  gradeAssemblerOutputs,
} from './verify.js';
const tasks = courseChapters.flatMap((chapter) => chapter.tasks);
const task = (id: string) => tasks.find((t) => t.id === id)!;
const originalCompile = hdl.compileHDL;
afterEach(() => vi.restoreAllMocks());
function builtinSource(t: ReturnType<typeof task>) {
  const decl = (pins: Record<string, number>) =>
    Object.entries(pins)
      .map(([k, w]) => `${k}${w > 1 ? `[${w}]` : ''}`)
      .join(',');
  return `CHIP Probe { ${Object.keys(t.inputs ?? {}).length ? `IN ${decl(t.inputs!)};` : ''} ${Object.keys(t.outputs ?? {}).length ? `OUT ${decl(t.outputs!)};` : ''} PARTS: ${t.chip}(${Object.keys(
    { ...t.inputs, ...t.outputs },
  )
    .map((k) => `${k}=${k}`)
    .join(',')}); }`;
}
describe('course construction contracts', () => {
  for (const t of tasks.filter((t) => t.kind === 'hdl'))
    it(`accepts the independent ${t.chip} reference behavior`, () => {
      const reference = originalCompile(builtinSource(t));
      vi.spyOn(hdl, 'compileHDL').mockReturnValue(reference);
      const result = verifyHardware(t, t.starter);
      expect(result, result.message).toMatchObject({ passed: true });
      expect(result.cases).toBeGreaterThan(0);
    });
  it('rejects a built-in shortcut, missing connections, changed interface, and an incorrect network', () => {
    expect(verifyHardware(task('not16'), builtinSource(task('not16'))).passed).toBe(false);
    expect(verifyHardware(task('not16'), task('not16').starter).passed).toBe(false);
    expect(
      verifyHardware(task('not16'), 'CHIP Wrong {IN a; OUT out; PARTS: Not(in=a,out=out);}')
        .message,
    ).toContain('widths unchanged');
    const source = `CHIP Not16 { IN in[16]; OUT out[16]; PARTS: ${Array.from({ length: 16 }, (_, i) => `And(a=in[${i}],b=true,out=out[${i}]);`).join('')} }`;
    expect(verifyHardware(task('not16'), source).message).toContain('expected');
  });
  it('checks a real user-built half adder and a clocked bit', () => {
    expect(
      verifyHardware(
        task('halfadder'),
        'CHIP HalfAdder {IN a,b; OUT sum,carry; PARTS: Xor(a=a,b=b,out=sum); And(a=a,b=b,out=carry);}',
      ).passed,
    ).toBe(true);
    expect(
      verifyHardware(
        task('bit'),
        'CHIP Bit {IN in,load; OUT out; PARTS: Mux(a=state,b=in,sel=load,out=next); DFF(in=next,out=state,out=out);}',
      ).passed,
    ).toBe(true);
  });
  it('rejects changed behavior in stateful circuits', () => {
    const reference = originalCompile(builtinSource(task('bit')));
    reference.tock = () => ({ out: 0 });
    vi.spyOn(hdl, 'compileHDL').mockReturnValue(reference);
    expect(verifyHardware(task('bit'), task('bit').starter).passed).toBe(false);
  });
  it('keeps project dependencies ordered and routes distinct', () => {
    expect(courseChapters.map((c) => c.project)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(chapterById('missing')).toBeUndefined();
    expect(taskKey(courseChapters[0], task('not16'))).toBe('buses/not16');
    expect(permittedParts(task('not16'))).not.toContain('ALU');
    expect(permittedParts(task('cpu'))).toContain('DRegister');
    expect(permittedParts(task('cpu'))).not.toContain('CPU');
    expect(permittedParts(task('assembler'))).toContain('Computer');
    expect(() => expectedCombinational('unknown', {})).toThrow();
    expect(verifyHardware(task('mult'), '').passed).toBe(false);
  });
});
describe('assembly learning verification', () => {
  it('checks both instruction translation tasks', () => {
    expect(verifyAssembly(task('instruction'), assemble('@21\nD=A').binary).passed).toBe(true);
    const encode = courseChapters[5].tasks[0];
    expect(verifyAssembly(encode, assemble('@7\nD=A\n@3\nD=D+A\n@0\nM=D').binary).passed).toBe(
      true,
    );
    expect(verifyAssembly(encode, '111').message).toContain('sixteen');
    expect(verifyAssembly(encode, '0000000000000000').passed).toBe(false);
  });
  it('requires correct first-pass labels and second-pass variable allocation', () => {
    expect(verifyAssembly(task('symbols'), '{"LOOP":0,"value":16,"END":4}').passed).toBe(true);
    expect(verifyAssembly(task('symbols'), '{}').passed).toBe(false);
    expect(verifyAssembly(task('symbols'), 'bad').passed).toBe(false);
  });
  it('does not award empty or incorrect assembly programs', () => {
    expect(verifyAssembly(task('mult'), '// nothing').passed).toBe(false);
    expect(verifyAssembly(task('mult'), '@0\n0;JMP').message).toContain('R0=');
    expect(verifyAssembly(task('fill'), '@0\n0;JMP').message).toContain('Keyboard 0');
    expect(verifyAssembly(task('mult'), '@-1').passed).toBe(false);
    expect(verifyAssembly(task('assembler'), '@0').passed).toBe(false);
  });
  it('grades assembler output independently, including every computation', () => {
    const outputs = assemblerCases.map((source) => assemble(source).binary);
    expect(gradeAssemblerOutputs(outputs)).toMatchObject({ passed: true, cases: 7 });
    expect(gradeAssemblerOutputs(null).passed).toBe(false);
    expect(gradeAssemblerOutputs([1, ...outputs.slice(1)]).passed).toBe(false);
    expect(gradeAssemblerOutputs(['', ...outputs.slice(1)]).message).toContain('numeric A');
  });
});

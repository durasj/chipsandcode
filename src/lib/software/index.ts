import { Err, isErr, Ok } from '@davidsouther/jiffies/result.ts';
import { compile } from './vendor/nand2tetris/jack/compiler.js';
import { VM } from './vendor/nand2tetris/languages/vm.js';
import type { VmInstruction } from './vendor/nand2tetris/languages/vm.js';
import type { CompilationError } from './vendor/nand2tetris/languages/base.js';
import { Vm } from './vendor/nand2tetris/vm/vm.js';

export interface SoftwareDiagnostic {
  file: string;
  line: number;
  column: number;
  message: string;
}
export class SoftwareError extends Error {
  constructor(public readonly diagnostics: SoftwareDiagnostic[]) {
    super(diagnostics.map((item) => `${item.file}:${item.line}: ${item.message}`).join('\n'));
    this.name = 'SoftwareError';
  }
}
function diagnostic(file: string, source: string, error: CompilationError): SoftwareDiagnostic {
  const start = error.span?.start ?? 0;
  return {
    file,
    line: error.span?.line ?? 1,
    column: start - source.lastIndexOf('\n', Math.max(0, start - 1)),
    message: error.message || 'Unable to process this source.',
  };
}
function normalizeFiles(
  files: Record<string, string>,
  extension: 'jack' | 'vm',
): Record<string, string> {
  const normalized: Record<string, string> = Object.create(null);
  if (Object.keys(files).length > 100) throw new Error('Load up to 100 source files at a time.');
  for (const [filename, source] of Object.entries(files)) {
    const name = filename.replace(new RegExp(`\\.${extension}$`), '');
    if (
      !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ||
      ['__proto__', 'constructor', 'prototype'].includes(name)
    )
      throw new SoftwareError([
        {
          file: filename,
          line: 1,
          column: 1,
          message: `Use a class filename such as Main.${extension}.`,
        },
      ]);
    if (Object.hasOwn(normalized, name))
      throw new SoftwareError([
        { file: filename, line: 1, column: 1, message: 'This class is loaded more than once.' },
      ]);
    if (source.length > 1_000_000)
      throw new Error('Each source file must be smaller than one million characters.');
    normalized[name] = source;
  }
  return normalized;
}
export function compileJack(files: Record<string, string>): {
  files: Record<string, string>;
  errors: SoftwareDiagnostic[];
} {
  let normalized: Record<string, string>;
  try {
    normalized = normalizeFiles(files, 'jack');
  } catch (error) {
    return {
      files: {},
      errors:
        error instanceof SoftwareError
          ? error.diagnostics
          : [{ file: 'Project', line: 1, column: 1, message: (error as Error).message }],
    };
  }
  if (!Object.keys(normalized).length)
    return {
      files: {},
      errors: [{ file: 'Project', line: 1, column: 1, message: 'Add a Jack class to compile.' }],
    };
  const results = compile(normalized),
    output: Record<string, string> = {},
    errors: SoftwareDiagnostic[] = [];
  for (const [name, result] of Object.entries(results)) {
    if (typeof result === 'string') output[`${name}.vm`] = result;
    else errors.push(diagnostic(`${name}.jack`, normalized[name], result));
  }
  // An errored project cannot accidentally run a mixture of old and partial output.
  return { files: errors.length ? {} : output, errors };
}
export interface VMPosition {
  file: string;
  line: number;
  command: string;
}
function commandText(op: VmInstruction): string {
  if (op.op === 'push' || op.op === 'pop') return `${op.op} ${op.segment} ${op.offset}`;
  if (op.op === 'function') return `function ${op.name} ${op.nVars}`;
  if (op.op === 'call') return `call ${op.name} ${op.nArgs}`;
  if (op.op === 'label' || op.op === 'goto' || op.op === 'if-goto') return `${op.op} ${op.label}`;
  return op.op;
}
export class VMRunner {
  private vm: Vm;
  private disposed = false;
  private failed = false;
  cycles = 0;
  constructor(private readonly files: Record<string, string>) {
    const normalized = normalizeFiles(files, 'vm');
    if (!Object.keys(normalized).length)
      throw new SoftwareError([
        { file: 'Project', line: 1, column: 1, message: 'Add a VM file to load.' },
      ]);
    const parsed = Object.entries(normalized).map(([name, source]) => {
      const result = VM.parse(source);
      if (isErr(result)) throw new SoftwareError([diagnostic(`${name}.vm`, source, Err(result))]);
      return { name, instructions: Ok(result).instructions };
    });
    const built = Vm.buildFromFiles(parsed);
    if (isErr(built)) throw new SoftwareError([diagnostic('Project', '', Err(built))]);
    this.vm = Ok(built);
    this.files = normalized;
  }
  get halted(): boolean {
    return this.disposed || this.failed || this.vm.halted;
  }
  get blocked(): boolean {
    return !this.halted && this.vm.blocked;
  }
  get current(): VMPosition | null {
    if (this.halted) return null;
    const op = this.vm.operation;
    if (!op) return null;
    const className = this.vm.currentFunction?.name.split('.')[0];
    const file = Object.hasOwn(this.files, className)
      ? `${className}.vm`
      : `${Object.keys(this.files)[0]}.vm`;
    return { file, line: op.span?.line ?? 1, command: commandText(op) };
  }
  get stack(): number[] {
    return this.vm.memory.range(256, Math.max(256, Math.min(16384, this.vm.memory.SP)));
  }
  get segments(): { SP: number; LCL: number; ARG: number; THIS: number; THAT: number } {
    const m = this.vm.memory;
    return { SP: m.SP, LCL: m.LCL, ARG: m.ARG, THIS: m.THIS, THAT: m.THAT };
  }
  get callStack(): string[] {
    return this.vm.executionStack.map((frame) => frame.function);
  }
  get screen(): Uint16Array {
    return Uint16Array.from(this.vm.Screen.range());
  }
  read(address: number): number {
    this.assertAddress(address);
    return this.vm.memory.get(address);
  }
  write(address: number, value: number): void {
    this.assertAddress(address);
    if (address === 24576)
      throw new Error('Use the keyboard control to change the read-only keyboard input.');
    if (!Number.isInteger(value) || value < -32768 || value > 65535)
      throw new Error('Enter a 16-bit word.');
    this.vm.memory.set(address, value);
  }
  private assertAddress(address: number): void {
    if (!Number.isInteger(address) || address < 0 || address > 24576)
      throw new Error('Choose a memory address from 0 to 24576.');
  }
  setKeyboard(code: number): void {
    if (!Number.isInteger(code) || code < 0 || code > 32767)
      throw new Error('Keyboard code must be between 0 and 32767.');
    this.vm.Keyboard.set(0, code);
  }
  step(): void {
    if (this.halted || this.blocked) return;
    const position = this.current;
    try {
      this.vm.step();
      this.cycles++;
      if (this.vm.exitCode !== 0)
        throw new Error(`Jack OS stopped with error ${this.vm.exitCode}.`);
    } catch (error) {
      this.failed = true;
      this.vm.dispose();
      throw new SoftwareError([
        {
          file: position?.file ?? 'Project',
          line: position?.line ?? 1,
          column: 1,
          message: (error as Error).message || String(error),
        },
      ]);
    }
  }
  run(limit: number): void {
    if (!Number.isInteger(limit) || limit < 0 || limit > 100_000)
      throw new Error('Run between 0 and 100000 VM operations at a time.');
    for (let n = 0; n < limit && !this.halted && !this.blocked; n++) this.step();
  }
  reset(): void {
    this.vm.reset();
    this.disposed = false;
    this.failed = false;
    this.cycles = 0;
  }
  dispose(): void {
    this.vm.dispose();
    this.disposed = true;
  }
}
export const createVM = (files: Record<string, string>) => new VMRunner(files);

/** Hack architecture, Chapters 4–6 of Nand2Tetris. Independent browser implementation.
 * Words are unsigned internally; signed comparisons interpret two's-complement values.
 */
export const HACK_COMP: Readonly<Record<string, number>> = Object.freeze({
  '0': 0b0101010,
  '1': 0b0111111,
  '-1': 0b0111010,
  D: 0b0001100,
  A: 0b0110000,
  '!D': 0b0001101,
  '!A': 0b0110001,
  '-D': 0b0001111,
  '-A': 0b0110011,
  'D+1': 0b0011111,
  'A+1': 0b0110111,
  'D-1': 0b0001110,
  'A-1': 0b0110010,
  'D+A': 0b0000010,
  'D-A': 0b0010011,
  'A-D': 0b0000111,
  'D&A': 0b0000000,
  'D|A': 0b0010101,
  M: 0b1110000,
  '!M': 0b1110001,
  '-M': 0b1110011,
  'M+1': 0b1110111,
  'M-1': 0b1110010,
  'D+M': 0b1000010,
  'D-M': 0b1010011,
  'M-D': 0b1000111,
  'D&M': 0b1000000,
  'D|M': 0b1010101,
});
export const HACK_DEST: Readonly<Record<string, number>> = Object.freeze({
  '': 0,
  M: 1,
  D: 2,
  MD: 3,
  A: 4,
  AM: 5,
  AD: 6,
  AMD: 7,
});
export const HACK_JUMP: Readonly<Record<string, number>> = Object.freeze({
  '': 0,
  JGT: 1,
  JEQ: 2,
  JGE: 3,
  JLT: 4,
  JNE: 5,
  JLE: 6,
  JMP: 7,
});

export class AssemblyError extends Error {
  constructor(
    message: string,
    public readonly line: number,
  ) {
    super(`Line ${line}: ${message}`);
    this.name = 'AssemblyError';
  }
}
export interface AssemblyInstruction {
  address: number;
  line: number;
  source: string;
  type: 'A' | 'C';
  word: number;
}
export interface AssemblyResult {
  words: number[];
  binary: string;
  symbols: Record<string, number>;
  /** One-based source line for each ROM address. */
  sourceMap: number[];
  instructions: AssemblyInstruction[];
}
const symbolPattern = /^[A-Za-z_.$:][A-Za-z0-9_.$:]*$/;
const has = (record: Readonly<Record<string, number>>, key: string) =>
  Object.prototype.hasOwnProperty.call(record, key);

export function binary16(value: number): string {
  return (value & 0xffff).toString(2).padStart(16, '0');
}
export function signed16(value: number): number {
  return (value << 16) >> 16;
}
export function predefinedSymbols(): Record<string, number> {
  const symbols: Record<string, number> = Object.assign(Object.create(null), {
    SP: 0,
    LCL: 1,
    ARG: 2,
    THIS: 3,
    THAT: 4,
    SCREEN: 16384,
    KBD: 24576,
  });
  for (let i = 0; i < 16; i++) symbols[`R${i}`] = i;
  return symbols;
}

/** Two passes: collect ROM labels, then allocate variables and encode instructions. */
export function assemble(source: string): AssemblyResult {
  const symbols = predefinedSymbols();
  const commands: { source: string; line: number }[] = [];
  source.split(/\r?\n/).forEach((raw, index) => {
    const line = index + 1;
    const text = raw.replace(/\/\/.*$/, '').replace(/\s/g, '');
    if (!text) return;
    if (text.startsWith('(')) {
      const match = /^\(([^()]+)\)$/.exec(text);
      if (!match || !symbolPattern.test(match[1]))
        throw new AssemblyError('Use a valid label inside parentheses.', line);
      const name = match[1];
      if (has(symbols, name)) throw new AssemblyError(`Symbol ${name} is already defined.`, line);
      if (commands.length >= 32768)
        throw new AssemblyError('Label exceeds the 15-bit ROM address space.', line);
      symbols[name] = commands.length;
    } else {
      if (commands.length >= 32768)
        throw new AssemblyError('A program can contain at most 32768 instructions.', line);
      commands.push({ source: text, line });
    }
  });
  let nextVariable = 16;
  const instructions: AssemblyInstruction[] = commands.map(({ source: text, line }, address) => {
    if (text.startsWith('@')) {
      const operand = text.slice(1);
      let value: number;
      if (/^\d+$/.test(operand)) {
        value = Number(operand);
        if (!Number.isSafeInteger(value) || value > 32767)
          throw new AssemblyError('An A-instruction needs an address from 0 to 32767.', line);
      } else {
        if (!symbolPattern.test(operand))
          throw new AssemblyError('Expected a decimal address or a valid symbol after @.', line);
        if (!has(symbols, operand)) {
          if (nextVariable >= 16384)
            throw new AssemblyError('Variable allocation would overlap screen memory.', line);
          symbols[operand] = nextVariable++;
        }
        value = symbols[operand];
      }
      return { address, line, source: text, type: 'A', word: value };
    }
    const match = /^(?:([^=;]+)=)?([^=;]+)(?:;([^=;]+))?$/.exec(text);
    if (!match)
      throw new AssemblyError('Expected dest=comp;jump, with destination and jump optional.', line);
    const [, destination = '', computation, jump = ''] = match;
    if (!/^[ADM]*$/.test(destination) || new Set(destination).size !== destination.length)
      throw new AssemblyError(
        `Unknown destination ${destination}. Use A, D, M, or a combination without repeats.`,
        line,
      );
    if (!has(HACK_COMP, computation))
      throw new AssemblyError(`Unknown computation ${computation}.`, line);
    if (!has(HACK_JUMP, jump)) throw new AssemblyError(`Unknown jump ${jump}.`, line);
    // The official symbol-free fixtures also use DM; destinations are a set of registers.
    const destinationBits =
      (destination.includes('A') ? 4 : 0) |
      (destination.includes('D') ? 2 : 0) |
      (destination.includes('M') ? 1 : 0);
    const word = 0xe000 | (HACK_COMP[computation] << 6) | (destinationBits << 3) | HACK_JUMP[jump];
    return { address, line, source: text, type: 'C', word };
  });
  const words = instructions.map((item) => item.word);
  return {
    words,
    binary: words.map(binary16).join('\n'),
    symbols,
    sourceMap: instructions.map((item) => item.line),
    instructions,
  };
}

/** Parse a .hack file; blank lines are ignored, every other line must have 16 bits. */
export function parseHack(source: string): number[] {
  const words: number[] = [];
  source.split(/\r?\n/).forEach((raw, index) => {
    const value = raw.trim();
    if (!value) return;
    if (!/^[01]{16}$/.test(value))
      throw new AssemblyError(
        'A machine-code line must contain exactly 16 binary digits.',
        index + 1,
      );
    if (words.length >= 32768)
      throw new AssemblyError('A program can contain at most 32768 instructions.', index + 1);
    words.push(parseInt(value, 2));
  });
  return words;
}

export function disassemble(word: number): string {
  if (!(word & 0x8000)) return `@${word & 0x7fff}`;
  const computation = Object.keys(HACK_COMP).find((key) => HACK_COMP[key] === ((word >> 6) & 127));
  if (!computation || (word & 0xe000) !== 0xe000) return binary16(word);
  const destination = Object.keys(HACK_DEST).find((key) => HACK_DEST[key] === ((word >> 3) & 7))!;
  const jump = Object.keys(HACK_JUMP).find((key) => HACK_JUMP[key] === (word & 7))!;
  return `${destination ? `${destination}=` : ''}${computation}${jump ? `;${jump}` : ''}`;
}

export interface ALUResult {
  out: number;
  zr: number;
  ng: number;
}
/** control bits, from high to low: zx nx zy ny f no. */
export function alu(x: number, y: number, control: number): ALUResult {
  x &= 0xffff;
  y &= 0xffff;
  if (control & 32) x = 0;
  if (control & 16) x = ~x & 0xffff;
  if (control & 8) y = 0;
  if (control & 4) y = ~y & 0xffff;
  let out = (control & 2 ? x + y : x & y) & 0xffff;
  if (control & 1) out = ~out & 0xffff;
  return { out, zr: Number(out === 0), ng: (out >>> 15) & 1 };
}
export interface CPUState {
  a: number;
  d: number;
  pc: number;
}
export interface CPUResult extends CPUState {
  outM: number;
  writeM: boolean;
  addressM: number;
  jumped: boolean;
}

/** One clock cycle, including simultaneous destinations and PC update. */
export function cpuStep(
  state: CPUState,
  instruction: number,
  inM: number,
  reset = false,
): CPUResult {
  const oldA = state.a & 0xffff;
  const addressM = oldA & 0x7fff;
  const isCompute = !!(instruction & 0x8000);
  // The combinational ALU output remains defined on A-instructions, but writeM is false.
  const result = alu(state.d, instruction & 0x1000 ? inM : oldA, (instruction >> 6) & 63);
  const signed = signed16(result.out);
  const jump = instruction & 7;
  const jumped =
    isCompute &&
    !!((jump & 4 && signed < 0) || (jump & 2 && signed === 0) || (jump & 1 && signed > 0));
  return {
    a: isCompute ? (instruction & 32 ? result.out : oldA) : instruction & 0x7fff,
    d: isCompute && instruction & 16 ? result.out : state.d & 0xffff,
    pc: reset ? 0 : jumped ? addressM : (state.pc + 1) & 0x7fff,
    outM: result.out,
    writeM: isCompute && !!(instruction & 8),
    addressM,
    jumped: !reset && jumped,
  };
}
export interface StepTrace {
  cycle: number;
  before: CPUState;
  after: CPUState;
  instruction: number;
  addressM: number;
  inM: number;
  outM: number;
  writeM: boolean;
  jumped: boolean;
}

export class HackMachine {
  a = 0;
  d = 0;
  pc = 0;
  cycles = 0;
  keyboard = 0;
  readonly ram = new Uint16Array(16384);
  readonly screen = new Uint16Array(8192);
  readonly rom: Uint16Array;
  readonly programLength: number;
  constructor(words: readonly number[]) {
    if (
      words.length > 32768 ||
      words.some((word) => !Number.isInteger(word) || word < 0 || word > 65535)
    )
      throw new Error('ROM accepts at most 32768 unsigned 16-bit words.');
    this.rom = new Uint16Array(32768);
    this.rom.set(words);
    this.programLength = words.length;
  }
  /** Simulator convenience: stop at the end of the loaded program; Hack has no HALT instruction. */
  get halted(): boolean {
    return this.pc >= this.programLength;
  }
  read(address: number): number {
    address &= 0x7fff;
    if (address < 16384) return this.ram[address];
    if (address < 24576) return this.screen[address - 16384];
    if (address === 24576) return this.keyboard & 0xffff;
    return 0; // Addresses above KBD are outside the specified address space.
  }
  write(address: number, value: number): void {
    address &= 0x7fff;
    if (address < 16384) this.ram[address] = value & 0xffff;
    else if (address < 24576) this.screen[address - 16384] = value & 0xffff;
    // Keyboard is read-only; writes outside RAM/screen do nothing.
  }
  setKeyboard(value: number): void {
    if (!Number.isInteger(value) || value < 0 || value > 32767)
      throw new Error('Keyboard code must be an integer from 0 to 32767.');
    this.keyboard = value;
  }
  step(reset = false): StepTrace | null {
    if (this.halted) {
      if (reset) this.pc = 0;
      return null;
    }
    const before = { a: this.a, d: this.d, pc: this.pc };
    const instruction = this.rom[this.pc];
    const inM = this.read(this.a);
    const result = cpuStep(before, instruction, inM, reset);
    if (result.writeM) this.write(result.addressM, result.outM);
    this.a = result.a;
    this.d = result.d;
    this.pc = result.pc;
    this.cycles++;
    return {
      cycle: this.cycles,
      before,
      after: { a: this.a, d: this.d, pc: this.pc },
      instruction,
      inM,
      addressM: result.addressM,
      outM: result.outM,
      writeM: result.writeM,
      jumped: result.jumped,
    };
  }
  run(limit: number): StepTrace | null {
    if (!Number.isInteger(limit) || limit < 0 || limit > 1_000_000)
      throw new Error('Run between 0 and 1000000 cycles at a time.');
    let last: StepTrace | null = null;
    for (let i = 0; i < limit && !this.halted; i++) last = this.step();
    return last;
  }
  reset(clearMemory = true): void {
    this.a = 0;
    this.d = 0;
    this.pc = 0;
    this.cycles = 0;
    if (clearMemory) {
      this.ram.fill(0);
      this.screen.fill(0);
      this.keyboard = 0;
    }
  }
}
export const createMachine = (words: readonly number[]) => new HackMachine(words);

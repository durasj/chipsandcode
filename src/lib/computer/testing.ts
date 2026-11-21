/** Bounded structural HDL test-script runner, compatible with the Part I TDL commands. */
import type { HDLCircuit } from './hdl.js';
export class HDLTestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HDLTestError';
  }
}
export type HDLTestOptions = {
  compare?: string;
  files?: Record<string, string | number[]>;
  maxSteps?: number;
};
export type HDLTestRow = {
  values: Record<string, string>;
  pass: boolean | null;
  differences: string[];
};
export interface HDLTestSession {
  rows: HDLTestRow[];
  output: string;
  messages: string[];
  error: string | null;
  passed: number;
  failed: number;
  done: boolean;
  status: 'ready' | 'running' | 'paused' | 'complete' | 'failed';
  step(): void;
  run(budget?: number): void;
}
type Node =
  | { kind: 'command'; text: string }
  | { kind: 'repeat'; count: number | null; body: Node[] }
  | { kind: 'while'; condition: string; body: Node[] };
type Frame = { nodes: Node[]; index: number; remaining: number | null; condition?: string };
type Format = { name: string; style: string; left: number; width: number; right: number };
function parseScript(source: string): Node[] {
  const pieces: string[] = [];
  let chunk = '',
    quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"' && source[i - 1] !== '\\') {
      quoted = !quoted;
      chunk += char;
      continue;
    }
    if (!quoted && char === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      chunk += ' ';
      continue;
    }
    if (!quoted && char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      if (end < 0) throw new HDLTestError('Unterminated comment.');
      i = end + 1;
      chunk += ' ';
      continue;
    }
    if (!quoted && '{};,!'.includes(char)) {
      if (chunk.trim()) pieces.push(chunk.trim());
      pieces.push(char);
      chunk = '';
    } else chunk += char;
  }
  if (quoted) throw new HDLTestError('Unterminated quoted message.');
  if (chunk.trim()) pieces.push(chunk.trim());
  let pos = 0;
  function block(nested = false, depth = 0): Node[] {
    if (depth > 32) throw new HDLTestError('Test loops are nested too deeply.');
    const nodes: Node[] = [];
    while (pos < pieces.length) {
      const text = pieces[pos++];
      if (text === '}') {
        if (!nested) throw new HDLTestError('Unexpected closing brace.');
        return nodes;
      }
      if (/[;,!]/.test(text) && text.length === 1) continue;
      const repeat = text.match(/^repeat(?:\s+(\d+))?$/),
        condition = text.match(/^while\s+(.+)$/);
      if (repeat || condition) {
        if (pieces[pos++] !== '{') throw new HDLTestError('Expected a loop body in braces.');
        const body = block(true, depth + 1);
        if (!body.length) throw new HDLTestError('Loop bodies must contain a command.');
        nodes.push(
          repeat
            ? { kind: 'repeat', count: repeat[1] === undefined ? null : Number(repeat[1]), body }
            : { kind: 'while', condition: condition![1], body },
        );
      } else {
        if (/^repeat\b|^while\b/.test(text)) throw new HDLTestError('Invalid loop declaration.');
        if (![';', ',', '!'].includes(pieces[pos] ?? ''))
          throw new HDLTestError(`Missing separator after ${text}.`);
        pos++;
        nodes.push({ kind: 'command', text });
      }
    }
    if (nested) throw new HDLTestError('Unclosed loop body.');
    return nodes;
  }
  return block();
}
function numeric(value: string): number {
  if (/^%B[01]+$/i.test(value)) return parseInt(value.slice(2), 2);
  if (/^%X[\da-f]+$/i.test(value)) return parseInt(value.slice(2), 16);
  if (/^%D-?\d+$/i.test(value)) return Number(value.slice(2));
  if (/^-?\d+$/.test(value)) return Number(value);
  throw new HDLTestError(`Invalid numeric value ${value}.`);
}
export function createHDLTest(
  circuit: HDLCircuit,
  script: string,
  options: HDLTestOptions = {},
): HDLTestSession {
  const nodes = parseScript(script),
    frames: Frame[] = [{ nodes, index: 0, remaining: 1 }];
  const maximum = options.maxSteps ?? 200000;
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 1000000)
    throw new HDLTestError('Test step limit must be between 1 and 1,000,000.');
  let steps = 0,
    halfClock = 0,
    formats: Format[] = [],
    compareRows: string[][] | null = null,
    headerWritten = false;
  function loadCompare(source: string) {
    const rows = source
      .trim()
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) =>
        line
          .split('|')
          .slice(1, -1)
          .map((value) => value.trim()),
      );
    if (!rows.length || rows.some((row) => row.length === 0))
      throw new HDLTestError('Expected output must be a pipe-delimited comparison table.');
    rows.shift();
    compareRows = rows;
  }
  if (options.compare?.trim()) loadCompare(options.compare);
  const session: HDLTestSession = {
    rows: [],
    output: '',
    messages: [],
    error: null,
    passed: 0,
    failed: 0,
    done: false,
    status: 'ready',
    step() {
      advance(1);
    },
    run(budget = 10000) {
      if (!Number.isInteger(budget) || budget < 1 || budget > 1000000)
        throw new HDLTestError('Run budget must be between 1 and 1,000,000.');
      advance(budget);
    },
  };
  const reference = (name: string) => {
    const match = name.match(/^([A-Za-z_]\w*)(?:\[(\d*)\])?$/);
    if (!match) throw new HDLTestError(`Invalid signal ${name}.`);
    return {
      name: match[1],
      index: match[2] === undefined || match[2] === '' ? undefined : Number(match[2]),
      indexed: match[2] !== undefined,
    };
  };
  function value(name: string): number | string {
    if (name === 'time') return `${Math.floor(halfClock / 2)}${halfClock % 2 ? '+' : ''}`;
    const ref = reference(name);
    const pin = circuit.inputs[ref.name] ?? circuit.outputs[ref.name];
    if (pin !== undefined) {
      if (ref.index === undefined) return pin;
      const width = circuit.inputWidths[ref.name] ?? circuit.outputWidths[ref.name];
      if (ref.index >= width) throw new HDLTestError(`Bit index exceeds ${ref.name}.`);
      return (pin >>> ref.index) & 1;
    }
    if (ref.name === 'Keyboard') return circuit.readMemory(24576);
    return circuit.getState(ref.name, ref.index);
  }
  function condition(expression: string): boolean {
    const match = expression.match(/^([\w%[\]-]+)\s*(<>|<=|>=|=|<|>)\s*([\w%[\]-]+)$/);
    if (!match) throw new HDLTestError(`Invalid while condition ${expression}.`);
    const operand = (text: string) =>
      /^-?\d|^%[BDX]/i.test(text) ? numeric(text) : Number(value(text));
    const left = operand(match[1]),
      right = operand(match[3]);
    if (!Number.isFinite(left) || !Number.isFinite(right))
      throw new HDLTestError('While conditions require numeric values.');
    return match[2] === '='
      ? left === right
      : match[2] === '<>'
        ? left !== right
        : match[2] === '<'
          ? left < right
          : match[2] === '>'
            ? left > right
            : match[2] === '<='
              ? left <= right
              : left >= right;
  }
  function next(): string | null {
    while (frames.length) {
      if (++steps > maximum)
        throw new HDLTestError(
          `Test exceeded ${maximum} steps. Check its loops or keyboard condition.`,
        );
      const frame = frames[frames.length - 1];
      if (frame.index >= frame.nodes.length) {
        if (
          frame.condition !== undefined
            ? condition(frame.condition)
            : frame.remaining === null || --frame.remaining > 0
        ) {
          frame.index = 0;
          continue;
        }
        frames.pop();
        continue;
      }
      const node = frame.nodes[frame.index++];
      if (node.kind === 'command') return node.text;
      if (node.kind === 'repeat') {
        if (node.count !== 0) frames.push({ nodes: node.body, index: 0, remaining: node.count });
      } else if (condition(node.condition))
        frames.push({ nodes: node.body, index: 0, remaining: 1, condition: node.condition });
    }
    return null;
  }
  function output() {
    if (!formats.length) throw new HDLTestError('Declare output-list before output.');
    if (session.rows.length >= 10000)
      throw new HDLTestError('Test output is limited to 10,000 rows.');
    const cells = formats.map((format) => {
      const raw = value(format.name);
      if (format.style === 'S') return String(raw);
      if (typeof raw !== 'number')
        throw new HDLTestError(`Use string formatting for ${format.name}.`);
      if (format.style === 'B') return raw.toString(2).padStart(format.width, '0');
      if (format.style === 'X') return raw.toString(16).toUpperCase().padStart(format.width, '0');
      const width = circuit.inputWidths[format.name] ?? circuit.outputWidths[format.name] ?? 16;
      return String(width === 16 && raw >= 32768 ? raw - 65536 : raw);
    });
    const differences: string[] = [];
    if (compareRows) {
      const expected = compareRows[session.rows.length];
      if (!expected) differences.push('Unexpected additional output row.');
      else {
        if (expected.length !== cells.length) differences.push('Comparison column count differs.');
        cells.forEach((cell, i) => {
          const target = expected[i];
          if (target === undefined || /^\*+$/.test(target)) return;
          const pattern =
            '^' + target.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.') + '$';
          if (!new RegExp(pattern).test(cell))
            differences.push(`${formats[i].name}: expected ${target}, got ${cell}.`);
        });
      }
    }
    const pass = compareRows ? differences.length === 0 : null;
    session.rows.push({
      values: Object.fromEntries(formats.map((format, i) => [format.name, cells[i]])),
      pass,
      differences,
    });
    if (pass === true) session.passed++;
    if (pass === false) session.failed++;
    const render = (items: string[]) =>
      '|' +
      items
        .map(
          (cell, i) =>
            ' '.repeat(formats[i].left) +
            cell.padStart(formats[i].width, ' ') +
            ' '.repeat(formats[i].right),
        )
        .join('|') +
      '|\n';
    if (!headerWritten) {
      session.output += render(formats.map((format) => format.name.slice(0, format.width)));
      headerWritten = true;
    }
    session.output += render(cells);
  }
  function command(text: string) {
    if (text === 'eval') {
      circuit.evaluate();
      return;
    }
    if (text === 'tick') {
      circuit.tick();
      halfClock++;
      return;
    }
    if (text === 'tock') {
      circuit.tock();
      halfClock++;
      return;
    }
    if (text === 'ticktock') {
      circuit.cycle();
      halfClock += 2;
      return;
    }
    if (text === 'output') {
      output();
      return;
    }
    if (text === 'clear-echo') {
      session.messages = [];
      return;
    }
    const echo = text.match(/^echo\s+("(?:\\.|[^"\\])*")$/);
    if (echo) {
      session.messages.push(JSON.parse(echo[1]));
      return;
    }
    const set = text.match(/^set\s+(\S+)\s+(\S+)$/);
    if (set) {
      const ref = reference(set[1]),
        number = numeric(set[2]);
      if (Object.hasOwn(circuit.inputWidths, ref.name)) {
        if (ref.index === undefined) circuit.evaluate({ [ref.name]: number });
        else {
          if (ref.index >= circuit.inputWidths[ref.name] || (number !== 0 && number !== 1))
            throw new HDLTestError('A bus-bit assignment needs an in-range index and 0 or 1.');
          circuit.evaluate({
            [ref.name]: (circuit.inputs[ref.name] & ~(1 << ref.index)) | (number << ref.index),
          });
        }
      } else if (ref.name === 'Keyboard') circuit.setKeyboard(number);
      else circuit.setState(ref.name, number, ref.index);
      return;
    }
    if (text.startsWith('output-list ')) {
      const entries = text.slice(12).trim().split(/\s+/);
      formats = entries.map((entry) => {
        const match = entry.match(/^([A-Za-z_]\w*(?:\[\d*\])?)(?:%([BDSX])(\d+)\.(\d+)\.(\d+))?$/);
        if (!match) throw new HDLTestError(`Invalid output format ${entry}.`);
        const result = {
          name: match[1],
          style: match[2] ?? 'D',
          left: Number(match[3] ?? 1),
          width: Number(match[4] ?? 6),
          right: Number(match[5] ?? 1),
        };
        if (result.width < 1 || result.width > 64 || result.left > 32 || result.right > 32)
          throw new HDLTestError('Output column dimensions are outside the supported range.');
        value(result.name);
        return result;
      });
      headerWritten = false;
      return;
    }
    const file = text.match(/^(load|output-file|compare-to|ROM32K\s+load)\s+([\w.$-]+)$/);
    if (file) {
      const [, operation, name] = file;
      if (operation === 'output-file') return;
      if (operation === 'load') {
        if (name !== `${circuit.name}.hdl`)
          throw new HDLTestError(
            `This script loads ${name}; compile CHIP ${name.replace(/\.hdl$/, '')} first.`,
          );
        circuit.reset();
        circuit.evaluate(
          Object.fromEntries(Object.keys(circuit.inputWidths).map((pin) => [pin, 0])),
        );
        halfClock = 0;
        return;
      }
      if (operation === 'compare-to') {
        if (options.compare?.trim()) return;
        const compare = options.files?.[name];
        if (typeof compare === 'string') loadCompare(compare);
        else throw new HDLTestError(`Provide the expected output file ${name}.`);
        return;
      }
      const source = options.files?.[name];
      if (source === undefined) throw new HDLTestError(`Provide ROM program ${name}.`);
      let words: number[];
      if (Array.isArray(source)) words = source;
      else {
        const lines = source
          .replace(/\/\/[^\n]*/g, '')
          .split(/\s+/)
          .filter(Boolean);
        if (lines.some((line) => !/^[01]{16}$/.test(line)))
          throw new HDLTestError(`${name} must contain 16-bit binary instructions.`);
        words = lines.map((line) => parseInt(line, 2));
      }
      circuit.loadROM(words);
      return;
    }
    throw new HDLTestError(`Unsupported test command: ${text}.`);
  }
  function advance(budget: number) {
    if (session.done) return;
    session.status = 'running';
    try {
      for (let i = 0; i < budget; i++) {
        const text = next();
        if (text === null) {
          session.done = true;
          if (compareRows && session.rows.length !== compareRows.length) {
            session.failed += Math.abs(compareRows.length - session.rows.length);
            session.error = `Expected ${compareRows.length} output rows; produced ${session.rows.length}.`;
          }
          session.status = session.failed ? 'failed' : 'complete';
          return;
        }
        command(text);
      }
      session.status = 'paused';
    } catch (error) {
      session.error = error instanceof Error ? error.message : String(error);
      session.status = 'failed';
      session.done = true;
    }
  }
  return session;
}

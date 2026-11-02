export const inputRows = [
  [false, false],
  [false, true],
  [true, false],
  [true, true],
] as const;

// The four digits are ordered by inputs 00, 01, 10, 11: AND is 0001.
export const booleanFunctions = [
  'Always 0',
  'AND',
  'a AND NOT b',
  'a',
  'NOT a AND b',
  'b',
  'XOR',
  'OR',
  'NOR',
  'Equivalence (XNOR)',
  'NOT b',
  'b implies a',
  'NOT a',
  'a implies b',
  'NAND',
  'Always 1',
] as const;

function assertFunction(mask: number) {
  if (!Number.isInteger(mask) || mask < 0 || mask > 15)
    throw new Error('A two-input function needs four binary outputs.');
}

export function evaluateFunction(mask: number, a: boolean, b: boolean): boolean {
  assertFunction(mask);
  const row = Number(a) * 2 + Number(b);
  return Boolean((mask >> (3 - row)) & 1);
}

export function functionSignature(mask: number): string {
  assertFunction(mask);
  return mask.toString(2).padStart(4, '0');
}

export function toggleFunctionRow(mask: number, row: number): number {
  assertFunction(mask);
  if (!Number.isInteger(row) || row < 0 || row > 3) throw new Error('Choose a row from 0 to 3.');
  return mask ^ (1 << (3 - row));
}

export function canonicalExpression(mask: number): string {
  assertFunction(mask);
  const terms = inputRows.flatMap(([a, b]) =>
    evaluateFunction(mask, a, b) ? [`(${a ? 'a' : 'NOT a'} AND ${b ? 'b' : 'NOT b'})`] : [],
  );
  return terms.length ? terms.join(' OR ') : '0';
}

export interface NandStep {
  id: string;
  a: string;
  b: string;
}

export interface NandConstruction {
  gates: NandStep[];
  output: string;
}

/** Build the canonical expression using only two-input NANDs, without constants. */
export function constructWithNand(mask: number): NandConstruction {
  assertFunction(mask);
  const gates: NandStep[] = [];
  const add = (a: string, b: string) => {
    const id = `n${gates.length + 1}`;
    gates.push({ id, a, b });
    return id;
  };
  const negations: Record<string, string> = {};
  const invert = (input: string) => (negations[input] ??= add(input, input));
  if (mask === 0) {
    const one = add('a', invert('a'));
    return { gates, output: add(one, one) };
  }
  const complements = inputRows.flatMap(([a, b]) =>
    evaluateFunction(mask, a, b) ? [add(a ? 'a' : invert('a'), b ? 'b' : invert('b'))] : [],
  );
  let output = invert(complements[0]);
  for (const complement of complements.slice(1)) output = add(invert(output), complement);
  return { gates, output };
}

export function evaluateNandConstruction(
  construction: NandConstruction,
  a: boolean,
  b: boolean,
): boolean {
  const signals: Record<string, boolean> = { a, b };
  for (const gate of construction.gates) {
    if (!(gate.a in signals) || !(gate.b in signals)) throw new Error('Unknown NAND input.');
    signals[gate.id] = !(signals[gate.a] && signals[gate.b]);
  }
  if (!(construction.output in signals)) throw new Error('Unknown NAND output.');
  return signals[construction.output];
}

export function nandHDL(construction: NandConstruction): string {
  const wire = (name: string) => (name === construction.output ? 'out' : name);
  const statements = construction.gates.map(
    (gate) => `    Nand(a=${wire(gate.a)}, b=${wire(gate.b)}, out=${wire(gate.id)});`,
  );
  return `CHIP Function2 {\n    IN a, b;\n    OUT out;\n\n    PARTS:\n${statements.join('\n')}\n}`;
}

export type BusComponent =
  | 'not16'
  | 'and16'
  | 'or16'
  | 'mux16'
  | 'or8way'
  | 'mux4way16'
  | 'mux8way16'
  | 'dmux4way'
  | 'dmux8way';

export const busComponents: { id: BusComponent; name: string; description: string }[] = [
  { id: 'not16', name: 'Not16', description: 'Invert every bit in a 16-bit word.' },
  { id: 'and16', name: 'And16', description: 'Keep a bit only when both input bits are 1.' },
  { id: 'or16', name: 'Or16', description: 'Set a bit when either input bit is 1.' },
  { id: 'mux16', name: 'Mux16', description: 'Choose one of two complete 16-bit words.' },
  {
    id: 'or8way',
    name: 'Or8Way',
    description: 'Combine eight bits into one answer: is any input 1?',
  },
  {
    id: 'mux4way16',
    name: 'Mux4Way16',
    description: 'Route one of four 16-bit words to the output.',
  },
  {
    id: 'mux8way16',
    name: 'Mux8Way16',
    description: 'Route one of eight 16-bit words to the output.',
  },
  { id: 'dmux4way', name: 'DMux4Way', description: 'Send one signal to one of four destinations.' },
  {
    id: 'dmux8way',
    name: 'DMux8Way',
    description: 'Send one signal to one of eight destinations.',
  },
];

export function parseWord(source: string, width = 16): { value: number | null; error: string } {
  const text = source.trim();
  if (!text) return { value: null, error: 'Enter a value.' };
  if (!/^(?:\d+|0x[\da-f]+|0b[01]+)$/i.test(text))
    return { value: null, error: 'Use decimal, 0x hex, or 0b binary.' };
  const value = Number(text);
  const max = 2 ** width - 1;
  if (!Number.isSafeInteger(value) || value > max)
    return { value: null, error: `Use a value from 0 to ${max.toLocaleString('en-US')}.` };
  return { value, error: '' };
}

export function binaryWord(value: number, width = 16): string {
  return value.toString(2).padStart(width, '0');
}

export function busInputNames(component: BusComponent): string[] {
  if (component === 'not16' || component === 'or8way' || component.startsWith('dmux'))
    return ['in'];
  const count = component === 'mux8way16' ? 8 : component === 'mux4way16' ? 4 : 2;
  return Array.from({ length: count }, (_, index) => String.fromCharCode(97 + index));
}

export function busSelectorCount(component: BusComponent): number {
  if (component === 'mux16') return 2;
  if (component === 'mux4way16' || component === 'dmux4way') return 4;
  if (component === 'mux8way16' || component === 'dmux8way') return 8;
  return 0;
}

export function simulateBus(
  component: BusComponent,
  inputs: Record<string, number>,
  selector = 0,
): Record<string, number> {
  const names = busInputNames(component);
  const width = component === 'or8way' ? 8 : component.startsWith('dmux') ? 1 : 16;
  for (const name of names) {
    const value = inputs[name];
    if (!Number.isInteger(value) || value < 0 || value >= 2 ** width)
      throw new Error(`Input ${name} must be an unsigned ${width}-bit value.`);
  }
  const choices = busSelectorCount(component);
  if (choices && (!Number.isInteger(selector) || selector < 0 || selector >= choices))
    throw new Error(`Selector must be between 0 and ${choices - 1}.`);
  switch (component) {
    case 'not16':
      return { out: ~inputs.in & 0xffff };
    case 'and16':
      return { out: inputs.a & inputs.b };
    case 'or16':
      return { out: inputs.a | inputs.b };
    case 'or8way':
      return { out: Number(inputs.in !== 0) };
    case 'mux16':
    case 'mux4way16':
    case 'mux8way16':
      return { out: inputs[names[selector]] };
    case 'dmux4way':
    case 'dmux8way':
      return Object.fromEntries(
        Array.from({ length: choices }, (_, index) => [
          String.fromCharCode(97 + index),
          index === selector ? inputs.in : 0,
        ]),
      );
  }
}

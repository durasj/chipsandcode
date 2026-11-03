/** Educational HDL interpreter. Nets carry unsigned words; state changes only at tock. */
import { alu, cpuStep } from './hack.js';
export class HDLError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HDLError';
  }
}
export type PinWidths = Record<string, number>;
export type PinValues = Record<string, number>;
export interface ChipContract {
  inputs: PinWidths;
  outputs: PinWidths;
}
const contract = (inputs: PinWidths, outputs: PinWidths): ChipContract => ({ inputs, outputs });
export const builtinContracts: Record<string, ChipContract> = {
  Nand: contract({ a: 1, b: 1 }, { out: 1 }),
  Not: contract({ in: 1 }, { out: 1 }),
  And: contract({ a: 1, b: 1 }, { out: 1 }),
  Or: contract({ a: 1, b: 1 }, { out: 1 }),
  Xor: contract({ a: 1, b: 1 }, { out: 1 }),
  Mux: contract({ a: 1, b: 1, sel: 1 }, { out: 1 }),
  DMux: contract({ in: 1, sel: 1 }, { a: 1, b: 1 }),
  Not16: contract({ in: 16 }, { out: 16 }),
  And16: contract({ a: 16, b: 16 }, { out: 16 }),
  Or16: contract({ a: 16, b: 16 }, { out: 16 }),
  Mux16: contract({ a: 16, b: 16, sel: 1 }, { out: 16 }),
  Or8Way: contract({ in: 8 }, { out: 1 }),
  Mux4Way16: contract({ a: 16, b: 16, c: 16, d: 16, sel: 2 }, { out: 16 }),
  Mux8Way16: contract(
    { a: 16, b: 16, c: 16, d: 16, e: 16, f: 16, g: 16, h: 16, sel: 3 },
    { out: 16 },
  ),
  DMux4Way: contract({ in: 1, sel: 2 }, { a: 1, b: 1, c: 1, d: 1 }),
  DMux8Way: contract({ in: 1, sel: 3 }, { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1 }),
  HalfAdder: contract({ a: 1, b: 1 }, { sum: 1, carry: 1 }),
  FullAdder: contract({ a: 1, b: 1, c: 1 }, { sum: 1, carry: 1 }),
  Add16: contract({ a: 16, b: 16 }, { out: 16 }),
  Inc16: contract({ in: 16 }, { out: 16 }),
  ALU: contract(
    { x: 16, y: 16, zx: 1, nx: 1, zy: 1, ny: 1, f: 1, no: 1 },
    { out: 16, zr: 1, ng: 1 },
  ),
  DFF: contract({ in: 1 }, { out: 1 }),
  Bit: contract({ in: 1, load: 1 }, { out: 1 }),
  Register: contract({ in: 16, load: 1 }, { out: 16 }),
  ARegister: contract({ in: 16, load: 1 }, { out: 16 }),
  DRegister: contract({ in: 16, load: 1 }, { out: 16 }),
  PC: contract({ in: 16, load: 1, inc: 1, reset: 1 }, { out: 16 }),
  RAM8: contract({ in: 16, load: 1, address: 3 }, { out: 16 }),
  RAM64: contract({ in: 16, load: 1, address: 6 }, { out: 16 }),
  RAM512: contract({ in: 16, load: 1, address: 9 }, { out: 16 }),
  RAM4K: contract({ in: 16, load: 1, address: 12 }, { out: 16 }),
  RAM16K: contract({ in: 16, load: 1, address: 14 }, { out: 16 }),
  Screen: contract({ in: 16, load: 1, address: 13 }, { out: 16 }),
  Keyboard: contract({}, { out: 16 }),
  ROM32K: contract({ address: 15 }, { out: 16 }),
  Memory: contract({ in: 16, load: 1, address: 15 }, { out: 16 }),
  CPU: contract(
    { inM: 16, instruction: 16, reset: 1 },
    { outM: 16, writeM: 1, addressM: 15, pc: 15 },
  ),
  Computer: contract({ reset: 1 }, {}),
};
type Ref = { name: string; low?: number; high?: number };
type Connection = { pin: Ref; net: Ref };
type Part = { name: string; connections: Connection[] };
type Definition = ChipContract & { name: string; parts: Part[] };
const mask = (width: number) => 2 ** width - 1;
function parse(source: string): Definition {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
  const tokens = clean.match(/[A-Za-z_][\w]*|\d+|\.\.|[^\s]/g) ?? [];
  let position = 0;
  const take = () => tokens[position++];
  const expect = (value: string) => {
    if (take() !== value) throw new HDLError(`Expected ${value} near token ${position}.`);
  };
  const identifier = () => {
    const token = take();
    if (!token || !/^[A-Za-z_]\w*$/.test(token))
      throw new HDLError(`Expected a name near token ${position}.`);
    return token;
  };
  const number = () => {
    const token = take();
    if (!token || !/^\d+$/.test(token)) throw new HDLError('Expected a bus width or bit index.');
    return Number(token);
  };
  const ref = (): Ref => {
    const name = identifier();
    if (tokens[position] !== '[') return { name };
    take();
    const low = number();
    let high = low;
    if (tokens[position] === '..') {
      take();
      high = number();
    }
    expect(']');
    if (high < low || high > 15)
      throw new HDLError('Bus slices must have ascending indices from 0 to 15.');
    return { name, low, high };
  };
  expect('CHIP');
  const name = identifier();
  expect('{');
  const inputs: PinWidths = {},
    outputs: PinWidths = {};
  while (tokens[position] === 'IN' || tokens[position] === 'OUT') {
    const target = take() === 'IN' ? inputs : outputs;
    for (;;) {
      const pin = identifier();
      if (pin in inputs || pin in outputs || pin === 'true' || pin === 'false')
        throw new HDLError(`Duplicate or reserved pin ${pin}.`);
      let width = 1;
      if (tokens[position] === '[') {
        take();
        width = number();
        expect(']');
      }
      if (width < 1 || width > 16) throw new HDLError('Pin widths must be between 1 and 16.');
      target[pin] = width;
      if (tokens[position] !== ',') break;
      take();
    }
    expect(';');
  }
  expect('PARTS');
  expect(':');
  const parts: Part[] = [];
  while (tokens[position] !== '}' && position < tokens.length) {
    const part: Part = { name: identifier(), connections: [] };
    expect('(');
    if (tokens[position] !== ')')
      for (;;) {
        const pin = ref();
        expect('=');
        const net = ref();
        part.connections.push({ pin, net });
        if (tokens[position] !== ',') break;
        take();
      }
    expect(')');
    expect(';');
    parts.push(part);
  }
  expect('}');
  if (position !== tokens.length) throw new HDLError('Unexpected text after the chip definition.');
  if (parts.length === 0) throw new HDLError('Add at least one part to complete the circuit.');
  return { name, inputs, outputs, parts };
}
type Read = (context: Evaluation) => number;
class Evaluation {
  cache = new Map<object, number>();
  visiting = new Set<object>();
  read(key: object, compute: () => number): number {
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    if (this.visiting.has(key))
      throw new HDLError(
        'The circuit contains a combinational loop. Add a clocked state boundary.',
      );
    this.visiting.add(key);
    const result = compute();
    this.visiting.delete(key);
    this.cache.set(key, result);
    return result;
  }
}
type Instance = { inputs: Record<string, Read>; outputs: Record<string, Read> };
type Stateful = { capture: (context: Evaluation) => void; commit: () => void; reset: () => void };
export interface HDLCircuit {
  readonly name: string;
  getState(name: string, index?: number): number;
  setState(name: string, value: number, index?: number): void;
  readonly inputWidths: PinWidths;
  readonly outputWidths: PinWidths;
  readonly inputs: PinValues;
  readonly outputs: PinValues;
  readonly phase: 'tick' | 'tock';
  evaluate(values?: PinValues): PinValues;
  tick(values?: PinValues): PinValues;
  tock(): PinValues;
  cycle(values?: PinValues): PinValues;
  reset(): PinValues;
  loadROM(words: number[]): void;
  setKeyboard(value: number): void;
  readMemory(address: number): number;
}
/** Compile without evaluating user JavaScript; supports structural HDL only. */
export function compileHDL(source: string, dependencies: Record<string, string> = {}): HDLCircuit {
  const root = parse(source),
    definitions = new Map<string, Definition>();
  for (const [name, code] of Object.entries(dependencies)) {
    const definition = parse(code);
    if (definition.name !== name)
      throw new HDLError(`Dependency ${name} declares CHIP ${definition.name}.`);
    definitions.set(name, definition);
  }
  const stateful: Stateful[] = [],
    validators: Read[] = [],
    inputs: PinValues = {},
    outputs: PinValues = {};
  const memoryPorts: Array<{
    name: string;
    instance: Instance;
    read?: (address: number) => number;
  }> = [];
  const statePorts: Array<{
    name: string;
    size: number;
    read: (index: number) => number;
    write: (index: number, value: number) => void;
  }> = [];
  let count = 0,
    keyboard = 0,
    phase: 'tick' | 'tock' = 'tock';
  const rom = new Uint16Array(32768);
  for (const key of Object.keys(root.inputs)) inputs[key] = 0;
  const getContract = (name: string): ChipContract => {
    const value =
      definitions.get(name) ??
      (Object.hasOwn(builtinContracts, name) ? builtinContracts[name] : undefined);
    if (!value) throw new HDLError(`Unknown chip ${name}. Add its HDL dependency.`);
    return value;
  };
  function builtin(name: string): Instance {
    const spec = builtinContracts[name],
      port: Instance = { inputs: {}, outputs: {} };
    const g = (pin: string, ctx: Evaluation) => port.inputs[pin](ctx);
    let value = 0,
      next = 0,
      writeAddress = 0,
      writeValue = 0,
      write = false;
    const ramSize =
      name === 'Memory' || name === 'Computer'
        ? 24576
        : name === 'Screen'
          ? 8192
          : name.startsWith('RAM')
            ? 2 ** spec.inputs.address
            : 0;
    const memory = new Uint16Array(ramSize);
    let cpu = { a: 0, d: 0, pc: 0 },
      nextCpu = { ...cpu };
    const readMemory = (address: number) =>
      address < 24576 ? memory[address] : address === 24576 ? keyboard : 0;
    if (name === 'Computer') memoryPorts.push({ name, instance: port, read: readMemory });
    else if (name === 'Memory' || name === 'RAM16K' || name === 'Screen')
      memoryPorts.push({ name, instance: port });
    function cpuResult(ctx: Evaluation) {
      return cpuStep(cpu, g('instruction', ctx), g('inM', ctx), Boolean(g('reset', ctx)));
    }
    if (ramSize)
      statePorts.push({
        name: name === 'Computer' ? 'RAM16K' : name,
        size: name === 'Computer' ? 16384 : ramSize,
        read: (index) =>
          phase === 'tick' && write && writeAddress === index ? writeValue : memory[index],
        write: (index, data) => {
          memory[index] = data;
        },
      });
    if (name === 'Computer')
      statePorts.push({
        name: 'Screen',
        size: 8192,
        read: (index) =>
          phase === 'tick' && write && writeAddress === index + 16384
            ? writeValue
            : memory[index + 16384],
        write: (index, data) => {
          memory[index + 16384] = data;
        },
      });
    if (['DFF', 'Bit', 'Register', 'ARegister', 'DRegister', 'PC'].includes(name))
      statePorts.push({
        name,
        size: 1,
        read: () => (phase === 'tick' ? next : value),
        write: (_index, data) => {
          value = data & mask(spec.outputs.out);
          next = value;
        },
      });
    if (name === 'CPU' || name === 'Computer')
      for (const [label, key] of [
        ['ARegister', 'a'],
        ['DRegister', 'd'],
        ['PC', 'pc'],
      ] as const)
        statePorts.push({
          name: label,
          size: 1,
          read: () => (phase === 'tick' ? nextCpu[key] : cpu[key]),
          write: (_index, data) => {
            cpu[key] = data;
            nextCpu[key] = data;
          },
        });
    const compute = (pin: string, ctx: Evaluation): number => {
      if (name === 'Nand') return 1 - (g('a', ctx) & g('b', ctx));
      if (name === 'Not' || name === 'Not16') return ~g('in', ctx) & mask(spec.outputs.out);
      if (name === 'And' || name === 'And16') return g('a', ctx) & g('b', ctx);
      if (name === 'Or' || name === 'Or16') return g('a', ctx) | g('b', ctx);
      if (name === 'Xor') return g('a', ctx) ^ g('b', ctx);
      if (name.startsWith('Mux')) return g(String.fromCharCode(97 + g('sel', ctx)), ctx);
      if (name.startsWith('DMux'))
        return pin.charCodeAt(0) - 97 === g('sel', ctx) ? g('in', ctx) : 0;
      if (name === 'Or8Way') return g('in', ctx) ? 1 : 0;
      if (name === 'HalfAdder' || name === 'FullAdder') {
        const sum = g('a', ctx) + g('b', ctx) + (name === 'FullAdder' ? g('c', ctx) : 0);
        return pin === 'sum' ? sum & 1 : sum >> 1;
      }
      if (name === 'Add16') return (g('a', ctx) + g('b', ctx)) & 65535;
      if (name === 'Inc16') return (g('in', ctx) + 1) & 65535;
      if (name === 'ALU') {
        const control = ['zx', 'nx', 'zy', 'ny', 'f', 'no'].reduce(
          (acc, k) => (acc << 1) | g(k, ctx),
          0,
        );
        return alu(g('x', ctx), g('y', ctx), control)[pin as 'out' | 'zr' | 'ng'];
      }
      if (name === 'Keyboard') return keyboard;
      if (name === 'ROM32K') return rom[g('address', ctx)];
      if (name === 'Memory') return readMemory(g('address', ctx));
      if (ramSize) return memory[g('address', ctx)];
      if (name === 'CPU') {
        if (pin === 'addressM') return cpu.a & 32767;
        if (pin === 'pc') return cpu.pc & 32767;
        const result = cpuResult(ctx);
        return pin === 'writeM' ? Number(result.writeM) : result.outM;
      }
      return value;
    };
    for (const pin of Object.keys(spec.outputs)) {
      const key = {};
      port.outputs[pin] = (ctx) => ctx.read(key, () => compute(pin, ctx));
      validators.push(port.outputs[pin]);
    }
    if (
      ['DFF', 'Bit', 'Register', 'ARegister', 'DRegister', 'PC', 'CPU', 'Computer'].includes(
        name,
      ) ||
      ramSize
    ) {
      stateful.push({
        capture(ctx) {
          write = false;
          if (name === 'Computer') {
            const instruction = rom[cpu.pc & 32767];
            const result = cpuStep(
              cpu,
              instruction,
              readMemory(cpu.a & 32767),
              Boolean(g('reset', ctx)),
            );
            nextCpu = { a: result.a, d: result.d, pc: result.pc };
            write = result.writeM && result.addressM < 24576;
            writeAddress = result.addressM;
            writeValue = result.outM;
          } else if (name === 'CPU') {
            const result = cpuResult(ctx);
            nextCpu = { a: result.a, d: result.d, pc: result.pc };
          } else if (ramSize) {
            writeAddress = g('address', ctx);
            write = Boolean(g('load', ctx)) && writeAddress < ramSize;
            writeValue = g('in', ctx);
          } else if (name === 'PC') {
            next = g('reset', ctx)
              ? 0
              : g('load', ctx)
                ? g('in', ctx)
                : g('inc', ctx)
                  ? (value + 1) & 65535
                  : value;
          } else next = name === 'DFF' || g('load', ctx) ? g('in', ctx) : value;
        },
        commit() {
          value = next;
          cpu = { ...nextCpu };
          if (write) memory[writeAddress] = writeValue;
        },
        reset() {
          value = next = 0;
          write = false;
          memory.fill(0);
          cpu = { a: 0, d: 0, pc: 0 };
          nextCpu = { ...cpu };
        },
      });
    }
    return port;
  }
  function instantiate(def: Definition, ancestry: string[]): Instance {
    if (++count > 20000)
      throw new HDLError(
        'This design exceeds the 20,000-part simulation limit. Use built-in RAM blocks for larger memories.',
      );
    const port: Instance = { inputs: {}, outputs: {} },
      widths: PinWidths = { ...def.inputs, ...def.outputs };
    if (def.name === 'Memory' || def.name === 'RAM16K' || def.name === 'Screen')
      memoryPorts.push({ name: def.name, instance: port });
    const minimum: PinWidths = {};
    const children = def.parts.map((part) => {
      const spec = getContract(part.name);
      let instance: Instance;
      if (definitions.has(part.name)) {
        if (ancestry.includes(part.name))
          throw new HDLError(`Recursive chip dependency: ${[...ancestry, part.name].join(' → ')}.`);
        if (ancestry.length > 32) throw new HDLError('Chip dependency nesting is too deep.');
        instance = instantiate(definitions.get(part.name)!, [...ancestry, part.name]);
      } else {
        if (++count > 20000)
          throw new HDLError('Circuit exceeds the 20,000-part simulation limit.');
        instance = builtin(part.name);
      }
      for (const { pin, net } of part.connections) {
        const full = spec.inputs[pin.name] ?? spec.outputs[pin.name];
        if (!full) throw new HDLError(`${part.name} has no pin ${pin.name}.`);
        if (pin.high !== undefined && pin.high >= full)
          throw new HDLError(`Pin slice ${part.name}.${pin.name} exceeds its ${full}-bit width.`);
        const width = pin.low === undefined ? full : pin.high! - pin.low + 1;
        if (net.name === 'true' || net.name === 'false') {
          if (net.low !== undefined) throw new HDLError('Constants cannot be sliced.');
          if (pin.name in spec.outputs)
            throw new HDLError('A chip output cannot drive a constant.');
          continue;
        }
        if (net.low === undefined) {
          if (widths[net.name] !== undefined && widths[net.name] !== width)
            throw new HDLError(
              `Width mismatch on ${net.name}: expected ${widths[net.name]}, received ${width}.`,
            );
          widths[net.name] = width;
        } else {
          if (net.high! - net.low + 1 !== width)
            throw new HDLError(`Slice width mismatch on ${net.name}.`);
          minimum[net.name] = Math.max(minimum[net.name] ?? 0, net.high! + 1);
        }
      }
      return { part, spec, instance };
    });
    for (const [name, min] of Object.entries(minimum)) {
      if (widths[name] !== undefined && widths[name] < min)
        throw new HDLError(`Slice exceeds the width of ${name}.`);
      widths[name] ??= min;
    }
    const nets: Record<string, Array<Read | undefined>> = {};
    for (const [name, width] of Object.entries(widths)) nets[name] = Array(width);
    for (const [name, width] of Object.entries(def.inputs))
      for (let bit = 0; bit < width; bit++)
        nets[name][bit] = (ctx) => (port.inputs[name](ctx) >> bit) & 1;
    const readNet = (ref: Ref, width: number, ctx: Evaluation) => {
      if (ref.name === 'true') return mask(width);
      if (ref.name === 'false') return 0;
      let result = 0;
      for (let bit = 0; bit < width; bit++) {
        const driver = nets[ref.name]?.[(ref.low ?? 0) + bit];
        if (!driver)
          throw new HDLError(`Signal ${ref.name}[${(ref.low ?? 0) + bit}] has no driver.`);
        result |= driver(ctx) << bit;
      }
      return result;
    };
    for (const { part, spec, instance } of children) {
      const bindings: Record<string, Array<Read | undefined>> = {};
      for (const [name, width] of Object.entries(spec.inputs)) bindings[name] = Array(width);
      for (const { pin, net } of part.connections) {
        const full = spec.inputs[pin.name] ?? spec.outputs[pin.name],
          width = pin.low === undefined ? full : pin.high! - pin.low + 1;
        if (pin.name in spec.inputs) {
          for (let bit = 0; bit < width; bit++) {
            const index = (pin.low ?? 0) + bit;
            if (bindings[pin.name][index])
              throw new HDLError(`Input ${part.name}.${pin.name}[${index}] is connected twice.`);
            bindings[pin.name][index] = (ctx) => (readNet(net, width, ctx) >> bit) & 1;
          }
        } else
          for (let bit = 0; bit < width; bit++) {
            const index = (net.low ?? 0) + bit;
            if (nets[net.name][index])
              throw new HDLError(`Signal ${net.name}[${index}] has multiple drivers.`);
            nets[net.name][index] = (ctx) =>
              (instance.outputs[pin.name](ctx) >> ((pin.low ?? 0) + bit)) & 1;
          }
      }
      for (const [name, bits] of Object.entries(bindings)) {
        for (let bit = 0; bit < bits.length; bit++)
          if (!bits[bit]) throw new HDLError(`Connect input ${part.name}.${name}[${bit}].`);
        instance.inputs[name] = (ctx) =>
          bits.reduce<number>((result, read, bit) => result | (read!(ctx) << bit), 0);
      }
    }
    for (const [name, width] of Object.entries(def.outputs))
      port.outputs[name] = (ctx) => readNet({ name }, width, ctx);
    // Reject undriven internal bits even when the affected output is currently unused.
    for (const [name, bits] of Object.entries(nets))
      for (let bit = 0; bit < bits.length; bit++)
        if (!bits[bit]) throw new HDLError(`Signal ${name}[${bit}] has no driver.`);
    return port;
  }
  const top = instantiate(root, [root.name]);
  for (const name of Object.keys(root.inputs)) top.inputs[name] = () => inputs[name];
  function evaluate(values: PinValues = {}): PinValues {
    for (const [name, value] of Object.entries(values)) {
      const width = root.inputs[name];
      if (!width) throw new HDLError(`Unknown input ${name}.`);
      if (!Number.isInteger(value) || value < -(2 ** (width - 1)) || value > mask(width))
        throw new HDLError(`Input ${name} needs a ${width}-bit integer.`);
      inputs[name] = value & mask(width);
    }
    const context = new Evaluation();
    for (const read of validators) read(context);
    for (const [name, read] of Object.entries(top.outputs)) outputs[name] = read(context);
    return { ...outputs };
  }
  const circuit: HDLCircuit = {
    name: root.name,
    getState(name, index = 0) {
      const port = statePorts.find((port) => port.name === name);
      if (!port) throw new HDLError(`No inspectable ${name} component in this circuit.`);
      if (!Number.isInteger(index) || index < 0 || index >= port.size)
        throw new HDLError(`Index outside ${name}.`);
      return port.read(index);
    },
    setState(name, value, index = 0) {
      const port = statePorts.find((port) => port.name === name);
      if (!port) throw new HDLError(`No inspectable ${name} component in this circuit.`);
      if (!Number.isInteger(index) || index < 0 || index >= port.size)
        throw new HDLError(`Index outside ${name}.`);
      if (!Number.isInteger(value) || value < -32768 || value > 65535)
        throw new HDLError('State value must fit a 16-bit word.');
      if (phase === 'tick') throw new HDLError('Change state only between complete clock cycles.');
      port.write(index, value & 65535);
      evaluate();
    },
    inputWidths: { ...root.inputs },
    outputWidths: { ...root.outputs },
    inputs,
    outputs,
    get phase() {
      return phase;
    },
    evaluate,
    tick(values = {}) {
      if (phase === 'tick')
        throw new HDLError('The clock is already high. Tock before ticking again.');
      evaluate(values);
      const context = new Evaluation();
      stateful.forEach((state) => state.capture(context));
      phase = 'tick';
      return { ...outputs };
    },
    tock() {
      if (phase !== 'tick') throw new HDLError('Tick before tock.');
      stateful.forEach((state) => state.commit());
      phase = 'tock';
      return evaluate();
    },
    cycle(values = {}) {
      this.tick(values);
      return this.tock();
    },
    reset() {
      stateful.forEach((state) => state.reset());
      phase = 'tock';
      return evaluate();
    },
    loadROM(words) {
      if (
        words.length > 32768 ||
        words.some((word) => !Number.isInteger(word) || word < 0 || word > 65535)
      )
        throw new HDLError('ROM needs at most 32768 unsigned 16-bit instructions.');
      rom.fill(0);
      rom.set(words);
      evaluate();
    },
    readMemory(address) {
      if (!Number.isInteger(address) || address < 0 || address > 32767)
        throw new HDLError('Memory address must be between 0 and 32767.');
      const entry =
        memoryPorts.find((item) => item.name === 'Memory' || item.name === 'Computer') ??
        memoryPorts.find((item) => item.name === (address < 16384 ? 'RAM16K' : 'Screen'));
      if (address === 24576) return keyboard;
      if (address > 24576) return 0;
      if (!entry)
        throw new HDLError('This circuit has no mapped Memory, RAM16K, or Screen component.');
      if (entry.read) return entry.read(address);
      const previous = entry.instance.inputs.address;
      entry.instance.inputs.address = () => (entry.name === 'Screen' ? address - 16384 : address);
      try {
        return entry.instance.outputs.out(new Evaluation());
      } finally {
        entry.instance.inputs.address = previous;
      }
    },
    setKeyboard(value) {
      if (!Number.isInteger(value) || value < 0 || value > 65535)
        throw new HDLError('Keyboard value must be an unsigned 16-bit integer.');
      keyboard = value;
      evaluate();
    },
  };
  evaluate();
  return circuit;
}

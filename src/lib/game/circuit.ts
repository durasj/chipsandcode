import parse from '../editor/hdl/parse';
import type { ChipNode, IdentifierNode } from '../editor/hdl/tree';
import ChipFactory from '../hardware-simulator/chips/ChipFactory';
import type { GateKind, Mission, Signals, TruthCase } from './missions';
import { truthTable } from './missions';

export interface GateNode {
  id: string;
  type: GateKind;
  /** Sources are input pin names or the id of an earlier gate. Empty means unwired. */
  inputs: Record<string, string>;
}
export interface Circuit {
  gates: GateNode[];
  outputs: Record<string, string>;
}
export interface Simulation {
  outputs: Signals;
  signals: Signals;
  hdl: string;
}
export interface TestRow extends TruthCase {
  actual: Signals;
  passed: boolean;
}
export interface TestResult {
  rows: TestRow[];
  passed: number;
  total: number;
  success: boolean;
  hdl: string;
}

export function gatePins(type: GateKind): string[] {
  return type === 'Not' ? ['in'] : ['a', 'b'];
}

export function createCircuit(mission: Mission): Circuit {
  return mission.id === 'nand'
    ? { gates: [{ id: 'g1', type: 'Nand', inputs: { a: 'a', b: 'b' } }], outputs: { out: 'g1' } }
    : { gates: [], outputs: Object.fromEntries(mission.outputs.map((pin) => [pin, ''])) };
}

/** Draft shape validation deliberately permits unwired pins for local autosave. */
export function isCircuitDraft(mission: Mission, value: unknown): value is Circuit {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Circuit;
  if (!Array.isArray(candidate.gates) || candidate.gates.length > 32) return false;
  const output = candidate.outputs;
  if (!output || typeof output !== 'object' || Array.isArray(output)) return false;
  if (Object.keys(output).some((pin) => !mission.outputs.includes(pin))) return false;
  if (!mission.outputs.every((pin) => typeof output[pin] === 'string' && output[pin].length < 80))
    return false;
  const ids = new Set<string>();
  for (const gate of candidate.gates) {
    if (
      !gate ||
      typeof gate !== 'object' ||
      typeof gate.id !== 'string' ||
      !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(gate.id) ||
      mission.inputs.includes(gate.id) ||
      mission.outputs.includes(gate.id) ||
      ids.has(gate.id) ||
      !mission.availableParts.includes(gate.type)
    )
      return false;
    ids.add(gate.id);
    if (!gate.inputs || typeof gate.inputs !== 'object' || Array.isArray(gate.inputs)) return false;
    const pins = gatePins(gate.type);
    if (Object.keys(gate.inputs).some((pin) => !pins.includes(pin))) return false;
    if (!pins.every((pin) => typeof gate.inputs[pin] === 'string' && gate.inputs[pin].length < 80))
      return false;
  }
  return true;
}

export function availableSources(
  mission: Mission,
  circuit: Circuit,
  beforeGateId?: string,
): string[] {
  const index =
    beforeGateId === undefined
      ? circuit.gates.length
      : circuit.gates.findIndex((gate) => gate.id === beforeGateId);
  return [...mission.inputs, ...circuit.gates.slice(0, Math.max(0, index)).map((gate) => gate.id)];
}

function validate(mission: Mission, circuit: Circuit, allowIncomplete = false) {
  if (!isCircuitDraft(mission, circuit))
    throw new Error('This circuit has invalid components. Start a fresh build.');
  const known = new Set(mission.inputs);
  for (const gate of circuit.gates) {
    for (const pin of gatePins(gate.type)) {
      const source = gate.inputs[pin];
      if (!source && allowIncomplete) continue;
      if (!source) throw new Error(`Connect ${gate.id} ${pin} to a signal.`);
      if (!known.has(source))
        throw new Error(
          `${gate.id} ${pin} must use an input or an earlier gate. Loops are not supported.`,
        );
    }
    known.add(gate.id);
  }
  for (const pin of mission.outputs) {
    const source = circuit.outputs[pin];
    if (!source && allowIncomplete) continue;
    if (!source) throw new Error(`Connect output ${pin} to a signal.`);
    if (!known.has(source)) throw new Error(`Output ${pin} is connected to an unknown signal.`);
  }
}

/**
 * The visual editor is an HDL authoring view, not a parallel toy simulator.
 * Fan-out is expressed by repeated output connections on the same part.
 * A direct input → output wire needs two NANDs because HDL has no wire alias syntax.
 */
export function toHDL(mission: Mission, circuit: Circuit): string {
  return serializeHDL(mission, circuit, false);
}

/** Editable source for an unfinished visual board, with unwired inputs omitted. */
export function toHDLDraft(mission: Mission, circuit: Circuit): string {
  return serializeHDL(mission, circuit, true);
}

function serializeHDL(mission: Mission, circuit: Circuit, allowIncomplete: boolean): string {
  validate(mission, circuit, allowIncomplete);
  const wires = new Map(circuit.gates.map((gate, index) => [gate.id, `gamewire${index}`]));
  const sourceName = (source: string) => wires.get(source) ?? source;
  const lines = circuit.gates.map((gate) => {
    const inputs = gatePins(gate.type)
      .filter((pin) => gate.inputs[pin])
      .map((pin) => `${pin}=${sourceName(gate.inputs[pin])}`);
    const outputs = [
      `out=${wires.get(gate.id)}`,
      ...mission.outputs
        .filter((pin) => circuit.outputs[pin] === gate.id)
        .map((pin) => `out=${pin}`),
    ];
    return `    ${gate.type}(${[...inputs, ...outputs].join(', ')});`;
  });
  for (const pin of mission.outputs) {
    const source = circuit.outputs[pin];
    if (!mission.inputs.includes(source)) continue;
    lines.push(`    // Two NANDs preserve a direct input-to-output wire.`);
    lines.push(`    Nand(a=${source}, b=${source}, out=gamebuffer${pin});`);
    lines.push(`    Nand(a=gamebuffer${pin}, b=gamebuffer${pin}, out=${pin});`);
  }
  return [
    `CHIP ${mission.chip} {`,
    `    IN ${mission.inputs.join(', ')};`,
    `    OUT ${mission.outputs.join(', ')};`,
    '',
    '    PARTS:',
    ...(!lines.length ? ['    // Add parts here.'] : []),
    ...lines,
    ...mission.outputs
      .filter((pin) => !circuit.outputs[pin])
      .map((pin) => `    // Connect output ${pin}.`),
    '}',
  ].join('\n');
}

/**
 * Import the supported single-bit HDL subset into the same graph used by the
 * visual editor. No circuit is changed until the whole source has been checked.
 * Pins may be omitted while drafting; named wires must have exactly one driver.
 */
export function fromHDL(mission: Mission, source: string): Circuit {
  if (source.length > 32_000) throw new Error('Keep this chip below 32,000 characters.');

  // The existing language parser requires at least one statement after PARTS:.
  // Accept an empty authoring skeleton without changing that shared grammar.
  // Whitespace substitution preserves parser line/column positions.
  const whitespace = (text: string) => text.replace(/[^\r\n]/g, ' ');
  const parseable = source
    .replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, whitespace)
    .replace(/\bPARTS\s*:\s*(?=})/g, whitespace);
  let chips: ChipNode[] | undefined;
  try {
    chips = parse(parseable);
  } catch (error) {
    const detail = error instanceof Error ? error.message.split('\n')[0] : 'Invalid syntax.';
    throw new Error(`HDL ${detail} Check parentheses, commas and semicolons.`);
  }
  if (!chips?.length)
    throw new Error('Complete the CHIP declaration, including its closing brace.');
  if (chips.length !== 1) throw new Error('Define one CHIP at a time in this workspace.');
  const chip = chips[0];
  if (chip.name.value !== mission.chip)
    throw new Error(`Use CHIP ${mission.chip} for this challenge.`);
  if (chip.body.some((section) => !['input', 'output', 'parts'].includes(section.type)))
    throw new Error('Use PARTS to build this chip. BUILTIN and CLOCKED are not supported here.');

  function checkScalar(pin: IdentifierNode) {
    if ('width' in pin || 'length' in pin || 'selection' in pin)
      throw new Error(
        'This layer uses single-bit pins. Buses and bit selections are not supported.',
      );
    if (pin.value === 'true' || pin.value === 'false')
      throw new Error(
        'Constant signals are not supported here. Connect an input or a part output.',
      );
  }

  for (const direction of ['input', 'output'] as const) {
    const pins = chip.body.flatMap((section) => (section.type === direction ? section.pins : []));
    pins.forEach(checkScalar);
    const expected = direction === 'input' ? mission.inputs : mission.outputs;
    const names = pins.map((pin) => pin.value);
    if (
      names.length !== expected.length ||
      new Set(names).size !== expected.length ||
      !expected.every((pin) => names.includes(pin))
    )
      throw new Error(
        `Declare exactly ${direction === 'input' ? 'IN' : 'OUT'} ${expected.join(', ')}; for ${mission.chip}.`,
      );
  }

  const statements = chip.body.flatMap((section) =>
    section.type === 'parts' ? section.statements : [],
  );
  // A visual wire to an external output is exported as two NANDs. Keep a hard
  // parser bound while allowing those adapters in addition to 32 authored parts.
  if (statements.length > 32 + mission.outputs.length * 2)
    throw new Error('This workspace supports up to 32 parts per chip.');
  const drivers = new Map<string, number>();
  const parts = statements.map((statement, index) => {
    const type = statement.chip.value as GateKind;
    if (!mission.availableParts.includes(type))
      throw new Error(
        `${type} is not available for ${mission.chip}. Use ${mission.availableParts.join(', ')}.`,
      );
    const inputPins = gatePins(type);
    const inputs: Record<string, string> = Object.fromEntries(inputPins.map((pin) => [pin, '']));
    for (const connection of statement.connections) {
      checkScalar(connection.left);
      checkScalar(connection.right);
      const pin = connection.left.value;
      const wire = connection.right.value;
      if (pin === 'out') {
        if (mission.inputs.includes(wire))
          throw new Error(`Input ${wire} cannot be driven by a part output.`);
        if (drivers.has(wire) && drivers.get(wire) !== index)
          throw new Error(
            `Signal ${wire} has more than one driver. Give each part its own output wire.`,
          );
        drivers.set(wire, index);
      } else if (inputPins.includes(pin)) {
        if (inputs[pin]) throw new Error(`${type} input ${pin} is connected more than once.`);
        inputs[pin] = wire;
      } else {
        throw new Error(`${type} has no pin ${pin}. Use ${[...inputPins, 'out'].join(', ')}.`);
      }
    }
    return { type, inputs };
  });

  // Resolve all drivers before sorting, so HDL declaration order is unrestricted.
  for (const part of parts) {
    for (const wire of Object.values(part.inputs)) {
      if (wire && !mission.inputs.includes(wire) && !drivers.has(wire))
        throw new Error(
          `Signal ${wire} has no driver. Connect it to a part output or use a chip input.`,
        );
    }
  }

  // Recover only the exact adapters emitted by serializeHDL. Validate all source
  // statements first, and require exclusive ownership of both intermediate and
  // output wires so no authored fan-out or aliases can disappear in conversion.
  const adapters = new Set<number>();
  const directOutputs = new Map<string, string>();
  for (const output of mission.outputs) {
    const buffer = `gamebuffer${output}`;
    const first = drivers.get(buffer);
    const last = drivers.get(output);
    if (first === undefined || last === undefined || first === last) continue;
    const before = parts[first];
    const after = parts[last];
    const exactNand = (index: number, a: string, b: string, out: string) =>
      statements[index].chip.value === 'Nand' &&
      statements[index].connections.length === 3 &&
      statements[index].connections.every(
        ({ left, right }) =>
          (left.value === 'a' && right.value === a) ||
          (left.value === 'b' && right.value === b) ||
          (left.value === 'out' && right.value === out),
      );
    if (
      !mission.inputs.includes(before.inputs.a) ||
      before.inputs.a !== before.inputs.b ||
      after.inputs.a !== buffer ||
      after.inputs.b !== buffer ||
      !exactNand(first, before.inputs.a, before.inputs.a, buffer) ||
      !exactNand(last, buffer, buffer, output) ||
      parts.some((part, index) =>
        Object.values(part.inputs).some(
          (wire) => wire === output || (wire === buffer && index !== last),
        ),
      )
    )
      continue;
    adapters.add(first);
    adapters.add(last);
    directOutputs.set(output, before.inputs.a);
  }
  if (parts.length - adapters.size > 32)
    throw new Error('This workspace supports up to 32 parts per chip.');

  const order: number[] = [];
  const pending = new Set(parts.map((_, index) => index).filter((index) => !adapters.has(index)));
  while (pending.size) {
    const ready = [...pending].find((index) =>
      Object.values(parts[index].inputs).every(
        (wire) => !wire || mission.inputs.includes(wire) || !pending.has(drivers.get(wire)!),
      ),
    );
    if (ready === undefined)
      throw new Error('This circuit contains feedback. Connect signals forward through the parts.');
    order.push(ready);
    pending.delete(ready);
  }
  const ids = new Map(order.map((index, position) => [index, `g${position + 1}`]));
  const resolve = (wire: string) =>
    !wire || mission.inputs.includes(wire) ? wire : ids.get(drivers.get(wire)!)!;
  const circuit: Circuit = {
    gates: order.map((index) => ({
      id: ids.get(index)!,
      type: parts[index].type,
      inputs: Object.fromEntries(
        Object.entries(parts[index].inputs).map(([pin, wire]) => [pin, resolve(wire)]),
      ),
    })),
    outputs: Object.fromEntries(
      mission.outputs.map((pin) => [
        pin,
        directOutputs.get(pin) ?? (drivers.has(pin) ? resolve(pin) : ''),
      ]),
    ),
  };
  validate(mission, circuit, true);
  return circuit;
}

function compile(mission: Mission, circuit: Circuit) {
  const hdl = toHDL(mission, circuit);
  const ast = parse(hdl)?.[0];
  if (!ast) throw new Error('The generated circuit could not be parsed.');
  return { chip: new ChipFactory().fromAST(ast), hdl };
}

export function simulateCircuit(mission: Mission, circuit: Circuit, inputs: Signals): Simulation {
  const { chip, hdl } = compile(mission, circuit);
  for (const pin of mission.inputs) {
    if (typeof inputs[pin] !== 'boolean') throw new Error(`Input ${pin} needs an on/off value.`);
    chip.setInput(pin, inputs[pin]);
  }
  chip.run();
  const signals: Signals = { ...inputs };
  circuit.gates.forEach((gate, index) => {
    signals[gate.id] = chip.getPins().get(`gamewire${index}`)?.state ?? false;
  });
  const outputs = Object.fromEntries(mission.outputs.map((pin) => [pin, chip.getOutput(pin)]));
  return { outputs, signals, hdl };
}

/** Fresh simulation instances avoid carrying state between exhaustive truth cases. */
export function testCircuit(mission: Mission, circuit: Circuit): TestResult {
  const hdl = toHDL(mission, circuit);
  const rows = truthTable(mission).map(({ inputs, expected }) => {
    const actual = simulateCircuit(mission, circuit, inputs).outputs;
    return {
      inputs,
      expected,
      actual,
      passed: mission.outputs.every((pin) => actual[pin] === expected[pin]),
    };
  });
  const passed = rows.filter((row) => row.passed).length;
  return { rows, passed, total: rows.length, success: passed === rows.length, hdl };
}

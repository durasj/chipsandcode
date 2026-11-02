import parse from '../editor/hdl/parse';
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

function validate(mission: Mission, circuit: Circuit) {
  if (!isCircuitDraft(mission, circuit))
    throw new Error('This circuit has invalid components. Start a fresh build.');
  const known = new Set(mission.inputs);
  for (const gate of circuit.gates) {
    for (const pin of gatePins(gate.type)) {
      const source = gate.inputs[pin];
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
  validate(mission, circuit);
  const wires = new Map(circuit.gates.map((gate, index) => [gate.id, `gamewire${index}`]));
  const sourceName = (source: string) => wires.get(source) ?? source;
  const lines = circuit.gates.map((gate) => {
    const inputs = gatePins(gate.type).map((pin) => `${pin}=${sourceName(gate.inputs[pin])}`);
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
    ...lines,
    '}',
  ].join('\n');
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

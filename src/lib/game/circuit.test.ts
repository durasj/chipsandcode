import { describe, expect, it } from 'vitest';
import {
  availableSources,
  createCircuit,
  isCircuitDraft,
  simulateCircuit,
  testCircuit,
  toHDL,
} from './circuit';
import type { Circuit, GateNode } from './circuit';
import { getMission, missions, truthTable } from './missions';
import type { MissionId } from './missions';

const nand = (id: string, a: string, b: string): GateNode => ({
  id,
  type: 'Nand',
  inputs: { a, b },
});
const examples: Record<MissionId, Circuit> = {
  nand: { gates: [nand('g1', 'a', 'b')], outputs: { out: 'g1' } },
  not: { gates: [nand('g1', 'in', 'in')], outputs: { out: 'g1' } },
  and: { gates: [nand('g1', 'a', 'b'), nand('g2', 'g1', 'g1')], outputs: { out: 'g2' } },
  or: {
    gates: [nand('g1', 'a', 'a'), nand('g2', 'b', 'b'), nand('g3', 'g1', 'g2')],
    outputs: { out: 'g3' },
  },
  xor: {
    gates: [
      nand('g1', 'a', 'b'),
      nand('g2', 'a', 'g1'),
      nand('g3', 'b', 'g1'),
      nand('g4', 'g2', 'g3'),
    ],
    outputs: { out: 'g4' },
  },
  mux: {
    gates: [
      nand('g1', 'sel', 'sel'),
      nand('g2', 'a', 'g1'),
      nand('g3', 'b', 'sel'),
      nand('g4', 'g2', 'g3'),
    ],
    outputs: { out: 'g4' },
  },
  dmux: {
    gates: [
      nand('g1', 'sel', 'sel'),
      nand('g2', 'in', 'g1'),
      nand('g3', 'g2', 'g2'),
      nand('g4', 'in', 'sel'),
      nand('g5', 'g4', 'g4'),
    ],
    outputs: { a: 'g3', b: 'g5' },
  },
};

describe('Signal Isles circuit authoring', () => {
  it.each(missions)('accepts a real NAND construction for $chip across every input', (mission) => {
    const report = testCircuit(mission, examples[mission.id]);
    expect(report.success).toBe(true);
    expect(report.passed).toBe(2 ** mission.inputs.length);
    expect(report.rows.every((row) => row.passed)).toBe(true);
    expect(report.hdl).toContain(`CHIP ${mission.chip}`);
  });

  it('starts builders empty and the NAND discovery with the supplied primitive', () => {
    for (const mission of missions) {
      const circuit = createCircuit(mission);
      expect(isCircuitDraft(mission, circuit)).toBe(true);
      expect(circuit.gates).toHaveLength(mission.id === 'nand' ? 1 : 0);
    }
    expect(testCircuit(getMission('nand'), createCircuit(getMission('nand'))).success).toBe(true);
  });

  it('accepts previously mastered primitive equivalents in later builds', () => {
    const circuit: Circuit = {
      gates: [
        { id: 'g1', type: 'Nand', inputs: { a: 'a', b: 'b' } },
        { id: 'g2', type: 'Not', inputs: { in: 'g1' } },
      ],
      outputs: { out: 'g2' },
    };
    const mission = getMission('and');
    expect(testCircuit(mission, circuit).success).toBe(true);
    expect(simulateCircuit(mission, circuit, { a: true, b: true })).toMatchObject({
      outputs: { out: true },
      signals: { a: true, b: true, g1: false, g2: true },
    });
  });

  it.each([13, 24])(
    'runs a valid %i-stage visual inverter chain through the HDL simulator',
    (length) => {
      const mission = getMission('not');
      const gates = Array.from({ length }, (_, index) => {
        const source = index === 0 ? 'in' : `g${index}`;
        return nand(`g${index + 1}`, source, source);
      });
      const circuit: Circuit = { gates, outputs: { out: `g${length}` } };

      for (const input of [false, true]) {
        const simulation = simulateCircuit(mission, circuit, { in: input });
        expect(simulation.outputs.out).toBe(length % 2 === 0 ? input : !input);
        gates.forEach((gate, index) => {
          expect(simulation.signals[gate.id]).toBe(index % 2 === 0 ? !input : input);
        });
      }
      expect(testCircuit(mission, circuit).success).toBe(length % 2 === 1);
    },
  );

  it('detects a circuit that happens to pass the current input but fails the full specification', () => {
    const mission = getMission('and');
    const circuit: Circuit = { gates: [nand('g1', 'a', 'b')], outputs: { out: 'g1' } };
    const report = testCircuit(mission, circuit);
    expect(report.success).toBe(false);
    expect(report.passed).toBe(0);
    expect(report.rows[0]).toMatchObject({
      inputs: { a: false, b: false },
      expected: { out: false },
      actual: { out: true },
      passed: false,
    });
  });

  it('requires both demultiplexor outputs, including the inactive destination', () => {
    const mission = getMission('dmux');
    const circuit = { ...examples.dmux, outputs: { a: 'g3', b: 'g3' } };
    const report = testCircuit(mission, circuit);
    expect(report.total).toBe(4);
    expect(report.success).toBe(false);
    expect(report.rows.filter((row) => !row.passed)).toHaveLength(2);
  });

  it('supports direct input wires with semantically equivalent exported HDL', () => {
    const mission = getMission('mux');
    const circuit: Circuit = { gates: [], outputs: { out: 'a' } };
    expect(toHDL(mission, circuit)).toContain('gamebufferout');
    expect(simulateCircuit(mission, circuit, { a: true, b: false, sel: false }).outputs.out).toBe(
      true,
    );
    expect(simulateCircuit(mission, circuit, { a: false, b: true, sel: false }).outputs.out).toBe(
      false,
    );
  });

  it('offers only inputs and earlier nodes when connecting a gate', () => {
    const mission = getMission('and');
    expect(availableSources(mission, examples.and, 'g1')).toEqual(['a', 'b']);
    expect(availableSources(mission, examples.and, 'g2')).toEqual(['a', 'b', 'g1']);
    expect(availableSources(mission, examples.and)).toEqual(['a', 'b', 'g1', 'g2']);
    expect(availableSources(mission, examples.and, 'missing')).toEqual(['a', 'b']);
  });

  it('retains incomplete but structurally safe drafts', () => {
    const mission = getMission('not');
    const circuit: Circuit = { gates: [nand('g1', '', '')], outputs: { out: '' } };
    expect(isCircuitDraft(mission, circuit)).toBe(true);
    expect(() => testCircuit(mission, circuit)).toThrow('Connect g1 a');
    expect(() => testCircuit(mission, createCircuit(mission))).toThrow('Connect output out');
  });

  it('rejects unknown sources, missing output, forward edges and cycles before compiling', () => {
    const mission = getMission('and');
    expect(() =>
      toHDL(mission, { gates: [nand('g1', 'nope', 'b')], outputs: { out: 'g1' } }),
    ).toThrow('earlier gate');
    expect(() =>
      toHDL(mission, {
        gates: [nand('g1', 'g2', 'b'), nand('g2', 'g1', 'b')],
        outputs: { out: 'g2' },
      }),
    ).toThrow('Loops');
    expect(() =>
      toHDL(mission, { gates: [nand('g1', 'g1', 'b')], outputs: { out: 'g1' } }),
    ).toThrow('Loops');
    expect(() => toHDL(mission, { gates: [], outputs: { out: 'missing' } })).toThrow(
      'unknown signal',
    );
  });

  it('rejects malformed saved drafts and inaccessible components', () => {
    const mission = getMission('not');
    const invalid: unknown[] = [
      null,
      [],
      {},
      { gates: [], outputs: {} },
      { gates: [], outputs: { out: '', extra: '' } },
      { gates: [{ id: 'g1', type: 'Not', inputs: { in: 'in' } }], outputs: { out: 'g1' } },
      { gates: [{ id: 'in', type: 'Nand', inputs: { a: 'in', b: 'in' } }], outputs: { out: 'in' } },
      { gates: [nand('g1', 'in', 'in'), nand('g1', 'in', 'in')], outputs: { out: 'g1' } },
      {
        gates: [{ id: 'g1', type: 'Nand', inputs: { a: 'in', b: 'in', bad: 'in' } }],
        outputs: { out: 'g1' },
      },
      {
        gates: Array.from({ length: 33 }, (_, i) => nand(`g${i}`, 'in', 'in')),
        outputs: { out: '' },
      },
      {
        gates: [{ id: 'x);Nand(', type: 'Nand', inputs: { a: 'in', b: 'in' } }],
        outputs: { out: '' },
      },
    ];
    for (const value of invalid) expect(isCircuitDraft(mission, value)).toBe(false);
    expect(() => toHDL(mission, invalid[2] as Circuit)).toThrow('invalid components');
  });

  it('validates live input state and mission identity', () => {
    expect(() => simulateCircuit(getMission('nand'), examples.nand, { a: true })).toThrow(
      'Input b',
    );
    expect(() => getMission('future-cpu')).toThrow('Unknown mission');
  });

  it('enumerates every input exactly once, including all eight selector cases', () => {
    const rows = truthTable(getMission('mux'));
    expect(rows).toHaveLength(8);
    expect(new Set(rows.map((row) => JSON.stringify(row.inputs))).size).toBe(8);
    expect(rows[3]).toEqual({ inputs: { a: false, b: true, sel: true }, expected: { out: true } });
    expect(truthTable(getMission('dmux'))[2]).toEqual({
      inputs: { in: true, sel: false },
      expected: { a: true, b: false },
    });
  });
});

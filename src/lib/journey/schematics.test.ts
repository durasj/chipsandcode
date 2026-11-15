import { describe, expect, it } from 'vitest';
import { journeySteps, getJourneyStep } from './data';
import { basicDiagram } from './basicDiagrams';
import { advancedDiagram } from './advancedDiagrams';

describe('connected educational schematics', () => {
  it('keeps every visible part connected in desktop and mobile compositions', () => {
    for (const small of [false, true])
      for (const step of journeySteps) {
        const diagram = basicDiagram(step, small) ?? advancedDiagram(step, small);
        if (!diagram) continue;
        const ids = new Set(diagram.nodes.map((node) => node.id));
        expect(ids.size).toBe(diagram.nodes.length);
        for (const node of diagram.nodes) {
          expect(
            diagram.edges.some((edge) => edge.from === node.id || edge.to === node.id),
            `${step.id}: connected ${node.id}`,
          ).toBe(true);
          expect(node.x).toBeGreaterThanOrEqual(0);
          expect(node.y).toBeGreaterThanOrEqual(75);
          expect(node.x + node.w).toBeLessThanOrEqual(diagram.width);
          expect(node.y + node.h).toBeLessThan(diagram.height);
        }
        for (const edge of diagram.edges) {
          expect(ids.has(edge.from)).toBe(true);
          expect(ids.has(edge.to)).toBe(true);
          for (const [x, y] of edge.via ?? []) {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x).toBeLessThanOrEqual(diagram.width);
            expect(y).toBeGreaterThanOrEqual(0);
            expect(y).toBeLessThanOrEqual(diagram.height);
          }
        }
      }
  });
  it('shows sum and carry as separate consequences of the input bits', () => {
    const half = basicDiagram(getJourneyStep('arithmetic/halfadder'), false)!;
    expect(half.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'inputs', to: 'xor' }),
        expect.objectContaining({ from: 'inputs', to: 'and' }),
        expect.objectContaining({ from: 'xor', to: 'sum' }),
        expect.objectContaining({ from: 'and', to: 'carry' }),
      ]),
    );
    const full = basicDiagram(getJourneyStep('arithmetic/fulladder'), true)!;
    expect(full.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ from: 'first', to: 'second', label: 'sum' }),
        expect.objectContaining({ from: 'first', to: 'or' }),
        expect.objectContaining({ from: 'second', to: 'or' }),
        expect.objectContaining({ from: 'or', to: 'carry' }),
      ]),
    );
  });
  it('keeps supplied NAND as a primitive and shows fan-out when building NOT', () => {
    const nand = basicDiagram(getJourneyStep('missions/nand'), true)!;
    expect(nand.nodes.find((node) => node.id === 'gate')?.kind).toBe('supplied');
    const not = basicDiagram(getJourneyStep('missions/not'), false)!;
    const wires = not.edges.filter((edge) => edge.from === 'in' && edge.to === 'nand');
    expect(wires.map((edge) => edge.toOffset)).toEqual([-30, 30]);
  });
});

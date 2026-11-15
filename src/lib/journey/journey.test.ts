import { describe, expect, it } from 'vitest';
import { readJourneyEvidence } from './progress';
import { systemEvidence } from './system';
import { courseChapters, taskKey } from '#lib/course/data.js';
import { missions } from '#lib/game/missions.js';
import {
  draftParts,
  getJourneyStep,
  journeyStatus,
  journeySteps,
  layers,
  treatments,
} from './data';
import { loadJourneyProgram, runJourneyProgram } from './runtime';

describe('visual journey curriculum contract', () => {
  it('covers every intro concept, mission and task with an explicit teaching treatment', () => {
    const curriculum = [
      'intro/signal',
      'intro/not',
      'intro/and',
      ...missions.map((mission) => `missions/${mission.id}`),
      ...courseChapters.flatMap((chapter) => chapter.tasks.map((task) => taskKey(chapter, task))),
    ];
    expect(journeySteps.map((step) => step.id)).toEqual(curriculum);
    expect(Object.keys(treatments).sort()).toEqual([...curriculum].sort());
    expect(new Set(curriculum).size).toBe(41);
    for (const step of journeySteps) {
      expect(step.prior.length).toBeGreaterThan(15);
      expect(step.change.length).toBeGreaterThan(15);
      expect(step.next.length).toBeGreaterThan(15);
      expect(step.parts.length).toBeGreaterThan(0);
      expect(layers.some((layer) => layer.id === step.layer)).toBe(true);
      expect(step.href).toMatch(/^\/learn/);
    }
  });
  it('never turns navigation, skipping, or supplied devices into built credit', () => {
    const alu = getJourneyStep('arithmetic/alu');
    expect(journeyStatus(alu, alu.id, [])).toBe('Current challenge');
    expect(journeyStatus(alu, 'architecture/computer', [])).toBe('Not verified here');
    expect(journeyStatus(alu, 'architecture/computer', [], ['arithmetic'])).toBe(
      'Bypassed · not verified here',
    );
    expect(journeyStatus(alu, 'architecture/computer', [alu.id])).toBe('Verified');
    for (const id of ['intro/signal', 'intro/not', 'missions/nand'])
      expect(journeyStatus(getJourneyStep(id), id, [id])).toBe('Explored');
    for (const id of ['missions/mux', 'missions/dmux'])
      expect(journeyStatus(getJourneyStep(id), 'intro/signal', [], ['routing'])).toBe(
        'Bypassed · not verified here',
      );
    expect(getJourneyStep('missing')).toBe(journeySteps[0]);
  });
  it('keeps software as translation and correctly labels supplied devices', () => {
    expect(getJourneyStep('architecture/memory').parts).toContain('Screen · supplied');
    expect(getJourneyStep('architecture/memory').parts).toContain('Keyboard · supplied');
    expect(getJourneyStep('memory/bit').parts).toContain('DFF · supplied');
    expect(getJourneyStep('assembler/assembler').diagram).toBe('translator');
    expect(getJourneyStep('architecture/cpu').parts).toContain('ALU');
    expect(getJourneyStep('memory/pc').parts).toContain('Inc16');
  });
  it('retains real repeated draft components while ignoring commented examples', () => {
    expect(
      draftParts(
        'CHIP Not16 { PARTS: Not(in=in[0],out=out[0]); // Or(a=a);\n /* And(a=a); */ Not(in=in[1],out=out[1]); }',
      ),
    ).toEqual(['Not', 'Not']);
    expect(draftParts('CHIP Incomplete {')).toEqual([]);
  });
});

describe('keyboard → program → memory → pixels', () => {
  it('changes pixels only through executed writes and responds to repeated key changes', () => {
    const { machine, assembly } = loadJourneyProgram();
    expect(assembly.binary.split('\n')[0]).toHaveLength(16);
    machine.setKeyboard(65);
    expect(machine.screen.every((word) => word === 0)).toBe(true);
    for (const key of [65, 0, 65, 0]) {
      const evidence = runJourneyProgram(machine, key);
      expect(evidence.read?.inM).toBe(key);
      expect(evidence.write?.addressM).toBeGreaterThanOrEqual(16384);
      expect(evidence.write?.addressM).toBeLessThan(24576);
      expect(machine.screen.every((word) => word === (key ? 65535 : 0))).toBe(true);
      expect(evidence.executed).toBe(250000);
    }
  });
  it('reports student programs honestly when they halt or do not read or write devices', () => {
    const { machine } = loadJourneyProgram('@1\nD=A');
    const evidence = runJourneyProgram(machine, 0);
    expect(evidence).toEqual({ read: null, write: null, executed: 2 });
    expect(machine.halted).toBe(true);
    expect(runJourneyProgram(machine, 0, 0).executed).toBe(0);
    expect(() => loadJourneyProgram('THIS IS NOT ASSEMBLY')).toThrow();
  });
});

describe('journey evidence migration and isolation', () => {
  it('retains legacy evidence and isolates corrupt optional stores', () => {
    const values: Record<string, string> = {
      'chipsandcode.signal-isles.progress.v1': '["nand","not"]',
      'chipsandcode.part-one.progress.v1': '["buses/not16",null]',
      'chipsandcode.signal-intro.v1': 'complete',
      'chipsandcode.learning-choices.v1': 'broken JSON',
    };
    const storage = { getItem: (key: string) => values[key] ?? null };
    expect(readJourneyEvidence(storage)).toEqual({
      completed: [
        'buses/not16',
        'missions/nand',
        'missions/not',
        'intro/signal',
        'intro/not',
        'intro/and',
      ],
      bypassed: [],
    });
    values['chipsandcode.progress.v1'] = '[]';
    values['chipsandcode.learning-choices.v1'] =
      '{"topics":{"memory":{"skipped":true},"gates":{"skipped":false}}}';
    expect(readJourneyEvidence(storage).completed).not.toContain('missions/nand');
    expect(readJourneyEvidence(storage).bypassed).toEqual(['memory']);
    values['chipsandcode.part-one.progress.v1'] = 'null';
    values['chipsandcode.learning-choices.v1'] = '{"arithmetic":{"skipped":true}}';
    expect(readJourneyEvidence(storage).bypassed).toEqual(['arithmetic']);
    values['chipsandcode.progress.v1'] = '["nand"]';
    delete values['chipsandcode.signal-intro.v1'];
    expect(readJourneyEvidence(storage).completed).toContain('intro/signal');
    values['chipsandcode.signal-intro.v1'] = 'not-observed';
    expect(readJourneyEvidence(storage).completed).not.toContain('intro/signal');
  });
  it('uses no completion when storage is unavailable or has the wrong shape', () => {
    expect(
      readJourneyEvidence({
        getItem() {
          throw new Error('blocked');
        },
      }),
    ).toEqual({ completed: [], bypassed: [] });
    expect(readJourneyEvidence({ getItem: () => '7' })).toEqual({ completed: [], bypassed: [] });
  });
});

describe('the accumulating machine', () => {
  it('grows the correct parallel branch without crediting unbuilt components', () => {
    const fresh = systemEvidence([]);
    expect(Object.values(fresh).every((group) => group.count === 0)).toBe(true);
    const built = systemEvidence([
      'missions/not',
      'buses/not16',
      'arithmetic/halfadder',
      'memory/bit',
      'memory/pc',
    ]);
    expect(built.Logic.pieces).toEqual(['Not', 'Not16']);
    expect(built.ALU.count).toBe(1);
    expect(built.Memory.pieces).toEqual(['Bit']);
    expect(built.CPU.pieces).toEqual(['PC']);
    expect(built.ROM.count).toBe(0);
    expect(built.Screen).toBeUndefined();
  });
});

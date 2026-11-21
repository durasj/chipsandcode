import { describe, expect, it, vi } from 'vitest';
import { dependencyMap, readWorkshopDraft } from './hardware-project';
import { compileHDL } from './hdl';

describe('Hardware workspace projects', () => {
  it('recovers the previous workshop source and dependencies without modifying storage', () => {
    const source = 'CHIP Probe { IN in; OUT out; PARTS: Custom(in=in, out=out); }';
    const custom = 'CHIP Custom { IN in; OUT out; PARTS: Not(in=in, out=out); }';
    const getItem = vi.fn(() =>
      JSON.stringify({ source, dependencies: [{ id: 4, source: custom }] }),
    );
    const draft = readWorkshopDraft({ getItem });
    expect(getItem).toHaveBeenCalledWith('chipsandcode.chip-builder.v1');
    expect(draft).toMatchObject({ hdl: source, dependencies: [custom], name: 'Workshop draft' });
    expect(Number.isNaN(Date.parse(draft!.saved))).toBe(false);
    const circuit = compileHDL(draft!.hdl, dependencyMap(draft!.dependencies));
    expect(circuit.evaluate({ in: 0 })).toEqual({ out: 1 });
    expect(circuit.evaluate({ in: 1 })).toEqual({ out: 0 });
  });

  it('preserves an intentionally empty draft and accepts older drafts without dependencies', () => {
    expect(readWorkshopDraft({ getItem: () => '{"source":""}' })).toMatchObject({
      hdl: '',
      dependencies: [],
      tests: '',
      compare: '',
    });
  });

  it.each([
    null,
    '{',
    'null',
    '[]',
    '{"source":12}',
    '{"source":"valid","dependencies":{}}',
    '{"source":"valid","dependencies":[{}]}',
    '{"source":"valid","dependencies":[{"source":false}]}',
    JSON.stringify({ source: 'x'.repeat(1000001) }),
    JSON.stringify({
      source: '',
      dependencies: Array.from({ length: 101 }, () => ({ source: '' })),
    }),
    JSON.stringify({ source: '', dependencies: [{ source: 'x'.repeat(1000001) }] }),
  ])('ignores invalid historical data', (raw) => {
    expect(readWorkshopDraft({ getItem: () => raw })).toBeUndefined();
  });

  it('does not prevent opening an editor when storage is blocked', () => {
    expect(
      readWorkshopDraft({
        getItem: () => {
          throw new Error('Storage unavailable');
        },
      }),
    ).toBeUndefined();
  });

  it('ignores CHIP names in comments and rejects duplicate or unnamed definitions', () => {
    const source =
      '// CHIP Fake {}\n/* CHIP AlsoFake {} */\nCHIP Actual { IN a; OUT b; PARTS: Not(in=a, out=b); }';
    expect(Object.keys(dependencyMap([source]))).toEqual(['Actual']);
    expect(() => dependencyMap([source, source])).toThrow('Two custom chips are named Actual');
    expect(() => dependencyMap(['// CHIP CommentOnly {}'])).toThrow(
      'Each custom chip needs a CHIP name',
    );
    expect(() => dependencyMap(['/* CHIP CommentOnly {} */'])).toThrow(
      'Each custom chip needs a CHIP name',
    );
  });

  it('keeps names such as __proto__ as own entries without changing the result prototype', () => {
    const source = 'CHIP __proto__ {}';
    const chips = dependencyMap([source]);
    expect(Object.hasOwn(chips, '__proto__')).toBe(true);
    expect(chips.__proto__).toBe(source);
    expect(Object.getPrototypeOf(chips)).toBe(Object.prototype);
  });
});

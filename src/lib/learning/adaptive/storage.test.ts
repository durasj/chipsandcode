import { afterEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  createLearningStorage,
  learningChoices,
  learningChoicesKey,
  learningStorage,
  choicesNotice,
  loadLearningChoices,
  readLearningEvidence,
  saveLearningChoices,
} from './storage.js';
import { emptyChoices } from './model.js';

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
afterEach(() => {
  vi.unstubAllGlobals();
  learningChoices.set(emptyChoices());
  choicesNotice.set('');
});

describe('Resilient progress and draft storage', () => {
  it('reads old data and writes through without changing keys or payloads', () => {
    const device = fakeStorage();
    device.setItem('old', 'draft');
    const store = createLearningStorage(() => device);
    expect(store.getItem('old')).toBe('draft');
    store.setItem('old', 'changed draft');
    expect(device.getItem('old')).toBe('changed draft');
    expect(store.getItem('missing')).toBeNull();
  });
  it('retains edits if writes fail and never falls back to stale persisted content', () => {
    const device = fakeStorage();
    device.setItem('draft', 'old');
    const store = createLearningStorage(() => device);
    expect(store.getItem('draft')).toBe('old');
    const set = vi.spyOn(device, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => store.setItem('draft', 'new work')).toThrow('quota');
    expect(store.getItem('draft')).toBe('new work');
    set.mockRestore();
    store.setItem('draft', 'repaired');
    expect(device.getItem('draft')).toBe('repaired');
  });
  it('retains read data when access later fails and works when storage is denied from the start', () => {
    const device = fakeStorage();
    device.setItem('draft', 'saved work');
    let blocked = false;
    const store = createLearningStorage(() => {
      if (blocked) throw new Error('denied');
      return device;
    });
    expect(store.getItem('draft')).toBe('saved work');
    blocked = true;
    expect(store.getItem('draft')).toBe('saved work');
    expect(store.getItem('unseen')).toBeNull();
    expect(() => store.setItem('unseen', 'session work')).toThrow('denied');
    expect(store.getItem('unseen')).toBe('session work');
  });
});

describe('Additive learning choices and read-only legacy evidence', () => {
  it('reads current gates, course completions and intro without touching drafts or accepting unknown IDs', () => {
    const device = fakeStorage();
    vi.stubGlobal('window', { localStorage: device });
    device.setItem(
      'chipsandcode.progress.v1',
      JSON.stringify(['nand', 'not', 'not', 'missing', 15]),
    );
    device.setItem('chipsandcode.part-one.progress.v1', JSON.stringify(['buses/not16', 'made/up']));
    device.setItem('chipsandcode.part-one.draft.buses/not16', 'unfinished HDL');
    expect(readLearningEvidence(['missions/xor'])).toEqual({
      verifiedTasks: ['missions/nand', 'missions/not', 'buses/not16', 'missions/xor'],
      exploredSignals: true,
    });
    expect(device.getItem('chipsandcode.part-one.draft.buses/not16')).toBe('unfinished HDL');
  });
  it('supports legacy gate progress without rewriting it; a malformed new store can recover from the legacy one', () => {
    const device = fakeStorage();
    vi.stubGlobal('window', { localStorage: device });
    device.setItem('chipsandcode.signal-isles.progress.v1', '["not"]');
    expect(readLearningEvidence().verifiedTasks).toEqual(['missions/not']);
    device.setItem('chipsandcode.progress.v1', '{');
    expect(readLearningEvidence().verifiedTasks).toEqual(['missions/not']);
    expect(device.getItem('chipsandcode.progress.v1')).toBe('{');
  });
  it('handles corrupt or missing progress and explicit signal observations', () => {
    const device = fakeStorage();
    vi.stubGlobal('window', { localStorage: device });
    device.setItem('chipsandcode.progress.v1', '{}');
    device.setItem('chipsandcode.part-one.progress.v1', '{');
    expect(readLearningEvidence()).toEqual({ verifiedTasks: [], exploredSignals: false });
    expect(readLearningEvidence([], true).exploredSignals).toBe(true);
    device.setItem('chipsandcode.signal-intro.v1', 'complete');
    expect(readLearningEvidence().exploredSignals).toBe(true);
  });
  it('does not infer skipped signal observations from a newly checked NAND', () => {
    const device = fakeStorage();
    vi.stubGlobal('window', { localStorage: device });
    device.setItem('chipsandcode.progress.v1', '["nand"]');
    expect(readLearningEvidence().exploredSignals).toBe(true);
    device.setItem('chipsandcode.signal-intro.v1', 'not-observed');
    expect(readLearningEvidence()).toEqual({
      verifiedTasks: ['missions/nand'],
      exploredSignals: false,
    });
    device.setItem('chipsandcode.signal-intro.v1', 'complete');
    expect(readLearningEvidence().exploredSignals).toBe(true);
  });
  it('saves, reloads and resets choices without erasing work', () => {
    const device = fakeStorage();
    vi.stubGlobal('window', { localStorage: device });
    device.setItem('chipsandcode.part-one.draft.memory/pc', 'my design');
    saveLearningChoices({ version: 1, topics: { gates: { feedback: 'too-easy', skipped: true } } });
    const saved = get(learningChoices);
    learningChoices.set(emptyChoices());
    loadLearningChoices();
    expect(get(learningChoices)).toEqual(saved);
    expect(get(choicesNotice)).toBe('');
    saveLearningChoices(emptyChoices());
    expect(device.getItem(learningChoicesKey)).toBe(JSON.stringify(emptyChoices()));
    expect(device.getItem('chipsandcode.part-one.draft.memory/pc')).toBe('my design');
  });
  it('keeps preferences usable in memory when device storage is unavailable and reports reload limits', () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', {
      dispatchEvent,
      get localStorage() {
        throw new Error('denied');
      },
    });
    saveLearningChoices({ version: 1, topics: { memory: { feedback: 'need-help' } } });
    loadLearningChoices();
    expect(get(learningChoices).topics.memory?.feedback).toBe('need-help');
    expect(dispatchEvent).toHaveBeenCalledOnce();
    expect(dispatchEvent.mock.calls[0][0].type).toBe('chipsandcode:learning-choices-changed');
    expect(dispatchEvent.mock.calls[0][0].detail.topics.memory.feedback).toBe('need-help');
    expect(get(choicesNotice)).toContain('Reloading may lose them');
    const device = fakeStorage();
    vi.stubGlobal('window', { localStorage: device });
    learningStorage.setItem(learningChoicesKey, JSON.stringify(emptyChoices()));
  });
});

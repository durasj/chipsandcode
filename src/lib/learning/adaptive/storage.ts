import { writable } from 'svelte/store';
import { courseProgressKey } from '#lib/course/data.js';
import { emptyChoices, parseChoices, type LearningEvidence } from './model.js';
import { learningTopics } from './topics.js';

type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;
/** Retains current work through client-side navigation if device storage is denied/full. */
export function createLearningStorage(access: () => StorageAccess) {
  const session = new Map<string, string>();
  const unsaved = new Set<string>();
  return {
    getItem(key: string): string | null {
      if (unsaved.has(key)) return session.get(key) ?? null;
      try {
        const value = access().getItem(key);
        if (value !== null) session.set(key, value);
        else session.delete(key);
        return value;
      } catch {
        return session.get(key) ?? null;
      }
    },
    setItem(key: string, value: string): void {
      session.set(key, value);
      unsaved.add(key);
      access().setItem(key, value);
      unsaved.delete(key);
    },
  };
}

export const learningStorage = createLearningStorage(() => window.localStorage);
export const learningChoicesKey = 'chipsandcode.learning-choices.v1';
export const learningChoices = writable(emptyChoices());
export const choicesNotice = writable('');

export function loadLearningChoices() {
  learningChoices.set(parseChoices(learningStorage.getItem(learningChoicesKey)));
}

export function saveLearningChoices(choices: ReturnType<typeof emptyChoices>) {
  learningChoices.set(choices);
  try {
    learningStorage.setItem(learningChoicesKey, JSON.stringify(choices));
    choicesNotice.set('');
  } catch {
    choicesNotice.set('Choices are kept for this visit only. Reloading may lose them.');
  }
  // Optional consumers (the visual journey) can stay independent of this module.
  // Include session state: rereading device storage would lose failed writes.
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(
      new CustomEvent('chipsandcode:learning-choices-changed', { detail: choices }),
    );
  }
}

function savedList(key: string): string[] | null {
  try {
    const value = JSON.parse(learningStorage.getItem(key) ?? 'null');
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : null;
  } catch {
    return null;
  }
}

export function readLearningEvidence(
  current: string[] = [],
  exploredSignals = false,
): LearningEvidence {
  const missions =
    savedList('chipsandcode.progress.v1') ??
    savedList('chipsandcode.signal-isles.progress.v1') ??
    [];
  const course = savedList(courseProgressKey) ?? [];
  const known = new Set(learningTopics.flatMap((topic) => topic.tasks.map((task) => task.id)));
  const verifiedTasks = [
    ...new Set([...missions.map((id) => `missions/${id}`), ...course, ...current]),
  ].filter((id) => id !== 'signals' && known.has(id));
  const signalObservation = learningStorage.getItem('chipsandcode.signal-intro.v1');
  return {
    verifiedTasks,
    exploredSignals:
      exploredSignals ||
      signalObservation === 'complete' ||
      (signalObservation === null && missions.includes('nand')),
  };
}

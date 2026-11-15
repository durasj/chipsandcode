import { afterEach, describe, expect, it, vi } from 'vitest';
import { courseChapters } from '#lib/course/data.js';
import { missions } from '#lib/game/missions.js';
import {
  changeChoice,
  completedTasks,
  emptyChoices,
  nextTopic,
  parseChoices,
  recommend,
  suggestedRefreshers,
  topicFinished,
  type LearningEvidence,
} from './model.js';
import { learningTopics, topicById, topicForMission } from './topics.js';

const fresh: LearningEvidence = { verifiedTasks: [], exploredSignals: false };
afterEach(() => vi.useRealTimers());

describe('A topic path with learner agency', () => {
  it('starts a novice at signals without an assessment', () => {
    expect(nextTopic(emptyChoices(), fresh)?.task.href).toBe('/learn?topic=signals');
    expect(recommend('signals', emptyChoices(), fresh)?.task.id).toBe('signals');
  });

  it('recognizes an explored introduction separately from checked constructions', () => {
    expect(completedTasks('signals', fresh)).toEqual([]);
    expect(completedTasks('signals', { ...fresh, exploredSignals: true })).toEqual(['signals']);
    expect(nextTopic(emptyChoices(), { ...fresh, exploredSignals: true })?.task.id).toBe(
      'missions/nand',
    );
    expect(topicFinished('gates', { ...fresh, exploredSignals: true })).toBe(false);
  });

  it('skips a familiar topic without adding evidence or hiding its tasks', () => {
    const choices = changeChoice(emptyChoices(), 'signals', { skipped: true });
    expect(nextTopic(choices, fresh)?.task.id).toBe('missions/nand');
    expect(recommend('signals', choices, fresh)?.task.id).toBe('missions/nand');
    expect(fresh.verifiedTasks).toEqual([]);
    expect(topicFinished('signals', fresh)).toBe(false);
    expect(topicById('signals').tasks[0].href).toBe('/learn?topic=signals');
  });

  it('chooses a synthesis task only after an explicit too-easy preference', () => {
    const choices = changeChoice(emptyChoices(), 'gates', { feedback: 'too-easy' });
    expect(recommend('gates', choices, fresh, 'missions/not')?.task.id).toBe('missions/xor');
    expect(recommend('gates', emptyChoices(), fresh, 'missions/not')?.task.id).toBe(
      'missions/nand',
    );
    expect(
      recommend('memory', changeChoice(choices, 'memory', { feedback: 'too-easy' }), fresh)?.task
        .id,
    ).toBe('memory/pc');
  });

  it('offers a later topic when already at the synthesis task, without marking earlier tasks', () => {
    const choices = changeChoice(emptyChoices(), 'gates', { feedback: 'too-easy' });
    expect(recommend('gates', choices, fresh, 'missions/xor')?.task.id).toBe('missions/mux');
    expect(
      recommend('gates', choices, { ...fresh, verifiedTasks: ['missions/xor'] })?.task.id,
    ).toBe('missions/mux');
    expect(completedTasks('gates', { ...fresh, verifiedTasks: ['missions/xor'] })).toEqual([
      'missions/xor',
    ]);
  });

  it('uses a small starting task for help even after completion and can reverse mistaken skipping', () => {
    const skipped = changeChoice(emptyChoices(), 'arithmetic', {
      skipped: true,
      feedback: 'too-easy',
    });
    const choices = changeChoice(skipped, 'arithmetic', { feedback: 'need-help' });
    const result = recommend(
      'arithmetic',
      choices,
      { ...fresh, verifiedTasks: ['arithmetic/halfadder'] },
      'arithmetic/alu',
    );
    expect(result?.task.id).toBe('arithmetic/halfadder');
    expect(result?.reason).toContain('more help');
    expect(choices.topics.arithmetic?.skipped).toBeUndefined();
    expect(skipped.topics.arithmetic?.skipped).toBe(true);
  });

  it('uses task evidence for the next unverified task, never a broad ability rating', () => {
    const evidence = { ...fresh, verifiedTasks: ['buses/not16'] };
    const choices = changeChoice(emptyChoices(), 'buses', { feedback: 'about-right' });
    expect(recommend('buses', choices, evidence)?.task.id).toBe('buses/and16');
    expect(topicFinished('buses', evidence)).toBe(false);
    expect(completedTasks('gates', evidence)).toEqual([]);
  });

  it('moves on when all activities of one topic are checked and stops at the guided boundary', () => {
    const evidence = {
      ...fresh,
      verifiedTasks: topicById('assembler').tasks.map((task) => task.id),
    };
    expect(topicFinished('assembler', evidence)).toBe(true);
    expect(recommend('assembler', emptyChoices(), evidence)).toBeNull();
    expect(nextTopic(emptyChoices(), fresh, 'assembler')).toBeNull();
    const all = {
      exploredSignals: true,
      verifiedTasks: learningTopics.flatMap((topic) => topic.tasks.map((task) => task.id)),
    };
    expect(nextTopic(emptyChoices(), all)).toBeNull();
  });

  it('keeps unknown prerequisite refreshers visible after a skip or unrelated success', () => {
    expect(suggestedRefreshers('signals', fresh)).toEqual([]);
    expect(suggestedRefreshers('architecture', fresh)).toEqual([
      'arithmetic',
      'memory',
      'machine-language',
    ]);
    const evidence = {
      ...fresh,
      verifiedTasks: topicById('arithmetic').tasks.map((task) => task.id),
    };
    expect(suggestedRefreshers('architecture', evidence)).toEqual(['memory', 'machine-language']);
    expect(suggestedRefreshers('gates', { ...fresh, exploredSignals: true })).toEqual([]);
  });

  it('resets only choices and retains the original evidence', () => {
    const evidence = { ...fresh, verifiedTasks: ['missions/not'] };
    const choices = changeChoice(emptyChoices(), 'gates', { feedback: 'too-easy' });
    const reset = changeChoice(choices, 'gates', null);
    expect(reset).toEqual(emptyChoices());
    expect(evidence.verifiedTasks).toEqual(['missions/not']);
    expect(choices.topics.gates?.feedback).toBe('too-easy');
  });

  it('makes identical recommendations regardless of elapsed time or extraneous event metadata', () => {
    vi.useFakeTimers();
    const choices = changeChoice(emptyChoices(), 'memory', { feedback: 'too-easy' });
    vi.setSystemTime(new Date('2020-01-01'));
    const before = recommend('memory', choices, fresh);
    vi.setSystemTime(new Date('2040-01-01'));
    expect(
      recommend('memory', choices, {
        ...fresh,
        ...{ elapsed: 1e9, failedAttempts: 500, hintCount: 500 },
      }),
    ).toEqual(before);
    expect(
      recommend('memory', choices, {
        ...fresh,
        ...{ elapsed: 0, failedAttempts: 0, hintCount: 0 },
      }),
    ).toEqual(before);
  });
});

describe('Versioned learning choices', () => {
  it.each([
    null,
    '',
    '{',
    'null',
    '[]',
    '{}',
    '{"version":2,"topics":{}}',
    '{"version":1,"topics":false}',
  ])('recovers from absent, malformed or unsupported input %s', (raw) => {
    expect(parseChoices(raw)).toEqual(emptyChoices());
  });
  it('accepts only known topics and feedback; drops timestamps, scores and unknown fields', () => {
    expect(
      parseChoices(
        JSON.stringify({
          version: 1,
          topics: {
            gates: { skipped: true, feedback: 'too-easy', mastery: 99, seconds: 1 },
            signals: { skipped: false, feedback: 'need-help' },
            routing: { feedback: 'about-right' },
            buses: { feedback: 'advanced', skipped: 'true' },
            memory: 'advanced',
            unknown: { skipped: true },
          },
        }),
      ),
    ).toEqual({
      version: 1,
      topics: {
        gates: { skipped: true, feedback: 'too-easy' },
        signals: { feedback: 'need-help' },
        routing: { feedback: 'about-right' },
      },
    });
  });
  it('round-trips choices independently of progress', () => {
    const choices = changeChoice(emptyChoices(), 'memory', {
      skipped: true,
      feedback: 'need-help',
    });
    expect(parseChoices(JSON.stringify(choices))).toEqual(choices);
  });
});

describe('Topic contracts cover the existing guided course', () => {
  it('maps every mission and project task exactly once and uses valid prerequisite/challenge IDs', () => {
    const ids = learningTopics.flatMap((topic) => topic.tasks.map((task) => task.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      'signals',
      ...missions.map((mission) => `missions/${mission.id}`),
      ...courseChapters.flatMap((chapter) =>
        chapter.tasks.map((task) => `${chapter.id}/${task.id}`),
      ),
    ]);
    learningTopics.forEach((topic, index) => {
      expect(topic.tasks.some((task) => task.id === topic.challenge)).toBe(true);
      topic.prerequisites.forEach((id) =>
        expect(learningTopics.findIndex((item) => item.id === id)).toBeLessThan(index),
      );
      topic.tasks.forEach((task) => {
        const url = new URL(task.href, 'https://example.test');
        expect(url.pathname === '/learn' || url.pathname === `/learn/path/${topic.id}`).toBe(true);
        expect(url.search).not.toBe('');
      });
    });
  });
  it('keeps knowledge in topic groups rather than a permanent learner level', () => {
    expect(topicForMission('not')).toBe('gates');
    expect(topicForMission('mux')).toBe('routing');
    expect(topicForMission('dmux')).toBe('routing');
  });
});

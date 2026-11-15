import { learningTopics, topicById, type LearningTask, type TopicId } from './topics.js';

export type DifficultyFeedback = 'too-easy' | 'about-right' | 'need-help';
export interface TopicChoice {
  skipped?: true;
  feedback?: DifficultyFeedback;
}
export interface LearningChoices {
  version: 1;
  topics: Partial<Record<TopicId, TopicChoice>>;
}
export interface LearningEvidence {
  /** A passed task is evidence about that task, never a claim of topic mastery. */
  verifiedTasks: string[];
  exploredSignals: boolean;
}
export interface Recommendation {
  task: LearningTask;
  reason: string;
}
export const emptyChoices = (): LearningChoices => ({ version: 1, topics: {} });

export function parseChoices(raw: string | null): LearningChoices {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (value?.version !== 1 || !value.topics || typeof value.topics !== 'object')
      return emptyChoices();
    const choices = emptyChoices();
    for (const topic of learningTopics) {
      const item = value.topics[topic.id];
      if (!item || typeof item !== 'object') continue;
      const choice: TopicChoice = {};
      if (item.skipped === true) choice.skipped = true;
      if (['too-easy', 'about-right', 'need-help'].includes(item.feedback))
        choice.feedback = item.feedback;
      if (Object.keys(choice).length) choices.topics[topic.id] = choice;
    }
    return choices;
  } catch {
    return emptyChoices();
  }
}

export function changeChoice(
  choices: LearningChoices,
  id: TopicId,
  change: TopicChoice | null,
): LearningChoices {
  const topics = { ...choices.topics };
  if (change) topics[id] = change;
  else delete topics[id];
  return { version: 1, topics };
}

export function completedTasks(id: TopicId, evidence: LearningEvidence): string[] {
  return topicById(id)
    .tasks.filter((task) =>
      task.id === 'signals' ? evidence.exploredSignals : evidence.verifiedTasks.includes(task.id),
    )
    .map((task) => task.id);
}

export function topicFinished(id: TopicId, evidence: LearningEvidence): boolean {
  return completedTasks(id, evidence).length === topicById(id).tasks.length;
}

/** Unknown prerequisites stay visible even when the learner says they are familiar. */
export function suggestedRefreshers(id: TopicId, evidence: LearningEvidence): TopicId[] {
  return topicById(id).prerequisites.filter(
    (prerequisite) => !topicFinished(prerequisite, evidence),
  );
}

export function nextTopic(
  choices: LearningChoices,
  evidence: LearningEvidence,
  after?: TopicId,
): Recommendation | null {
  const start = after ? learningTopics.findIndex((topic) => topic.id === after) + 1 : 0;
  const next = learningTopics
    .slice(start)
    .find((topic) => !choices.topics[topic.id]?.skipped && !topicFinished(topic.id, evidence));
  if (!next) return null;
  const done = completedTasks(next.id, evidence);
  return {
    task: next.tasks.find((task) => !done.includes(task.id))!,
    reason: `A next step in ${next.title.toLowerCase()}. You can choose any topic.`,
  };
}

/** Pure rules: no clock, duration, failure count, hints, editor errors, or ability label. */
export function recommend(
  id: TopicId,
  choices: LearningChoices,
  evidence: LearningEvidence,
  currentTask?: string,
): Recommendation | null {
  const topic = topicById(id);
  const choice = choices.topics[id];
  const done = completedTasks(id, evidence);
  if (choice?.skipped) return nextTopic(choices, evidence, id);
  if (choice?.feedback === 'need-help') {
    return {
      task: topic.tasks[0],
      reason:
        'You asked for more help. Try this smaller starting step, or use the hint and focused refreshers below.',
    };
  }
  if (choice?.feedback === 'too-easy') {
    const challenge = topic.tasks.find((task) => task.id === topic.challenge)!;
    if (challenge.id !== currentTask && !done.includes(challenge.id)) {
      return {
        task: challenge,
        reason:
          'You asked for more challenge. This task combines ideas from this topic; earlier tasks remain available.',
      };
    }
    return nextTopic(choices, evidence, id);
  }
  const next = topic.tasks.find((task) => !done.includes(task.id));
  return next
    ? {
        task: next,
        reason: 'Keep building one step at a time. This task has not been checked here yet.',
      }
    : nextTopic(choices, evidence, id);
}

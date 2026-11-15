import { courseChapters, type ChapterId } from '#lib/course/data.js';
import { missions } from '#lib/game/missions.js';

export type TopicId = 'signals' | 'gates' | 'routing' | ChapterId;
export interface LearningTask {
  id: string;
  title: string;
  href: string;
}
export interface LearningTopic {
  id: TopicId;
  title: string;
  description: string;
  prerequisites: TopicId[];
  reference: string;
  tasks: LearningTask[];
  challenge: string;
}

const gateTasks = (ids: string[]): LearningTask[] =>
  missions
    .filter((mission) => ids.includes(mission.id))
    .map((mission) => ({
      id: `missions/${mission.id}`,
      title: `${mission.chip}: ${mission.title.toLowerCase()}`,
      href: `/learn?mission=${mission.id}`,
    }));

const prerequisites: Record<ChapterId, TopicId[]> = {
  buses: ['gates', 'routing'],
  arithmetic: ['gates', 'buses'],
  memory: ['routing', 'buses'],
  'machine-language': ['arithmetic', 'memory'],
  architecture: ['arithmetic', 'memory', 'machine-language'],
  assembler: ['machine-language'],
};

export const learningTopics: LearningTopic[] = [
  {
    id: 'signals',
    title: 'Signals & first gates',
    description: 'Two states, NOT, and AND. Start here if this is new.',
    prerequisites: [],
    reference: '/learn/reference/boolean-logic',
    tasks: [{ id: 'signals', title: 'Explore a signal', href: '/learn?topic=signals' }],
    challenge: 'signals',
  },
  {
    id: 'gates',
    title: 'Build logic gates',
    description: 'NAND, inversion, conditions, and comparing bits.',
    prerequisites: ['signals'],
    reference: '/learn/reference/boolean-logic/background',
    tasks: gateTasks(['nand', 'not', 'and', 'or', 'xor']),
    challenge: 'missions/xor',
  },
  {
    id: 'routing',
    title: 'Select & route',
    description: 'Use a control bit to choose where data goes.',
    prerequisites: ['gates'],
    reference: '/learn/reference/boolean-logic/project',
    tasks: gateTasks(['mux', 'dmux']),
    challenge: 'missions/dmux',
  },
  ...courseChapters.map((chapter): LearningTopic => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    prerequisites: prerequisites[chapter.id],
    reference: chapter.reference,
    tasks: chapter.tasks.map((task) => ({
      id: `${chapter.id}/${task.id}`,
      title: task.title,
      href: `/learn/path/${chapter.id}?task=${task.id}`,
    })),
    challenge: `${chapter.id}/${chapter.tasks.at(-1)!.id}`,
  })),
];

export const topicById = (id: TopicId): LearningTopic =>
  learningTopics.find((topic) => topic.id === id)!;
export const topicForMission = (id: string): TopicId =>
  id === 'mux' || id === 'dmux' ? 'routing' : 'gates';

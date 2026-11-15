import { courseChapters, taskKey } from '#lib/course/data.js';
import { missions } from '#lib/game/missions.js';
import { treatments } from './treatments';
export { treatments } from './treatments';

export type Layer =
  | 'signals'
  | 'gates'
  | 'buses'
  | 'arithmetic'
  | 'memory'
  | 'machine-language'
  | 'architecture'
  | 'assembler';
export type Diagram =
  | 'signal'
  | 'gate'
  | 'parallel'
  | 'reduce'
  | 'select'
  | 'distribute'
  | 'adder'
  | 'alu'
  | 'state'
  | 'bank'
  | 'counter'
  | 'instruction'
  | 'loop'
  | 'devices'
  | 'address'
  | 'cpu'
  | 'computer'
  | 'encode'
  | 'symbols'
  | 'translator';
export interface JourneyStep {
  id: string;
  layer: Layer;
  label: string;
  diagram: Diagram;
  parts: string[];
  prior: string;
  change: string;
  next: string;
  inputs: string[];
  outputs: string[];
  href: string;
  supplied?: boolean;
  count?: number;
}
export const layers: { id: Layer; label: string; role: string }[] = [
  { id: 'signals', label: 'Signals', role: 'Represent a value' },
  { id: 'gates', label: 'Logic', role: 'Transform and route bits' },
  { id: 'buses', label: 'Words', role: 'Work with many bits' },
  { id: 'arithmetic', label: 'Arithmetic', role: 'Calculate a result' },
  { id: 'memory', label: 'State', role: 'Keep a value over time' },
  { id: 'machine-language', label: 'Instructions', role: 'Control the machine' },
  { id: 'architecture', label: 'Computer', role: 'Connect the whole system' },
  { id: 'assembler', label: 'Assembler', role: 'Translate names into bits' },
];
const intro = ['signal', 'not', 'and'].map((id): JourneyStep => ({
  id: `intro/${id}`,
  layer: 'signals',
  label: id === 'signal' ? 'Signal' : id.toUpperCase(),
  diagram: treatments[`intro/${id}`][0],
  parts: treatments[`intro/${id}`][1],
  prior: treatments[`intro/${id}`][2],
  change: treatments[`intro/${id}`][3],
  next: treatments[`intro/${id}`][4],
  inputs: id === 'and' ? ['a', 'b'] : ['in'],
  outputs: ['out'],
  href: '/learn?topic=signals',
  supplied: id !== 'signal',
}));
export const journeySteps: JourneyStep[] = [
  ...intro,
  ...missions.map((mission): JourneyStep => {
    const [diagram, parts, prior, change, next, count] = treatments[`missions/${mission.id}`];
    return {
      id: `missions/${mission.id}`,
      layer: 'gates',
      label: mission.chip,
      diagram,
      parts,
      prior,
      change,
      next,
      count,
      inputs: mission.inputs,
      outputs: mission.outputs,
      href: `/learn?mission=${mission.id}`,
      supplied: mission.id === 'nand',
    };
  }),
  ...courseChapters.flatMap((chapter) =>
    chapter.tasks.map((task): JourneyStep => {
      const id = taskKey(chapter, task);
      const [diagram, parts, prior, change, next, count] = treatments[id];
      const pins = (values: Record<string, number> = {}) =>
        Object.entries(values).map(([name, width]) => (width === 1 ? name : `${name}[${width}]`));
      return {
        id,
        layer: chapter.id,
        label: task.chip ?? task.title,
        diagram,
        parts,
        prior,
        change,
        next,
        count,
        inputs: pins(task.inputs),
        outputs: pins(task.outputs),
        href: `/learn/path/${chapter.id}?task=${task.id}`,
      };
    }),
  ),
];
export const getJourneyStep = (id: string) =>
  journeySteps.find((step) => step.id === id) ?? journeySteps[0];
export function journeyStatus(
  step: JourneyStep,
  activeId: string,
  completed: readonly string[],
  bypassed: readonly string[] = [],
): string {
  if (completed.includes(step.id))
    return step.id.startsWith('intro/') || step.supplied ? 'Explored' : 'Verified';
  if (step.id === activeId) return 'Current challenge';
  const topic = step.id === 'missions/mux' || step.id === 'missions/dmux' ? 'routing' : step.layer;
  return bypassed.includes(topic) ? 'Bypassed · not verified here' : 'Not verified here';
}
export function draftParts(source: string): string[] {
  const body =
    source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '')
      .split(/PARTS\s*:/i)[1] ?? '';
  return [...body.matchAll(/\b([A-Za-z][A-Za-z0-9_]*)\s*\(/g)].map((match) => match[1]);
}

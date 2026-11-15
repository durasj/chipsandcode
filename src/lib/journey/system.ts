import { journeySteps } from './data';
/** Learning branches, not a fabricated single chain of physical containment. */
export function systemEvidence(completed: readonly string[]) {
  const groups: Record<string, string[]> = {
    Logic: journeySteps
      .filter((step) => ['signals', 'gates', 'buses'].includes(step.layer))
      .map((step) => step.id),
    ALU: journeySteps.filter((step) => step.layer === 'arithmetic').map((step) => step.id),
    Memory: journeySteps
      .filter((step) => step.layer === 'memory' && step.id !== 'memory/pc')
      .map((step) => step.id)
      .concat('architecture/memory'),
    CPU: ['memory/pc', 'architecture/cpu'],
    ROM: journeySteps
      .filter((step) => ['machine-language', 'assembler'].includes(step.layer))
      .map((step) => step.id),
  };
  return Object.fromEntries(
    Object.entries(groups).map(([name, ids]) => [
      name,
      {
        count: ids.filter((id) => completed.includes(id)).length,
        total: ids.length,
        pieces: journeySteps
          .filter((step) => ids.includes(step.id) && completed.includes(step.id))
          .map((step) => step.label),
      },
    ]),
  );
}

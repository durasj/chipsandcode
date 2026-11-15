/** Read legacy evidence defensively. One corrupt optional store must not hide another. */
export function readJourneyEvidence(storage: Pick<Storage, 'getItem'>): {
  completed: string[];
  bypassed: string[];
} {
  const raw = (key: string): string | null => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };
  const json = (value: string | null): unknown => {
    try {
      return JSON.parse(value ?? 'null');
    } catch {
      return null;
    }
  };
  const ids = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  const gates = ids(
    json(raw('chipsandcode.progress.v1') ?? raw('chipsandcode.signal-isles.progress.v1')),
  );
  const intro = raw('chipsandcode.signal-intro.v1');
  // Preserve legacy intro evidence, while an explicit direct-entry marker defeats inference.
  const introComplete = intro === 'complete' || (intro === null && gates.includes('nand'));
  const completed = [
    ...ids(json(raw('chipsandcode.part-one.progress.v1'))),
    ...gates.map((id) => `missions/${id}`),
    ...(introComplete ? ['intro/signal', 'intro/not', 'intro/and'] : []),
  ];
  const choices = json(raw('chipsandcode.learning-choices.v1'));
  const bypassed = journeyBypassed(choices);
  return { completed: [...new Set(completed)], bypassed };
}

export function journeyBypassed(choices: unknown): string[] {
  const topics =
    choices && typeof choices === 'object' && 'topics' in choices ? choices.topics : choices;
  return topics && typeof topics === 'object' && !Array.isArray(topics)
    ? Object.entries(topics)
        .filter(
          ([, value]) =>
            value && typeof value === 'object' && 'skipped' in value && value.skipped === true,
        )
        .map(([id]) => id)
    : [];
}

export type WorkshopDraft = {
  hdl: string;
  dependencies: string[];
  name: string;
  tests: string;
  compare: string;
  saved: string;
};

/** Read the previous workshop draft without changing or removing either workspace's data. */
export function readWorkshopDraft(storage: Pick<Storage, 'getItem'>): WorkshopDraft | undefined {
  try {
    const raw = storage.getItem('chipsandcode.chip-builder.v1');
    if (!raw) return;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('source' in value)) return;
    if (typeof value.source !== 'string' || value.source.length > 1000000) return;
    const dependencies = 'dependencies' in value ? value.dependencies : [];
    if (!Array.isArray(dependencies) || dependencies.length > 100) return;
    const sources: string[] = [];
    for (const item of dependencies) {
      if (!item || typeof item !== 'object' || !('source' in item)) return;
      if (typeof item.source !== 'string' || item.source.length > 1000000) return;
      sources.push(item.source);
    }
    return {
      hdl: value.source,
      dependencies: sources,
      name: 'Workshop draft',
      tests: '',
      compare: '',
      saved: new Date().toISOString(),
    };
  } catch {
    // Blocked storage and malformed historical data must not block the current editor.
    return;
  }
}

/** Name independent HDL files before compiling their structural definitions. */
export function dependencyMap(sources: string[]): Record<string, string> {
  const entries: [string, string][] = [];
  const names = new Set<string>();
  for (const source of sources) {
    const clean = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    const name = clean.match(/\bCHIP\s+([A-Za-z_][A-Za-z0-9_]*)/)?.[1];
    if (!name) throw new Error('Each custom chip needs a CHIP name and its own HDL definition.');
    if (names.has(name))
      throw new Error(`Two custom chips are named ${name}. Give each definition a unique name.`);
    names.add(name);
    entries.push([name, source]);
  }
  return Object.fromEntries(entries);
}

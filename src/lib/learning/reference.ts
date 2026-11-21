export const referencePages = [
  {
    path: 'boolean-logic',
    source: 'boolean-logic/intro',
    label: 'Overview',
    title: 'From signals to logic',
  },
  {
    path: 'boolean-logic/background',
    source: 'boolean-logic/background',
    label: 'The explanation',
    title: 'Logic, composition, and HDL',
  },
  {
    path: 'boolean-logic/project',
    source: 'boolean-logic/project',
    label: 'Gate contracts',
    title: 'Gate contracts and larger buses',
  },
  {
    path: 'boolean-arithmetic',
    source: 'boolean-arithmetic/intro',
    label: 'Arithmetic and the ALU',
    title: 'From bits to arithmetic',
  },
  {
    path: 'memory',
    source: 'memory/intro',
    label: 'Memory and clocks',
    title: 'Give the machine a memory',
  },
  {
    path: 'machine-language',
    source: 'machine-language/intro',
    label: 'Machine language',
    title: 'Tell the machine what to do',
  },
  {
    path: 'computer-architecture',
    source: 'computer-architecture/intro',
    label: 'Computer architecture',
    title: 'Put the computer together',
  },
  {
    path: 'assembler',
    source: 'assembler/intro',
    label: 'The assembler',
    title: 'Turn symbols into instructions',
  },
  {
    path: 'meta/what-next',
    source: 'meta/what-next',
    label: 'What comes next',
    title: 'Beyond the assembler',
  },
] as const;

export const referenceUrl = (path: string) => `/learn/reference/${path}`;

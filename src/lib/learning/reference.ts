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
    path: 'meta/what-next',
    source: 'meta/what-next',
    label: 'What comes next',
    title: 'Beyond the logic layer',
  },
] as const;

export const referenceUrl = (path: string) => `/learn/reference/${path}`;

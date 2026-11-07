import { writable } from 'svelte/store';

// One coherent canvas for learning, tools, and reading. Individual narrative
// sections may use a light surface with their own explicit high-contrast ink.
export const theme = writable<'light' | 'dark'>('dark');

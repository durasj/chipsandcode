import { writable } from 'svelte/store';

let defaultTheme: 'dark' | 'light' = 'light';
if (typeof window !== 'undefined') {
  defaultTheme = window.localStorage?.getItem('theme') as 'dark' | 'light';
  // We should not dynamically adapt the theme once explicit choice is made
  if (!defaultTheme) {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    defaultTheme = prefersDark ? 'dark' : 'light';
  }
}
export const theme = writable<'light' | 'dark'>(defaultTheme);

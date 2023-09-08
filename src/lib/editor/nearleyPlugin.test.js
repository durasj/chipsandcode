import { describe, expect, it } from 'vitest';
import contentPlugin from './nearleyPlugin';

describe('Nearley Vite Plugin', () => {
  it('Has correct structure', () => {
    const plugin = contentPlugin();

    expect(plugin).toMatchObject({
      name: 'vite-plugin-nearley',
      enforce: 'pre',
      transform: expect.any(Function),
    });
  });

  it('Ignores files that are not .ne', () => {
    const plugin = contentPlugin();

    expect(plugin.transform('const x = 123;', 'component.ts')).toBeUndefined();
    expect(plugin.transform('Some Content', 'component.svelte')).toBeUndefined();
    expect(plugin.transform('* { color: #000000 !important; }', 'component.css')).toBeUndefined();
    expect(plugin.transform('# Something', 'content.md')).toBeUndefined();
  });

  it('Processes grammar into code', () => {
    const plugin = contentPlugin();

    const grammar = `
P -> S

S -> S "+" M
    | M

M -> M "*" T
    | T

T -> "1"
    | "2"
    | "3"
    | "4"
    `;

    expect(plugin.transform(grammar, 'grammar.ne')).toMatchSnapshot();
  });
});

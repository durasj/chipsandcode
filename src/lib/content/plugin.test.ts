import { describe, expect, it } from 'vitest';
import contentPlugin from './plugin';

describe('Markdown Content Vite Plugin', () => {
  it('Has correct structure', () => {
    const plugin = contentPlugin();

    expect(plugin).toMatchObject({
      name: 'transform-markdown-content',
      enforce: 'pre',
      transform: expect.any(Function),
    });
  });

  it('Ignores files that are not .md', () => {
    const plugin = contentPlugin();

    expect(plugin.transform('const x = 123;', 'component.ts')).toBeUndefined();
    expect(plugin.transform('Some Content', 'component.svelte')).toBeUndefined();
    expect(plugin.transform('* { color: #000000 !important; }', 'component.css')).toBeUndefined();
  });

  it('Processes markdown into code', () => {
    const plugin = contentPlugin();

    const markdown = `---
foo: bar
---

Content
`;

    expect(plugin.transform(markdown, 'content.md')).toMatchSnapshot();
  });
});

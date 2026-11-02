import { error } from '@sveltejs/kit';
import type { RenderableTreeNode, Tag } from '@markdoc/markdoc';
import type { Content } from '#lib/content/types.js';
import { referencePages } from '#lib/learning/reference.js';
import type { PageLoad } from './$types';

export const prerender = 'auto';

const modules = import.meta.glob('../../hardware/**/*.md');

function isTag(node: RenderableTreeNode): node is Tag {
  return (
    !!node &&
    typeof node === 'object' &&
    !Array.isArray(node) &&
    typeof node.name === 'string' &&
    Array.isArray(node.children) &&
    !!node.attributes &&
    typeof node.attributes === 'object'
  );
}

function textOf(node: RenderableTreeNode): string {
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isTag(node)) return node.children.map(textOf).join('');
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}

export const load = (async ({ params }) => {
  const requested = (params.path || 'boolean-logic').replace(/\/$/, '');
  const pageIndex = referencePages.findIndex(
    (page) => page.path === requested || page.source === requested,
  );
  if (pageIndex < 0) error(404, 'This explanation was not found.');
  const current = referencePages[pageIndex];
  const importer = modules[`../../hardware/${current.source}.md`];
  if (!importer) error(404, 'This explanation was not found.');
  const module = (await importer()) as { default: Content };
  const headings: { id: string; title: string }[] = [];
  const usedIds = new Map<string, number>();

  function withAnchors(node: RenderableTreeNode): RenderableTreeNode {
    if (Array.isArray(node)) return node.map(withAnchors) as unknown as RenderableTreeNode;
    if (!isTag(node)) return node;
    const children = node.children.map(withAnchors);
    if (node.name === 'h2' || node.name === 'h3') {
      const title = textOf(node);
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const occurrence = usedIds.get(slug) ?? 0;
      usedIds.set(slug, occurrence + 1);
      const id = occurrence ? `${slug}-${occurrence + 1}` : slug;
      if (node.name === 'h2') headings.push({ id, title });
      return { ...node, attributes: { ...node.attributes, id }, children } as Tag;
    }
    return { ...node, children } as Tag;
  }

  const content = withAnchors(module.default.content) as Tag;
  return {
    title: current.title,
    current,
    headings,
    content: content.children,
    previous: referencePages[pageIndex - 1] ?? null,
    next: referencePages[pageIndex + 1] ?? null,
  };
}) satisfies PageLoad;

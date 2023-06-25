import type { RenderableTreeNode } from '@markdoc/markdoc';

export interface ContentMeta {
  title: string;
  updated: string;
}

export interface Content {
  meta: ContentMeta;
  content: RenderableTreeNode;
}

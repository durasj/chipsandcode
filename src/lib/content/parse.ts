import Markdoc, { type Config, type RenderableTreeNode } from '@markdoc/markdoc';
import { parse } from 'yaml';
import type { Content } from './types';

const config = {
  tags: {
    math: {
      render: 'Math',
      description: 'Math KaTeX expression',
      inline: true,
      selfClosing: true,
      attributes: {
        expr: {
          type: String,
        },
      },
    },
    EmbeddedHardwareIDE: {
      render: 'EmbeddedHardwareIDE',
      description: 'Embedded Hardware IDE',
      selfClosing: true,
      attributes: {
        id: {
          type: String,
        },
      },
    },
    EmbeddedStartingFiles: {
      render: 'EmbeddedStartingFiles',
      description: 'Embedded Starting Files',
      selfClosing: true,
      attributes: {
        id: {
          type: String,
        },
        name: {
          type: String,
        },
      },
    },
    EmbeddedVideo: {
      render: 'EmbeddedVideo',
      description: 'Embedded YouTube Video',
      selfClosing: true,
      attributes: {
        id: {
          type: String,
        },
      },
    },
  },
} satisfies Config;

const parseMarkdown = (doc: string) => {
  // Primitive way to support inline $math$ expressions
  // Markdoc doesn't support custom syntax like this
  const expandedDoc = doc.replaceAll(/\$(.+?)\$/g, '{% math expr="$1" /%}');

  const tokenizer = new Markdoc.Tokenizer({
    allowIndentation: true,
    allowComments: true,
    linkify: true,
    typographer: true,
  });
  const tokens = tokenizer.tokenize(expandedDoc);
  const ast = Markdoc.parse(tokens);

  const meta: unknown = ast.attributes.frontmatter ? parse(ast.attributes.frontmatter) : undefined;

  const content = Markdoc.transform(ast, { ...config, variables: { meta } });

  // Transform headings so that we start with h2 - there is only one h1 and it is already on the page
  const headingMap = {
    h1: 'h2',
    h2: 'h3',
    h3: 'h4',
    h4: 'h5',
    h5: 'h6',
    h6: 'h7',
  };
  const shiftHeading = (node: RenderableTreeNode): RenderableTreeNode => {
    if (!node || !(typeof node === 'object') || Array.isArray(node)) return node;

    const mappedHeading =
      typeof node.name === 'string' && node.name in headingMap
        ? headingMap[node.name as keyof typeof headingMap]
        : undefined;

    const children = Array.isArray(node.children) ? node.children.map(shiftHeading) : node.children;

    return mappedHeading
      ? ({ ...node, name: mappedHeading, children } as RenderableTreeNode)
      : ({ ...node, children } as RenderableTreeNode);
  };

  const processedContent = shiftHeading(content);

  return { meta, content: processedContent } as Content;
};

export default parseMarkdown;

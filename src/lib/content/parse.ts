import Markdoc, { type Config } from '@markdoc/markdoc';
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
  },
} satisfies Config;

const parseMarkdown = (doc: string) => {
  // Primitive way to support inline $math$ expressions
  // Markdoc doesn't support custom syntax like this
  const expandedDoc = doc.replaceAll(/\$(.+?)\$/g, '{% math expr="$1" /%}');

  const ast = Markdoc.parse(expandedDoc);

  const meta: unknown = ast.attributes.frontmatter ? parse(ast.attributes.frontmatter) : undefined;

  const content = Markdoc.transform(ast, { ...config, variables: { meta } });

  return { meta, content } as Content;
};

export default parseMarkdown;

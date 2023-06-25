import Markdoc, { type Config } from '@markdoc/markdoc';
import { parse } from 'yaml';
import type { Content } from './types';

const config = {} satisfies Config;

const parseMarkdown = (doc: string) => {
  const ast = Markdoc.parse(doc);

  const meta: unknown = ast.attributes.frontmatter ? parse(ast.attributes.frontmatter) : undefined;

  const content = Markdoc.transform(ast, { config, variables: { meta } });

  return { meta, content } as Content;
};

export default parseMarkdown;

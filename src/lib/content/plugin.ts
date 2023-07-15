import { dataToEsm } from '@rollup/pluginutils';

import parseMarkdown from './parse';

/**
 * Vite plugin that transforms markdown imports into AST using markdoc
 */
const fileRegex = /\.(md)$/;

export default function contentPlugin() {
  return {
    name: 'transform-markdown-content',
    enforce: 'pre',

    transform(src: string, id: string) {
      if (!fileRegex.test(id)) return;

      return {
        code: dataToEsm(parseMarkdown(src), {
          preferConst: true,
          namedExports: false,
        }),
        map: null,
      };
    },
  };
}

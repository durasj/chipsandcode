import { createFilter } from '@rollup/pluginutils';
import nearley from 'nearley/lib/nearley.js';
import compile from 'nearley/lib/compile.js';
import generate from 'nearley/lib/generate.js';
import lint from 'nearley/lib/lint.js';
import rawGrammar from 'nearley/lib/nearley-language-bootstrapped.js';

/**
 * Vite (rollup) plugin for nearley
 *
 * @todo Create a separate NPM package
 */
export default function NearleyPlugin(userOptions = {}) {
  const nearleyGrammar = nearley.Grammar.fromCompiled(rawGrammar);

  const filter = createFilter(userOptions.include || /\.ne$/, userOptions.exclude);

  const textToGrammar = (fileName, text) => {
    const parser = new nearley.Parser(nearleyGrammar);
    parser.feed(text);

    const compilation = compile(parser.results[0], { file: fileName });
    lint(compilation, {});

    return generate.module(compilation);
  };

  return {
    name: 'vite-plugin-nearley',
    enforce: 'pre',
    transform(raw, id) {
      if (!filter(id)) return;

      try {
        return {
          code: textToGrammar(id, raw),
          map: null,
        };
      } catch (e) {
        this.error(e);
        return {};
      }
    },
  };
}

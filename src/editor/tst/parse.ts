import { Parser, Grammar } from 'nearley';

import grammar from './grammar.ne';
import type { Root } from './tree';

/**
 * Parses provided test script source code to AST
 *
 * @param input test script source code
 */
function parse(input: string): Root | undefined {
  const parser = new Parser(Grammar.fromCompiled(grammar));
  parser.feed(input);

  if (parser.results.length > 1) {
    // TODO: Log to Sentry once (if) it gets integrated
    console.warn('Ambiguous parser result!', parser.results);
  }

  return parser.results[0];
}

export default parse;

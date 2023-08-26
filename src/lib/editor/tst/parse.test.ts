import { describe, expect, it } from 'vitest';
import { extname, basename } from 'node:path';
import parse from './parse';

const minimalTst = `output-list in%B1.16.1;`;
const emptyOutputListTst = `output-list;`;

describe('TST Parser', () => {
  it('Parses empty TST', () => {
    const output = parse('');

    expect(output).toBeUndefined();
  });

  it('Parses minimal TST with only output list', () => {
    const ast = parse(minimalTst);

    expect(ast).toMatchSnapshot();
  });

  it('Does not parse an empty output list', () => {
    expect(() => parse(emptyOutputListTst)).toThrowError(
      /Syntax error at line 1 col 12:\n\n1 {2}output-list;/m,
    );
  });

  // Project 1 TST files
  const project1Tsts = import.meta.glob('./testing/project1/*.tst', { as: 'raw', eager: true });
  for (const [path, content] of Object.entries(project1Tsts)) {
    const name = basename(path, extname(path));

    it(`Parses Project 1 ${name}`, () => {
      const ast = parse(content);

      expect(JSON.stringify(ast, null, 2)).toMatchFileSnapshot(
        `./testing/project1/${name}.tst.ast`,
      );
    });
  }
});

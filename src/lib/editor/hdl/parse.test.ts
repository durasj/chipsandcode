import { describe, expect, it } from 'vitest';
import { extname, basename } from 'node:path';
import parse from './parse';

const emptyChip = `CHIP And {}`;
const chipWithoutName = `CHIP { IN a; }`;
const minimalChip = `CHIP Foo { IN a; }`;
const chipWithEmptyParts = `CHIP Foo { PARTS: }`;

describe('HDL Parser', () => {
  it('Parses empty HDL', () => {
    const output = parse('');

    expect(output).toBeUndefined();
  });

  it('Does not parse an empty CHIP', () => {
    expect(() => parse(emptyChip)).toThrowError(
      /Syntax error at line 1 col 11:\n\n1 {2}CHIP And {}/m,
    );
  });

  it('Does not parse CHIP without name', () => {
    expect(() => parse(chipWithoutName)).toThrowError(
      /Syntax error at line 1 col 6:\n\n1 {2}CHIP { IN a; }/m,
    );
  });

  it('Parses minimal CHIP with only pin definition', () => {
    const ast = parse(minimalChip);

    expect(ast).toMatchSnapshot();
  });

  it('Does not parse empty PARTS', () => {
    expect(() => parse(chipWithEmptyParts)).toThrowError(
      /Syntax error at line 1 col 19:\n\n1 {2}CHIP Foo { PARTS: }/m,
    );
  });

  // Built-in HDL files
  const builtInHdls = import.meta.glob('./testing/builtin/*.hdl', { as: 'raw', eager: true });
  for (const [path, content] of Object.entries(builtInHdls)) {
    const name = basename(path, extname(path));

    it(`Parses Built-In ${name}`, () => {
      const ast = parse(content);

      expect(JSON.stringify(ast, null, 2)).toMatchFileSnapshot(`./testing/builtin/${name}.hdl.ast`);
    });
  }

  // Project 1 HDL files
  const project1Hdls = import.meta.glob('./testing/project1/*.hdl', { as: 'raw', eager: true });
  for (const [path, content] of Object.entries(project1Hdls)) {
    const name = basename(path, extname(path));

    it(`Parses Project 1 ${name}`, () => {
      const ast = parse(content);

      expect(JSON.stringify(ast, null, 2)).toMatchFileSnapshot(
        `./testing/project1/${name}.hdl.ast`,
      );
    });
  }
});

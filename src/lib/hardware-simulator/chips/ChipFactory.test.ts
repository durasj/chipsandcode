import { describe, expect, it } from 'vitest';
import { basename, extname } from 'node:path';

import ChipFactory from './ChipFactory';
import AndChip from './builtin/AndChip';

describe('Chip Factory', () => {
  it('Provides built-in chips', async () => {
    const factory = new ChipFactory();

    expect(factory.fromDefined('And')).toBeInstanceOf(AndChip);
  });

  it('Does not provide unknown built-in chips', () => {
    const factory = new ChipFactory();

    expect(factory.fromDefined('FooBar')).toBeUndefined();
  });

  it('Provides list of built-in chips', async () => {
    const factory = new ChipFactory();

    expect(factory.getAvailableChips()).toStrictEqual(['And', 'Nand', 'Not', 'Or', 'Xor']);
  });

  it.todo('Throws with the list of available chips if unknown chip was used');

  // Built-in HDL files
  const builtInHdlAsts = import.meta.glob('$lib/editor/hdl/testing/builtin/*.hdl.ast', {
    as: 'raw',
    eager: true,
  });
  for (const [path, content] of Object.entries(builtInHdlAsts)) {
    const name = basename(path, extname(path));

    it(`Creates Chip from Built-In ${name}`, () => {
      const factory = new ChipFactory();

      const ast = factory.fromAST(JSON.parse(content)[0]);

      expect(ast.name).toMatchSnapshot();
      expect(ast.getPins()).toMatchSnapshot();
    });
  }

  // Project 1 HDL files
  const project1HdlAsts = import.meta.glob('$lib/editor/hdl/testing/project1/*.hdl.ast', {
    as: 'raw',
    eager: true,
  });
  for (const [path, content] of Object.entries(project1HdlAsts)) {
    const name = basename(path, extname(path));

    it(`Creates Chip from Project 1 ${name}`, () => {
      const factory = new ChipFactory();

      const ast = factory.fromAST(JSON.parse(content)[0]);

      expect(ast.name).toMatchSnapshot();
      expect(ast.getPins()).toMatchSnapshot();
    });
  }
});

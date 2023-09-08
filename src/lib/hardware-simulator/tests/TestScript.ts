import type { OutputListNode, OutputSpecNode, Root } from '../../editor/tst/tree';
import type Chip from '../chips/Chip';
import Output from './Output';

type SideEffect = { type: 'output'; output: string };

/**
 * Test script
 */
export default class TestScript {
  public constructor(
    private readonly outputs: OutputSpecNode[],
    private readonly cases: Root['cases'],
  ) {}

  /**
   * Run the script comparing, optionally (if not empty), to the expected output
   */
  public run(chip: Chip, expected: string, onSideEffect: (sideEffect: SideEffect) => void) {
    const output = new Output(this.outputs);
    const expectedOutput = expected ? Output.fromText(expected) : undefined;

    return this.cases.map((testCase) =>
      testCase.map((instruction) => {
        if (instruction.type === 'set') chip.setInput(instruction.name.value, !!instruction.value);
        if (instruction.type === 'eval') chip.run();

        if (instruction.type === 'output') {
          const pins = chip.getPins();

          const row = this.outputs.map((o) => pins.get(o.name.value)?.state || false);
          const index = output.addRow(row);

          onSideEffect({ type: 'output', output: output.getText() });

          if (expectedOutput) {
            const expectedRow = expectedOutput.getRow(index);
            if (!expectedRow) {
              return { ...instruction, error: `Output missing in the expected output` };
            }
            if (row.length !== expectedRow.length) {
              return { ...instruction, error: `Number of columns doesn't match` };
            }
            if (!row.every((value, index) => value === expectedRow[index])) {
              return { ...instruction, error: `Values don't match` };
            }
            return { ...instruction, error: false };
          }
        }

        return instruction;
      }, undefined as undefined | true | string),
    );
  }

  /**
   * Builds TestScript from the abstract syntax tree
   */
  public static fromAST(root: Root) {
    const { preamble, cases } = root;
    const outputList = preamble.find((p) => p.type === 'outputList') as OutputListNode | undefined;

    return new TestScript(outputList?.outputs || [], cases);
  }
}

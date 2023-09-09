import type { OutputSpecNode } from '../../editor/tst/tree';

/**
 * Output from the test script
 */
export default class Output {
  /**
   * Values in the order of passed columns - OutputSpecNode[]
   */
  private readonly rows: boolean[][][] = [];

  constructor(private readonly columns: OutputSpecNode[]) {}

  public static fromText(text: string) {
    const lines = text.split('\n');
    if (lines.length === 0) {
      return new Output([]);
    }

    const columns = [...lines[0].matchAll(/\| *([a-zA-Z_][a-zA-Z0-9_.]*) */g)].map(
      (m) =>
        ({
          type: 'outputSpec',
          name: { type: 'identifier', value: m[1], line: 1, col: 1 },
        } as const),
    );

    const output = new Output(columns);

    for (const line of lines.slice(1)) {
      const row = [...line.matchAll(/\| *([01]+) */g)].map((m) =>
        m[1].split('').map((v) => v === '1'),
      );
      if (row.length) output.addRow(row);
    }

    return output;
  }

  public addRow(values: boolean[][]) {
    return this.rows.push(values) - 1;
  }

  public getRow(index: number) {
    return this.rows[index];
  }

  public getText() {
    const lines = [];

    const header = this.columns
      .map((c) => {
        const length = (c.padLeft || 1) + (c.length || 1) + (c.padRight || 1);
        const nameLength = c.name.value.length;
        const spaceLength = length - nameLength;
        const leftPad = Math.floor(spaceLength / 2);
        const rightPad = length - nameLength - leftPad;

        return spaceLength < 0
          ? c.name.value.slice(0, spaceLength)
          : `${' '.repeat(leftPad)}${c.name.value}${' '.repeat(rightPad)}`;
      })
      .join('|');
    lines.push(`|${header}|`);

    lines.push(
      ...this.rows.map(
        (row) =>
          '|' +
          this.columns
            .map(
              (c, i) =>
                `${' '.repeat(c.padLeft || 1)}${this.formatValue(
                  row[i],
                  this.columns[i],
                )}${' '.repeat(c.padRight || 1)}`,
            )
            .join('|') +
          '|',
      ),
    );

    return lines.join('\n');
  }

  // TODO: Implement other types of output
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private formatValue(value: boolean[], spec: OutputSpecNode) {
    console.log(value);

    return value.map((v) => (v ? '1' : '0')).join('');
  }
}

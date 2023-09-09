import type { ChipPin } from '../Chip';
import type Chip from '../Chip';

/**
 * NOT gate implemented natively
 */
class NotChip implements Chip {
  public readonly name = 'Not' as string;

  private in: boolean[];
  private out: boolean[];

  constructor(private width = 1) {
    this.in = new Array(width).fill(false);
    this.out = new Array(width).fill(false);
  }

  setInput(_: string, value: boolean[]) {
    this.in = value;
  }

  getOutput() {
    return this.out;
  }

  getPins(): Map<string, ChipPin> {
    // Constructs map on the fly
    // Pin inspection is less performance sensitive than actual execution

    return new Map([
      ['in', { type: 'input', width: this.width, state: this.in, connections: [] }],
      ['out', { type: 'output', width: this.width, state: this.out, connections: [] }],
    ]);
  }

  public run() {
    this.out = this.in.map((b) => !b);
  }
}

export default NotChip;

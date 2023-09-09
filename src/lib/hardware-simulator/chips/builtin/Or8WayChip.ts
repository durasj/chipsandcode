import type { ChipPin } from '../Chip';
import type Chip from '../Chip';

/**
 * Or8Way chip implemented natively
 */
class Or8WayChip implements Chip {
  public readonly name = 'Or8Way';

  private in: boolean[];
  private out: boolean[];

  constructor(private width = 8) {
    this.in = new Array(width).fill(false);
    this.out = [false];
  }

  setInput(name: 'in', value: boolean[]) {
    this[name] = value;
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
    this.out = [this.in.reduce((acc, p) => acc || p, false)];
  }
}

export default Or8WayChip;

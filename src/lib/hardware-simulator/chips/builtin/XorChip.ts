import type { ChipPin } from '../Chip';
import type Chip from '../Chip';

/**
 * XOR gate implemented natively
 */
class XorChip implements Chip {
  public readonly name = 'Xor' as string;

  private a: boolean[];
  private b: boolean[];
  private out: boolean[];

  constructor(private width = 1) {
    this.a = new Array(width).fill(false);
    this.b = new Array(width).fill(false);
    this.out = new Array(width).fill(false);
  }

  setInput(name: 'a' | 'b', value: boolean[]) {
    this[name] = value;
  }

  getOutput() {
    return this.out;
  }

  getPins(): Map<string, ChipPin> {
    // Constructs map on the fly
    // Pin inspection is less performance sensitive than actual execution

    return new Map([
      ['a', { type: 'input', width: this.width, state: this.a, connections: [] }],
      ['b', { type: 'input', width: this.width, state: this.b, connections: [] }],
      ['out', { type: 'output', width: this.width, state: this.out, connections: [] }],
    ]);
  }

  public run() {
    this.out = this.a.map((a, i) => (a && !this.b[i]) || (!a && this.b[i]));
  }
}

export default XorChip;

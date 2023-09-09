import type Chip from '../Chip';
import type { ChipPin } from '../Chip';

/**
 * DMux chip implemented natively
 */
class DMuxChip implements Chip {
  public readonly name = 'DMux' as string;

  private in: boolean[];
  private sel: boolean[];
  private a: boolean[];
  private b: boolean[];

  constructor(private width = 1) {
    this.in = new Array(width).fill(false);
    this.sel = [false];
    this.a = new Array(width).fill(false);
    this.b = new Array(width).fill(false);
  }

  setInput(name: 'in' | 'sel', value: boolean[]) {
    this[name] = value;
  }

  getOutput(name: 'a' | 'b') {
    return this[name];
  }

  getPins() {
    // Constructs map on the fly
    // Pin inspection is less performance sensitive than actual execution

    return new Map([
      ['in', { type: 'output', width: this.width, state: this.in, connections: [] }],
      ['sel', { type: 'input', width: 1, state: this.sel, connections: [] }],
      ['a', { type: 'input', width: this.width, state: this.a, connections: [] }],
      ['b', { type: 'input', width: this.width, state: this.b, connections: [] }],
    ]) satisfies Map<string, ChipPin>;
  }

  public run() {
    const selPin = this.sel[0] ? 'b' : 'a';
    for (const pin of ['a', 'b'] as const) {
      this[pin] = selPin === pin ? this.in : new Array(this.width).fill(false);
    }
  }
}

export default DMuxChip;

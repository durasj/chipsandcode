import type { ChipPin } from '../Chip';
import type Chip from '../Chip';

/**
 * Mux chip implemented natively
 */
class MuxChip implements Chip {
  public readonly name = 'Mux' as string;

  private a: boolean[];
  private b: boolean[];
  private sel: boolean[];
  private out: boolean[];

  constructor(private width = 1) {
    this.a = new Array(width).fill(false);
    this.b = new Array(width).fill(false);
    this.sel = [false];
    this.out = new Array(width).fill(false);
  }

  setInput(name: 'a' | 'b' | 'sel', value: boolean[]) {
    this[name] = value;
  }

  getOutput() {
    return this.out;
  }

  getPins() {
    // Constructs map on the fly
    // Pin inspection is less performance sensitive than actual execution

    return new Map([
      ['a', { type: 'input', width: this.width, state: this.a, connections: [] }],
      ['b', { type: 'input', width: this.width, state: this.b, connections: [] }],
      ['sel', { type: 'input', width: 1, state: this.sel, connections: [] }],
      ['out', { type: 'output', width: this.width, state: this.out, connections: [] }],
    ]) satisfies Map<string, ChipPin>;
  }

  public run() {
    const pin = this.sel[0] ? this.b : this.a;
    this.out = pin;
  }
}

export default MuxChip;

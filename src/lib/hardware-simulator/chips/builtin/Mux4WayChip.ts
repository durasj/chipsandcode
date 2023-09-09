import type { ChipPin } from '../Chip';
import type Chip from '../Chip';

/**
 * Mux4Way chip implemented natively
 */
class Mux4WayChip implements Chip {
  public readonly name = 'Mux4Way' as string;

  private a: boolean[];
  private b: boolean[];
  private c: boolean[];
  private d: boolean[];
  private sel: boolean[];
  private out: boolean[];

  constructor(private width = 1) {
    this.a = new Array(width).fill(false);
    this.b = new Array(width).fill(false);
    this.c = new Array(width).fill(false);
    this.d = new Array(width).fill(false);
    this.sel = [false, false];
    this.out = new Array(width).fill(false);
  }

  setInput(name: 'a' | 'b' | 'c' | 'd' | 'sel', value: boolean[]) {
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
      ['c', { type: 'input', width: this.width, state: this.c, connections: [] }],
      ['d', { type: 'input', width: this.width, state: this.d, connections: [] }],
      ['sel', { type: 'input', width: 2, state: this.sel, connections: [] }],
      ['out', { type: 'output', width: this.width, state: this.out, connections: [] }],
    ]) satisfies Map<string, ChipPin>;
  }

  public run() {
    const pin = this.selToPin();
    this.out = pin;
  }

  private selToPin() {
    const sel = this.sel.map((v) => (v ? '1' : '0')).join('');

    switch (sel) {
      case '00':
        return this.a;
      case '01':
        return this.b;
      case '10':
        return this.c;
      case '11':
        return this.d;
      default:
        return this.a;
    }
  }
}

export default Mux4WayChip;

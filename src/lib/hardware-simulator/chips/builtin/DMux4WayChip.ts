import type Chip from '../Chip';
import type { ChipPin } from '../Chip';

/**
 * DMux4Way chip implemented natively
 */
class DMux4WayChip implements Chip {
  public readonly name = 'DMux4Way' as string;

  private in: boolean[];
  private sel: boolean[];
  private a: boolean[];
  private b: boolean[];
  private c: boolean[];
  private d: boolean[];

  constructor(private width = 1) {
    this.in = new Array(width).fill(false);
    this.sel = [false, false];
    this.a = new Array(width).fill(false);
    this.b = new Array(width).fill(false);
    this.c = new Array(width).fill(false);
    this.d = new Array(width).fill(false);
  }

  setInput(name: 'in' | 'sel', value: boolean[]) {
    this[name] = value;
  }

  getOutput(name: 'a' | 'b' | 'c' | 'd') {
    return this[name];
  }

  getPins() {
    // Constructs map on the fly
    // Pin inspection is less performance sensitive than actual execution

    return new Map([
      ['in', { type: 'output', width: this.width, state: this.in, connections: [] }],
      ['sel', { type: 'input', width: 2, state: this.sel, connections: [] }],
      ['a', { type: 'input', width: this.width, state: this.a, connections: [] }],
      ['b', { type: 'input', width: this.width, state: this.b, connections: [] }],
      ['c', { type: 'input', width: this.width, state: this.c, connections: [] }],
      ['d', { type: 'input', width: this.width, state: this.d, connections: [] }],
    ]) satisfies Map<string, ChipPin>;
  }

  public run() {
    const selPin = this.selToPin();
    for (const pin of ['a', 'b', 'c', 'd'] as const) {
      this[pin] = selPin === pin ? this.in : new Array(this.width).fill(false);
    }
  }

  private selToPin() {
    const sel = this.sel.map((v) => (v ? '1' : '0')).join('');

    switch (sel) {
      case '00':
        return 'a';
      case '01':
        return 'b';
      case '10':
        return 'c';
      case '11':
        return 'd';
      default:
        return 'a';
    }
  }
}

export default DMux4WayChip;

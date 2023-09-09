import type { ChipPin } from '../Chip';
import type Chip from '../Chip';

/**
 * DMux8Way chip implemented natively
 */
class DMux8WayChip implements Chip {
  public readonly name = 'DMux8Way' as string;

  private in: boolean[];
  private sel: boolean[];
  private a: boolean[];
  private b: boolean[];
  private c: boolean[];
  private d: boolean[];
  private e: boolean[];
  private f: boolean[];
  private g: boolean[];
  private h: boolean[];

  constructor(private width = 1) {
    this.in = new Array(width).fill(false);
    this.sel = [false, false, false];
    this.a = new Array(width).fill(false);
    this.b = new Array(width).fill(false);
    this.c = new Array(width).fill(false);
    this.d = new Array(width).fill(false);
    this.e = new Array(width).fill(false);
    this.f = new Array(width).fill(false);
    this.g = new Array(width).fill(false);
    this.h = new Array(width).fill(false);
  }

  setInput(name: 'in' | 'sel', value: boolean[]) {
    this[name] = value;
  }

  getOutput(name: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h') {
    return this[name];
  }

  getPins() {
    // Constructs map on the fly
    // Pin inspection is less performance sensitive than actual execution

    return new Map([
      ['in', { type: 'output', width: this.width, state: this.in, connections: [] }],
      ['sel', { type: 'input', width: 3, state: this.sel, connections: [] }],
      ['a', { type: 'input', width: this.width, state: this.a, connections: [] }],
      ['b', { type: 'input', width: this.width, state: this.b, connections: [] }],
      ['c', { type: 'input', width: this.width, state: this.c, connections: [] }],
      ['d', { type: 'input', width: this.width, state: this.d, connections: [] }],
      ['e', { type: 'input', width: this.width, state: this.e, connections: [] }],
      ['f', { type: 'input', width: this.width, state: this.f, connections: [] }],
      ['g', { type: 'input', width: this.width, state: this.g, connections: [] }],
      ['h', { type: 'input', width: this.width, state: this.h, connections: [] }],
    ]) satisfies Map<string, ChipPin>;
  }

  public run() {
    const selPin = this.selToPin();
    for (const pin of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const) {
      this[pin] = selPin === pin ? this.in : new Array(this.width).fill(false);
    }
  }

  private selToPin() {
    const sel = this.sel.map((v) => (v ? '1' : '0')).join('');

    switch (sel) {
      case '000':
        return 'a';
      case '001':
        return 'b';
      case '010':
        return 'c';
      case '011':
        return 'd';
      case '100':
        return 'e';
      case '101':
        return 'f';
      case '110':
        return 'g';
      case '111':
        return 'h';
      default:
        return 'a';
    }
  }
}

export default DMux8WayChip;

import type { ChipPin } from '../Chip';
import type Chip from '../Chip';

/**
 * Mux8Way chip implemented natively
 */
class Mux8WayChip implements Chip {
  public readonly name = 'Mux8Way' as string;

  private a: boolean[];
  private b: boolean[];
  private c: boolean[];
  private d: boolean[];
  private e: boolean[];
  private f: boolean[];
  private g: boolean[];
  private h: boolean[];
  private sel: boolean[];
  private out: boolean[];

  constructor(private width = 1) {
    this.a = new Array(width).fill(false);
    this.b = new Array(width).fill(false);
    this.c = new Array(width).fill(false);
    this.d = new Array(width).fill(false);
    this.e = new Array(width).fill(false);
    this.f = new Array(width).fill(false);
    this.g = new Array(width).fill(false);
    this.h = new Array(width).fill(false);
    this.sel = [false, false, false];
    this.out = new Array(width).fill(false);
  }

  setInput(name: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'sel', value: boolean[]) {
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
      ['e', { type: 'input', width: this.width, state: this.a, connections: [] }],
      ['f', { type: 'input', width: this.width, state: this.b, connections: [] }],
      ['g', { type: 'input', width: this.width, state: this.c, connections: [] }],
      ['h', { type: 'input', width: this.width, state: this.d, connections: [] }],
      ['sel', { type: 'input', width: 3, state: this.sel, connections: [] }],
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
      case '000':
        return this.a;
      case '001':
        return this.b;
      case '010':
        return this.c;
      case '011':
        return this.d;
      case '100':
        return this.e;
      case '101':
        return this.f;
      case '110':
        return this.g;
      case '111':
        return this.h;
      default:
        return this.a;
    }
  }
}

export default Mux8WayChip;

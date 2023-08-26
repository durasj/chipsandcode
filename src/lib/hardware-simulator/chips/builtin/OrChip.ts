import type { ChipPin } from '../Chip';
import type Chip from '../Chip';
import IllegalStateError from '../IllegalStateError';

/**
 * OR gate implemented natively
 */
class OrChip implements Chip {
  public readonly name = 'Or';

  private a = false;
  private b = false;
  private out = false;

  setInput(name: 'a' | 'b', value: boolean) {
    if (name !== 'a' && name !== 'b')
      throw new IllegalStateError(`Input pin '${name}' does not exist on 'Or'. Input pins: a, b.`);

    this[name] = value;
  }

  getOutput(name: string) {
    if (name !== 'out')
      throw new IllegalStateError(`Output pin '${name}' does not exist on 'Or'. Output pins: out.`);
    return this.out;
  }

  getPins(): Map<string, ChipPin> {
    // Constructs map on the fly
    // Pin inspection is less performance sensitive than actual execution

    return new Map([
      ['a', { type: 'input', state: this.a, connections: [] }],
      ['b', { type: 'input', state: this.b, connections: [] }],
      ['out', { type: 'output', state: this.out, connections: [] }],
    ]);
  }

  public run() {
    this.out = this.a || this.b;
  }
}

export default OrChip;

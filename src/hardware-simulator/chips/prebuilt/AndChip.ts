import type { ChipPin } from '../Chip';
import type Chip from '../Chip';
import IllegalStateError from '../IllegalStateError';

/**
 * AND gate implemented natively
 */
class AndChip implements Chip {
  public readonly name = 'And';

  private a: boolean = false;
  private b: boolean = false;
  private out: boolean = false;

  setInput(name: 'a' | 'b', value: boolean) {
    if (name !== 'a' && name !== 'b')
      throw new IllegalStateError(`Input pin '${name}' does not exist.`);

    this[name] = value;
  }

  getOutput(name: string) {
    if (name !== 'out')
      throw new IllegalStateError(`Output pin '${name}' does not exist.`);
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
    this.out = this.a && this.b;
  }
}

export default AndChip;

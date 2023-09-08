import type { ChipPin } from '../Chip';
import type Chip from '../Chip';
import IllegalStateError from '../IllegalStateError';

/**
 * NOT gate implemented natively
 */
class NotChip implements Chip {
  public readonly name = 'Not';

  private in = false;
  private out = true;

  setInput(name: string, value: boolean) {
    if (name !== 'in')
      throw new IllegalStateError(`Input pin '${name}' does not exist on 'Not'. Input pins: in.`);

    this.in = value;
  }

  getOutput(name: string) {
    if (name !== 'out')
      throw new IllegalStateError(
        `Output pin '${name}' does not exist on 'Not'. Output pins: out.`,
      );
    return this.out;
  }

  getPins(): Map<string, ChipPin> {
    // Constructs map on the fly
    // Pin inspection is less performance sensitive than actual execution

    return new Map([
      ['in', { type: 'input', state: this.in, connections: [] }],
      ['out', { type: 'output', state: this.out, connections: [] }],
    ]);
  }

  public run() {
    this.out = !this.in;
  }
}

export default NotChip;

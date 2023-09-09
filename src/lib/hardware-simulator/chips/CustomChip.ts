import Denque from 'denque';
import type { ChipPin } from './Chip';
import type Chip from './Chip';
import IllegalStateError from './IllegalStateError';
import InvalidDesignError from './InvalidDesignError';

export type PartConnections = Array<[string, string] | [string, string, number | [number, number]]>;

/**
 * Custom hardware chip representation
 *
 * @todo Add support for clocked and builtin
 * @todo Add support for words
 */
class CustomChip implements Chip {
  /**
   * Name of the chip
   */
  public readonly name: string;

  /**
   * Pin representation - chip state is mutable
   */
  protected readonly pins: Map<string, ChipPin>;

  /**
   * Parts of this chip with mapping between their output pins and target input pins of other chips
   */
  protected readonly parts: Map<Chip, PartConnections>;

  constructor(name: string, pins: Map<string, ChipPin>, parts: Map<Chip, PartConnections>) {
    this.name = name;
    this.pins = pins;
    this.parts = parts;
  }

  /**
   * Get pin configuration and state
   */
  getPins() {
    return this.pins;
  }

  /**
   * Set input pin value
   */
  setInput(name: string, value: boolean[]) {
    const pin = this.pins.get(name);
    const isInput = pin?.type === 'input';
    if (!isInput) {
      const inputs = [...this.pins.entries()]
        .filter(([, p]) => p.type === 'input')
        .map(([name]) => name)
        .join(', ');
      throw new IllegalStateError(
        `Input pin '${name}' does not exist on '${this.name}'. Input pins: ${inputs}.`,
      );
    }
    pin.state = value;
  }

  /**
   * Get output pin value
   */
  getOutput(name: string) {
    const pin = this.pins.get(name);
    const isOutput = pin?.type === 'output';
    if (!isOutput) {
      const outputs = [...this.pins.entries()]
        .filter(([, p]) => p.type === 'output')
        .map(([name]) => name)
        .join(', ');
      throw new IllegalStateError(
        `Output pin '${name}' does not exist on '${this.name}'. Output pins: ${outputs}.`,
      );
    }
    return pin.state;
  }

  /**
   * Run the chip with the given input
   *
   * @returns Output from chip pins as map name: value
   */
  public run() {
    // Execute using breadth-first exploring
    const queue = new Denque<Chip>();

    const explore = (pin: ChipPin) => {
      for (const [chip, pinName, selection] of pin.connections) {
        // Set input state on internal part
        // const newState = chip.getPins().get(pinName)?.state.slice() || new Array(pin.width).fill(false);
        let newState: boolean[];
        if (typeof selection === 'number') {
          newState = [pin.state[selection]];
        } else if (Array.isArray(selection)) {
          newState = pin.state.slice(selection[0], selection[1]);
        } else {
          newState = pin.state;
        }
        console.log('Setting', { pinName, newState });

        chip.setInput(pinName, newState);

        // Plan to visit the connected chip next
        queue.push(chip);
      }
    };

    // Start from the input pins
    for (const [, pin] of this.pins) {
      if (pin.type === 'input') explore(pin);
    }

    // TODO: Find a better way to detect unstable output (loops)
    // ...probably once there is a support for CLOCKED
    let iterations = 0;
    const MAX_ITERATIONS = 9999;

    let next = queue.shift();
    while (next) {
      // 1. Run the chip logic
      next.run();

      // 2. Go over output pins from this chip
      for (const [source, target, selection] of this.parts.get(next)!) {
        // 2.1. Update connected pin
        const pin = this.pins.get(target);
        if (!pin)
          throw new InvalidDesignError(
            `Output pin '${source}' is connected to a non-existing pin '${target}'`,
          );

        const output = next.getOutput(source);
        let newState = pin.state.slice();
        if (typeof selection === 'number') {
          newState[selection] = output[0];
        } else if (Array.isArray(selection)) {
          for (let i = selection[0], j = 0; i <= selection[1]; i++, j++) {
            newState[i] = output[j];
          }
        } else {
          newState = output;
        }
        pin.state = newState;

        // 2.2. Explore target pin next
        explore(pin);
      }

      iterations++;
      if (iterations > MAX_ITERATIONS) {
        throw new InvalidDesignError(`Implementation contains a loop`);
      }

      next = queue.shift();
    }
  }
}

export default CustomChip;

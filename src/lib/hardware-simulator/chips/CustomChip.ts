import Denque from 'denque';
import type { ChipPin } from './Chip';
import type Chip from './Chip';
import IllegalStateError from './IllegalStateError';
import InvalidDesignError from './InvalidDesignError';

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
  protected readonly parts: Map<Chip, readonly [string, string][]>;

  constructor(
    name: string,
    pins: Map<string, ChipPin>,
    parts: Map<Chip, readonly [string, string][]>,
  ) {
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
  setInput(name: string, value: boolean) {
    const pin = this.pins.get(name);
    if (!pin) throw new IllegalStateError(`Input pin '${name}' does not exist.`);
    pin.state = value;
  }

  /**
   * Get output pin value
   */
  getOutput(name: string) {
    const pin = this.pins.get(name);
    if (!pin) throw new IllegalStateError(`Output pin '${name}' does not exist.`);
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
      for (const [chip, pinName] of pin.connections) {
        // Set chip internal pin state
        chip.setInput(pinName, pin.state);

        // Plan to visit the connected chip next
        queue.push(chip);
      }
    };

    // Start from the input pins
    for (const [, pin] of this.pins) {
      if (pin.type === 'input') explore(pin);
    }

    // TODO: Find a better way to detect unstable output (loops)
    // ...especially once there is a support for clocked
    let iterations = 0;
    const MAX_ITERATIONS = 9999;

    let next = queue.shift();
    while (next) {
      // 1. Run the chip logic
      next.run();

      // 2. Go over output pins from this chip
      for (const [source, target] of this.parts.get(next)!) {
        // 2.1. Update connected input pin
        const pin = this.pins.get(target);
        if (!pin)
          throw new InvalidDesignError(
            `Output pin '${source}' is connected to non-existing pin '${target}'`,
          );
        pin.state = next.getOutput(source);

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

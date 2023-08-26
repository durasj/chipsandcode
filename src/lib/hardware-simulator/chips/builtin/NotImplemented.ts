import type { ChipPin } from '../Chip';
import type Chip from '../Chip';

/**
 * Parent class for any chips that are not yet implemented natively
 */
abstract class NotImplemented implements Chip {
  public readonly name: string = 'NotImplemented';

  setInput(name: string, value: boolean) {
    throw new Error(`Cannot set ${value} on ${name} - Chip ${this.name} is not implemented yet.`);
  }

  getOutput(name: string) {
    throw new Error(
      `Cannot retrieve value from ${name} - Chip ${this.name} is not implemented yet.`,
    );

    return false;
  }

  getPins(): Map<string, ChipPin> {
    return new Map();
  }

  public run() {
    throw new Error(`Chip "${this.name}" is not implemented yet.`);
  }
}

export default NotImplemented;

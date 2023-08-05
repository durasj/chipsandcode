/**
 * Pin configuration, state, and connections
 */
export interface ChipPin {
  /**
   * Type of the pin - input, internal, or output
   */
  readonly type: 'input' | 'output' | 'internal';

  /**
   * Mutable current pin state
   */
  state: boolean;

  /**
   * List of connections from this pin as tuple Chip, pin name
   */
  readonly connections: Array<[Chip, string]>;
}

/**
 * Hardware chip representation
 */
interface Chip {
  /**
   * Human readable name of chip like Xor
   */
  readonly name: string;

  /**
   * Set input pin value
   */
  setInput(name: string, value: boolean): void;

  /**
   * Get output pin value
   */
  getOutput(name: string): boolean;

  /**
   * Get pin configuration and state
   *
   * Should be used only for inspection.
   * Use setInput to modify input pin value.
   * Use getOutput to retrieve output pin value.
   * Changing anything else leads to undefined behavior.
   */
  getPins(): Map<string, ChipPin>;

  /**
   * Execute chip logic updating output pins
   */
  run(): void;
}

export default Chip;

import MuxChip from './MuxChip';

/**
 * Mux16 chip implemented natively
 */
class Mux16Chip extends MuxChip {
  public readonly name = 'Mux16';

  constructor() {
    super(16);
  }
}

export default Mux16Chip;

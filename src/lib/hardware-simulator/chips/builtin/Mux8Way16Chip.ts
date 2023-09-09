import Mux8WayChip from './Mux8WayChip';

/**
 * Mux8Way16 chip implemented natively
 */
class Mux8Way16Chip extends Mux8WayChip {
  public readonly name = 'Mux8Way16';

  constructor() {
    super(16);
  }
}

export default Mux8Way16Chip;

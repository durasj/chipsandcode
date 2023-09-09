import Mux4WayChip from './Mux4WayChip';

/**
 * Mux4Way16 chip implemented natively
 */
class Mux4Way16Chip extends Mux4WayChip {
  public readonly name = 'Mux4Way16';

  constructor() {
    super(16);
  }
}

export default Mux4Way16Chip;

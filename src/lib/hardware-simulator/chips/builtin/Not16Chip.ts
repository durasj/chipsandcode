import NotChip from './NotChip';

/**
 * Not16 chip implemented natively
 */
class Not16Chip extends NotChip {
  public readonly name = 'Not16';

  constructor() {
    super(16);
  }
}

export default Not16Chip;

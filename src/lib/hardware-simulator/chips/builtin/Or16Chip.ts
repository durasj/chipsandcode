import OrChip from './OrChip';

/**
 * Or16 chip implemented natively
 */
class Or16Chip extends OrChip {
  public readonly name = 'Or16';

  constructor() {
    super(16);
  }
}

export default Or16Chip;

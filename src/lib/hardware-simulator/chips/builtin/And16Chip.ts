import AndChip from './AndChip';

/**
 * And16 gate implemented natively
 */
class And16Chip extends AndChip {
  public readonly name = 'And16';

  constructor() {
    super(16);
  }
}

export default And16Chip;

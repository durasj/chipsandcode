import type { ChipNode } from '../../editor/hdl/tree';
import type { ChipPin } from './Chip';
import type Chip from './Chip';
import CustomChip from './CustomChip';
import InvalidDesignError from './InvalidDesignError';
import NotImplemented from './builtin/NotImplemented';

interface Type<T> extends Chip {
  new (...args: unknown[]): T;
}

const BUILTIN = Object.fromEntries(
  Object.entries(import.meta.glob('./builtin/*Chip.ts', { eager: true })).map(([file, chip]) => [
    file.replace(/.*\/|Chip\.[^.]*$/g, ''),
    (chip as { default: Type<Chip> }).default,
  ]),
);

/**
 * Creates chips
 */
class ChipFactory {
  /**
   * Built in chips
   */
  public static readonly BUILTIN = BUILTIN;

  /**
   * Loaded custom chips
   */
  private readonly LOADED = {};

  /**
   * Builds chip from the abstract syntax tree
   */
  public fromAST(node: ChipNode) {
    const name = node.name.value;
    const pins = new Map<string, ChipPin>();
    const parts = new Map<Chip, [string, string][]>();

    // I/O must be processed first
    for (const conf of node.body) {
      if (conf.type !== 'input' && conf.type !== 'output') continue;

      for (const pin of conf.pins) {
        pins.set(pin.value, {
          type: conf.type,
          connections: [],
          state: false,
        });
      }
    }

    // Parts are processed next
    for (const conf of node.body) {
      if (conf.type !== 'parts') continue;

      for (const statement of conf.statements) {
        const chipName = statement.chip.value;
        const partChip = this.fromDefined(chipName);
        if (!partChip)
          throw new InvalidDesignError(
            `Unknown chip '${chipName}'. Available chips: ${this.getAvailableChips().join(', ')}.`,
          );
        const partConnections = [] as [string, string][];
        parts.set(partChip, partConnections);
        const partPins = partChip.getPins();

        for (const connection of statement.connections) {
          const left = connection.left.value;
          const right = connection.right.value;
          const pinType = partPins.get(left)?.type;

          if (!pins.has(right)) {
            pins.set(right, {
              type: 'internal',
              state: false,
              connections: [],
            });
          }

          if (pinType === 'output') {
            partConnections.push([left, right]);
          } else {
            const rightPin = pins.get(right)!;
            rightPin.connections.push([partChip, left]);
          }
        }
      }
    }

    return new CustomChip(name, pins, parts);
  }

  /**
   * Retrieves defined chip
   *
   * @param name Name of the wanted chip
   * @returns Chip or undefined if it was not found
   */
  public fromDefined(name: string) {
    const DefinedChip = ChipFactory.BUILTIN[name];
    if (!DefinedChip) return undefined;

    return new DefinedChip();
  }

  /**
   * Provides a list of name of available chips
   *
   * @returns List of names
   */
  public getAvailableChips() {
    return Object.entries(ChipFactory.BUILTIN)
      .filter(([, chip]) => !(new chip() instanceof NotImplemented))
      .map(([name]) => name);
  }
}

export default ChipFactory;

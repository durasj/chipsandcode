import type { ChipNode } from 'src/editor/hdl/tree.d';
import type { ChipPin } from './Chip';
import type Chip from './Chip';
import CustomChip from './CustomChip';
import InvalidDesignError from './InvalidDesignError';
import AndChip from './prebuilt/AndChip';
// import NandChip from './prebuilt/NandChip';
import NotChip from './prebuilt/NotChip';
import OrChip from './prebuilt/OrChip';
// import XorChip from './prebuilt/XorChip';

export type BUILTIN_GATES = keyof typeof ChipFactory.BUILTIN;

/**
 * Creates chips
 */
class ChipFactory {
  /**
   * Built in chips
   */
  public static readonly BUILTIN = {
    And: AndChip,
    // Nand: NandChip,
    Not: NotChip,
    Or: OrChip,
    // Xor: XorChip,
  };

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
        const partChip = this.fromDefined(statement.chip as BUILTIN_GATES);
        if (!partChip) throw new InvalidDesignError(`Unknown chip '${statement.chip}'`);
        const partConnections = [] as [string, string][];
        parts.set(partChip, partConnections);
        const partPins = partChip.getPins();

        for (const connection of statement.connections) {
          const left = connection.left.value;
          const right = connection.right.value;
          const pinType = partPins.get(left)?.type;

          if (pinType === 'output') {
            partConnections.push([left, right]);
          } else {
            if (!pins.has(right)) {
              pins.set(right, {
                type: 'internal',
                state: false,
                connections: [],
              });
            }

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
  public fromDefined(name: BUILTIN_GATES) {
    const DefinedChip = ChipFactory.BUILTIN[name];
    if (!DefinedChip) return undefined;

    return new DefinedChip();
  }
}

export default ChipFactory;

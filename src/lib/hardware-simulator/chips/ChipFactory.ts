import type { ChipBuiltinNode, ChipNode } from '../../editor/hdl/tree';
import type { ChipPin } from './Chip';
import type Chip from './Chip';
import CustomChip, { type PartConnections } from './CustomChip';
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

    const parts = new Map<Chip, PartConnections>();

    // Built-in statement short-circuits the preparation
    const isBuiltin = (statement: ChipNode['body'][0]): statement is ChipBuiltinNode =>
      statement.type === 'builtin';
    const builtIn = node.body.find(isBuiltin);
    if (builtIn) {
      const name = builtIn.template.value;
      const defined = this.fromDefined(name);
      if (!defined) throw new InvalidDesignError(`Unknown built-in chip "${name}".`);
      return defined;
    }

    // I/O must be processed first
    for (const conf of node.body) {
      if (conf.type !== 'input' && conf.type !== 'output') continue;

      for (const pin of conf.pins) {
        const width = 'width' in pin ? pin.width : 1;

        pins.set(pin.value, {
          type: conf.type,
          connections: [],
          width,
          state: new Array(width).fill(false),
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
            `Unknown chip "${chipName}". Available chips: ${this.getAvailableChips().join(', ')}.`,
          );
        const partConnections = [] as PartConnections;
        parts.set(partChip, partConnections);
        const partPins = partChip.getPins();

        for (const connection of statement.connections) {
          const left = connection.left;
          const leftName = left.value;
          const right = connection.right;
          const rightName = right.value;

          const pin = partPins.get(leftName);
          if (!pin) {
            const pinList = [...partPins.entries()];
            const availableInputs = pinList
              .filter(([, p]) => p.type === 'input')
              .map(([name]) => name)
              .join(', ');
            const availableOutputs = pinList
              .filter(([, p]) => p.type === 'output')
              .map(([name]) => name)
              .join(', ');

            throw new InvalidDesignError(
              `Pin "${leftName}" doesn't exist on "${chipName}". Inputs: ${availableInputs}. Outputs: ${availableOutputs}.`,
            );
          }
          const pinType = pin.type;

          if (!pins.has(rightName)) {
            const selection = 'selection' in right ? right.selection : undefined;
            const width = Array.isArray(selection)
              ? selection[1] - selection[0] + 1
              : typeof selection === 'number'
              ? 1
              : pin.width;

            pins.set(rightName, {
              type: 'internal',
              width,
              state: new Array(width).fill(false),
              connections: [],
            });
          }

          if (pinType === 'output') {
            partConnections.push(
              'selection' in right ? [leftName, rightName, right.selection] : [leftName, rightName],
            );
          } else {
            const rightPin = pins.get(rightName)!;
            rightPin.connections.push(
              'selection' in right ? [partChip, leftName, right.selection] : [partChip, leftName],
            );
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

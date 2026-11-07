/** First layer, adapted from the existing Boolean Logic project. */
export type MissionId = 'nand' | 'not' | 'and' | 'or' | 'xor' | 'mux' | 'dmux';
export type GateKind = 'Nand' | 'Not' | 'And' | 'Or' | 'Xor';
export type Signals = Record<string, boolean>;

export interface Mission {
  id: MissionId;
  chip: string;
  number: number;
  title: string;
  location: string;
  brief: string;
  goal: string;
  inputs: string[];
  outputs: string[];
  availableParts: GateKind[];
  hints: string[];
  explanation: string;
  reward: string;
  prerequisite: MissionId | null;
}

export const missions: Mission[] = [
  {
    id: 'nand',
    chip: 'Nand',
    number: 1,
    title: 'Read the signal',
    location: 'NAND primitive',
    brief:
      'Two inputs. One output. Probe the NAND primitive and identify the only combination that produces a low signal.',
    goal: 'Discover the output for all four switch combinations.',
    inputs: ['a', 'b'],
    outputs: ['out'],
    availableParts: ['Nand'],
    hints: [
      'Try each switch separately. What happens when both are on?',
      'NAND means NOT AND. Its output is off only when both inputs are on.',
    ],
    explanation:
      'A bit has two states: 0 (off) and 1 (on). A NAND gate outputs 1 for every input pair except 1,1. You start with this supplied primitive: it is the building block for everything in this layer.',
    reward: 'NAND characterized. One primitive is enough to build every gate in this layer.',
    prerequisite: null,
  },
  {
    id: 'not',
    chip: 'Not',
    number: 2,
    title: 'Invert a signal',
    location: 'Inversion',
    brief: 'Turn 0 into 1 and 1 into 0. Build an inverter using the NAND primitive.',
    goal: 'Build an output that is always the opposite of input in.',
    inputs: ['in'],
    outputs: ['out'],
    availableParts: ['Nand'],
    hints: [
      'A NAND has two input pins. They can both receive the same signal.',
      'Look at the NAND cases 0,0 and 1,1. Can those two cases give you an inverter?',
    ],
    explanation:
      'NOT reverses a bit: 0 becomes 1 and 1 becomes 0. A gate input can feed more than one pin. This is called fan-out. Connecting one signal to both NAND inputs gives the behavior you need.',
    reward: 'NOT verified. You can now invert any single-bit signal.',
    prerequisite: 'nand',
  },
  {
    id: 'and',
    chip: 'And',
    number: 3,
    title: 'Combine conditions',
    location: 'Conjunction',
    brief:
      'A high output requires both inputs to be high. Compose a gate that implements this condition.',
    goal: 'Output 1 only when a and b are both 1.',
    inputs: ['a', 'b'],
    outputs: ['out'],
    availableParts: ['Nand', 'Not'],
    hints: [
      'NAND already responds to both switches. What is different about its output?',
      'Try sending the NAND output through your inverter.',
    ],
    explanation:
      'AND outputs 1 only if both inputs are 1. NAND has exactly the opposite behavior, so inverting NAND produces AND. Internal connections let one chip feed another.',
    reward: 'AND verified. Two conditions now control one output.',
    prerequisite: 'not',
  },
  {
    id: 'or',
    chip: 'Or',
    number: 4,
    title: 'Merge two signals',
    location: 'Disjunction',
    brief:
      'Either input can drive the output high. Build the gate that stays low only when both inputs are low.',
    goal: 'Output 1 when a, b, or both are 1.',
    inputs: ['a', 'b'],
    outputs: ['out'],
    availableParts: ['Nand', 'Not', 'And'],
    hints: [
      'Start with the only case that must give 0: a=0 and b=0.',
      'What happens if you invert both inputs before feeding them into NAND?',
    ],
    explanation:
      'OR outputs 1 when at least one input is 1. De Morgan’s law says NOT(NOT(a) AND NOT(b)) equals a OR b. Different networks can implement the same truth table: all correct constructions are accepted.',
    reward: 'OR verified. Either input can now drive the output.',
    prerequisite: 'and',
  },
  {
    id: 'xor',
    chip: 'Xor',
    number: 5,
    title: 'Detect a difference',
    location: 'Exclusive OR',
    brief:
      'Compare two bits. Produce a high signal when they differ, and a low signal when they match.',
    goal: 'Output 1 when exactly one of a and b is 1.',
    inputs: ['a', 'b'],
    outputs: ['out'],
    availableParts: ['Nand', 'Not', 'And', 'Or'],
    hints: [
      'OR finds cases where at least one input is on, but also includes 1,1.',
      'Combine “at least one is on” with “not both are on”.',
    ],
    explanation:
      'XOR means exclusive OR. Its output is 1 for 0,1 and 1,0, but 0 for 0,0 and 1,1. One construction is (a OR b) AND NOT(a AND b). NAND-only solutions also work.',
    reward: 'XOR verified. Your circuit detects a difference between two bits.',
    prerequisite: 'or',
  },
  {
    id: 'mux',
    chip: 'Mux',
    number: 6,
    title: 'Select a data path',
    location: 'Multiplexing',
    brief:
      'Two data inputs share one output. Use a control bit to select which signal passes through.',
    goal: 'When sel=0, out=a. When sel=1, out=b.',
    inputs: ['a', 'b', 'sel'],
    outputs: ['out'],
    availableParts: ['Nand', 'Not', 'And', 'Or', 'Xor'],
    hints: [
      'Make two paths: one for channel a and one for channel b. Only one path should be enabled at a time.',
      'Enable a with NOT(sel), enable b with sel, then combine their outputs.',
    ],
    explanation:
      'A multiplexor selects one of its data inputs. The selector is a control bit, not a data channel. There are eight possible input combinations, and your circuit must handle all eight. It can be composed from the elementary gates you have already built.',
    reward: 'Mux verified. A control signal now selects the active data path.',
    prerequisite: 'xor',
  },
  {
    id: 'dmux',
    chip: 'DMux',
    number: 7,
    title: 'Route a signal',
    location: 'Demultiplexing',
    brief:
      'Route one input to one of two outputs. The selector chooses the destination; the other output stays low.',
    goal: 'Route in to a if sel=0, or to b if sel=1.',
    inputs: ['in', 'sel'],
    outputs: ['a', 'b'],
    availableParts: ['Nand', 'Not', 'And', 'Or', 'Xor'],
    hints: [
      'Unlike the last machine, this one has one data input and two outputs.',
      'Each output needs its own enable condition. What enables a? What enables b?',
    ],
    explanation:
      'A demultiplexor routes one input to a selected output. For a two-way DMux: a = in AND NOT(sel), and b = in AND sel. These are separate output pins. Both must be correct in every case.',
    reward: 'DMux verified. All seven logic challenges are complete.',
    prerequisite: 'mux',
  },
];

export function getMission(id: string): Mission {
  const mission = missions.find((item) => item.id === id);
  if (!mission) throw new Error(`Unknown mission: ${id}`);
  return mission;
}

export interface TruthCase {
  inputs: Signals;
  expected: Signals;
}

/** Exhaustive single-bit specifications, independent from the circuit under test. */
export function truthTable(mission: Mission): TruthCase[] {
  return Array.from({ length: 2 ** mission.inputs.length }, (_, index) => {
    const inputs = Object.fromEntries(
      mission.inputs.map((pin, offset) => [
        pin,
        Boolean(index & (1 << (mission.inputs.length - offset - 1))),
      ]),
    );
    const { a, b, in: input, sel } = inputs;
    let expected: Signals;
    switch (mission.id) {
      case 'nand':
        expected = { out: !(a && b) };
        break;
      case 'not':
        expected = { out: !input };
        break;
      case 'and':
        expected = { out: a && b };
        break;
      case 'or':
        expected = { out: a || b };
        break;
      case 'xor':
        expected = { out: a !== b };
        break;
      case 'mux':
        expected = { out: sel ? b : a };
        break;
      case 'dmux':
        expected = { a: input && !sel, b: input && sel };
        break;
    }
    return { inputs, expected };
  });
}

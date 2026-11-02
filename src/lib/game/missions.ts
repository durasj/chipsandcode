/** First campaign, adapted from the existing Boolean Logic project. */
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
    title: 'Find the first signal',
    location: 'Arrival dock',
    brief:
      'An old signal chip still works. Wake it up and discover the one input combination that switches its light off.',
    goal: 'Discover the output for all four switch combinations.',
    inputs: ['a', 'b'],
    outputs: ['out'],
    availableParts: ['Nand'],
    hints: [
      'Try each switch separately. What happens when both are on?',
      'NAND means NOT AND. Its output is off only when both inputs are on.',
    ],
    explanation:
      'A bit has two states: 0 (off) and 1 (on). A NAND gate outputs 1 for every input pair except 1,1. You start with this supplied primitive: it is the building block for everything in this campaign.',
    reward: 'NAND chip discovered',
    prerequisite: null,
  },
  {
    id: 'not',
    chip: 'Not',
    number: 2,
    title: 'Bring back the beacon',
    location: 'Beacon point',
    brief:
      'The beacon needs an inverter: when its input is off, the light must be on. When the input is on, the light must go off.',
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
    reward: 'Beacon restored · NOT chip earned',
    prerequisite: 'nand',
  },
  {
    id: 'and',
    chip: 'And',
    number: 3,
    title: 'Open the safety lock',
    location: 'Twin-lock bridge',
    brief:
      'The bridge may open only when both safety switches are on. A single switch must never open it.',
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
    reward: 'Bridge restored · AND chip earned',
    prerequisite: 'not',
  },
  {
    id: 'or',
    chip: 'Or',
    number: 4,
    title: 'Power the workshop',
    location: 'Workshop quay',
    brief:
      'Two generators feed the workshop. Either one should keep the lights on; the workshop goes dark only when both are off.',
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
    reward: 'Workshop restored · OR chip earned',
    prerequisite: 'and',
  },
  {
    id: 'xor',
    chip: 'Xor',
    number: 5,
    title: 'Tune the signal tower',
    location: 'Relay ridge',
    brief:
      'The relay needs a difference detector. It should transmit when the switches disagree, and stay quiet when they match.',
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
    reward: 'Relay restored · XOR chip earned',
    prerequisite: 'or',
  },
  {
    id: 'mux',
    chip: 'Mux',
    number: 6,
    title: 'Choose the broadcast',
    location: 'Switchboard station',
    brief:
      'Two signals are ready for broadcast. Build a switchboard that follows channel a when sel is off and channel b when sel is on.',
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
    reward: 'Switchboard restored · selector blueprint earned',
    prerequisite: 'xor',
  },
  {
    id: 'dmux',
    chip: 'DMux',
    number: 7,
    title: 'Reconnect the islands',
    location: 'Dispatch harbor',
    brief:
      'One incoming signal must reach one of two islands. Send it to output a when sel is off, or output b when sel is on. The other output stays off.',
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
    reward: 'Islands reconnected · Boolean Logic campaign complete',
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

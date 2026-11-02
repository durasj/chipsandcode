export type ComputerLayerId = 'logic' | 'arithmetic' | 'memory' | 'architecture' | 'software';

export interface ComputerLayer {
  id: ComputerLayerId;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  status: 'available' | 'planned';
}

/** The abstraction stack, ordered from its physical foundation upward. */
export const computerLayers: ComputerLayer[] = [
  {
    id: 'logic',
    number: '00',
    title: 'Signals & logic',
    subtitle: 'Bits become behavior.',
    description:
      'Start with two states. Build the gates that turn signals into decisions, then route those signals through your own circuits.',
    status: 'available',
  },
  {
    id: 'arithmetic',
    number: '01',
    title: 'Arithmetic',
    subtitle: 'Logic becomes calculation.',
    description:
      'Combine gates into adders, work with multi-bit values, and design the arithmetic logic unit at the heart of a computer.',
    status: 'planned',
  },
  {
    id: 'memory',
    number: '02',
    title: 'Memory',
    subtitle: 'Signals acquire a past.',
    description:
      'Introduce time. Store a bit, assemble registers, and build addressable memory that holds state between clock cycles.',
    status: 'planned',
  },
  {
    id: 'architecture',
    number: '03',
    title: 'Architecture',
    subtitle: 'Components become a computer.',
    description:
      'Connect computation, memory, and control. Trace an instruction through a CPU and see a program become electrical behavior.',
    status: 'planned',
  },
  {
    id: 'software',
    number: '04',
    title: 'Software',
    subtitle: 'Instructions become ideas.',
    description:
      'Rise through machine code, assembly, and language. Connect the code you write to the hardware that makes it run.',
    status: 'planned',
  },
];

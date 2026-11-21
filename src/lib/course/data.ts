export type ChapterId =
  'buses' | 'arithmetic' | 'memory' | 'machine-language' | 'architecture' | 'assembler';
export type TaskKind = 'hdl' | 'assembly' | 'encode' | 'symbols' | 'assembler';
export interface CourseTask {
  id: string;
  title: string;
  chip?: string;
  kind: TaskKind;
  goal: string;
  explanation: string;
  hint: string;
  inputs?: Record<string, number>;
  outputs?: Record<string, number>;
  starter: string;
}
export interface CourseChapter {
  id: ChapterId;
  project: number;
  title: string;
  description: string;
  reference: `/learn/reference/${string}`;
  tasks: CourseTask[];
}
const pins = (values: Record<string, number>) =>
  Object.entries(values)
    .map(([name, width]) => name + (width === 1 ? '' : `[${width}]`))
    .join(', ');
function chip(
  name: string,
  title: string,
  inputs: Record<string, number>,
  outputs: Record<string, number>,
  goal: string,
  explanation: string,
  hint: string,
): CourseTask {
  return {
    id: name.toLowerCase(),
    chip: name,
    title,
    kind: 'hdl',
    inputs,
    outputs,
    goal,
    explanation,
    hint,
    starter: `CHIP ${name} {\n${Object.keys(inputs).length ? `    IN ${pins(inputs)};\n` : ''}${Object.keys(outputs).length ? `    OUT ${pins(outputs)};\n` : ''}\n    PARTS:\n    // Connect the parts here.\n}\n`,
  };
}
const word = { in: 16 },
  out = { out: 16 };
const words = (count: number) =>
  Object.fromEntries(Array.from({ length: count }, (_, i) => [String.fromCharCode(97 + i), 16]));
const outputs = (count: number) =>
  Object.fromEntries(Array.from({ length: count }, (_, i) => [String.fromCharCode(97 + i), 1]));
export const courseChapters: CourseChapter[] = [
  {
    id: 'buses',
    project: 1,
    title: 'Work with words',
    description: 'The same logic, sixteen bits at a time.',
    reference: '/learn/reference/boolean-logic/project#buses',
    tasks: [
      chip(
        'Not16',
        'Invert a word',
        word,
        out,
        'Invert every bit of a 16-bit input.',
        'A bus is a group of wires. Bit 0 is the least significant bit; in[0] connects one wire, and in[0..7] connects eight.',
        'Repeat the single-bit operation for each position. Outputs can be wired to slices such as out[0].',
      ),
      chip(
        'And16',
        'Combine two words',
        words(2),
        out,
        'AND matching bit positions in a and b.',
        'Bitwise logic treats every position independently. There is no carry between columns.',
        'Connect a[i] and b[i] to the single-bit gate for each i.',
      ),
      chip(
        'Or16',
        'Merge two words',
        words(2),
        out,
        'OR matching bit positions in a and b.',
        'A bit is set when either input word has that bit set.',
        'The structure is parallel, like And16, but uses a different operation.',
      ),
      chip(
        'Mux16',
        'Choose a whole word',
        { ...words(2), sel: 1 },
        out,
        'Route a when sel=0, and b when sel=1.',
        'A shared selector controls sixteen independent data choices. The selector does not change the data.',
        'Use one Mux per bit and connect the same sel to every part.',
      ),
      chip(
        'Or8Way',
        'Reduce eight bits',
        { in: 8 },
        { out: 1 },
        'Output 1 if any of the eight inputs is 1.',
        'Reduction combines many bits into one answer. It differs from bitwise OR, which preserves the word width.',
        'Build a tree of two-input Or gates.',
      ),
      chip(
        'Mux4Way16',
        'Choose among four',
        { ...words(4), sel: 2 },
        out,
        'Selectors 00, 01, 10, 11 route a, b, c, d.',
        'Two selector bits encode four choices. sel[0] is the low-order selector bit.',
        'First choose within each pair; then choose between the two pair outputs.',
      ),
      chip(
        'Mux8Way16',
        'Choose among eight',
        { ...words(8), sel: 3 },
        out,
        'Route the selected one of eight words.',
        'Hierarchy keeps a large circuit understandable: larger selectors reuse smaller selectors.',
        'Use two four-way selectors and a final two-way selector.',
      ),
      chip(
        'DMux4Way',
        'Route to one of four',
        { in: 1, sel: 2 },
        outputs(4),
        'Send in to the selected output; all others must be 0.',
        'A demultiplexor distributes a value. When in is 0, all outputs remain 0.',
        'Split the input into halves, then split each half again.',
      ),
      chip(
        'DMux8Way',
        'Route to one of eight',
        { in: 1, sel: 3 },
        outputs(8),
        'Send in to the selected output a–h, leaving the rest at 0.',
        'Three decisions select one of eight paths. The same hierarchy will later address memory.',
        'Combine two four-way routing networks behind an initial split.',
      ),
    ],
  },
  {
    id: 'arithmetic',
    project: 2,
    title: 'Make logic calculate',
    description: 'From a single carry to a programmable ALU.',
    reference: '/learn/reference/boolean-arithmetic',
    tasks: [
      chip(
        'HalfAdder',
        'Add two bits',
        { a: 1, b: 1 },
        { sum: 1, carry: 1 },
        'Add a and b. Return the low bit as sum and the high bit as carry.',
        'Two ones add to binary 10. Arithmetic needs two outputs because one bit cannot hold the result.',
        'Compare the sum column with XOR, and the carry column with AND.',
      ),
      chip(
        'FullAdder',
        'Carry a result forward',
        { a: 1, b: 1, c: 1 },
        { sum: 1, carry: 1 },
        'Add a, b, and incoming carry c.',
        'A column in a multi-bit addition may receive a carry from the previous column.',
        'Combine two half adders, then combine their carry signals.',
      ),
      chip(
        'Add16',
        'Add two words',
        words(2),
        out,
        'Output (a+b) modulo 65536.',
        'Carry travels from bit 0 toward bit 15. Overflow beyond the word is discarded. The same circuit adds signed two’s-complement values.',
        'Chain full adders. The first carry-in is false.',
      ),
      chip(
        'Inc16',
        'Advance by one',
        word,
        out,
        'Output (in+1) modulo 65536.',
        'An incrementer is useful for addresses, counters, and the next instruction.',
        'Use an adder with the other input set to the constant one; constants can connect to slices.',
      ),
      chip(
        'ALU',
        'Control a calculation',
        { x: 16, y: 16, zx: 1, nx: 1, zy: 1, ny: 1, f: 1, no: 1 },
        { out: 16, zr: 1, ng: 1 },
        'Apply zx/nx to x, zy/ny to y; choose AND (f=0) or addition (f=1); optionally negate the output. Set zr when out=0, ng from bit 15.',
        'Six control bits select a useful family of functions. The status flags describe the final output, after no is applied.',
        'Build the data path in stages. Use muxes for zeroing and conditional inversion; reduce all output bits for zr.',
      ),
    ],
  },
  {
    id: 'memory',
    project: 3,
    title: 'Let a value stay',
    description: 'Introduce time, state, and addressable memory.',
    reference: '/learn/reference/memory',
    tasks: [
      chip(
        'Bit',
        'Remember one bit',
        { in: 1, load: 1 },
        { out: 1 },
        'At the next clock edge, store in if load=1. Otherwise retain the previous value.',
        'The supplied DFF captures its input on tick and publishes that state on tock. Feedback through a DFF is state, not a combinational loop.',
        'Choose between the new input and the previous output before the DFF.',
      ),
      chip(
        'Register',
        'Remember a word',
        { in: 16, load: 1 },
        out,
        'Store all sixteen input bits together when load=1.',
        'A register is sixteen one-bit memories sharing a load signal and the clock.',
        'Connect one Bit per position with the same load.',
      ),
      ...(['RAM8', 'RAM64', 'RAM512', 'RAM4K', 'RAM16K'] as const).map((name, index) =>
        chip(
          name,
          `Address ${[8, 64, 512, 4096, 16384][index].toLocaleString('en-US')} words`,
          { in: 16, load: 1, address: [3, 6, 9, 12, 14][index] },
          out,
          'Read the addressed word immediately. On a clock edge, write only that word when load=1.',
          'The address has two jobs: select the word being read and direct the load signal to exactly one storage location.',
          'Partition the address into a bank selector and an address within the bank. Route load down; select data back up.',
        ),
      ),
      chip(
        'PC',
        'Choose the next instruction',
        { in: 16, load: 1, inc: 1, reset: 1 },
        out,
        'On the next clock edge: reset wins, then load, then increment, otherwise hold.',
        'The program counter combines state with a small arithmetic path. Its priority rules matter when controls overlap.',
        'Work from lowest to highest priority using a cascade of muxes before the register.',
      ),
    ],
  },
  {
    id: 'machine-language',
    project: 4,
    title: 'Tell the machine what to do',
    description: 'Registers, addresses, jumps, and memory-mapped input/output.',
    reference: '/learn/reference/machine-language',
    tasks: [
      {
        id: 'instruction',
        title: 'Read an instruction',
        kind: 'encode',
        goal: 'Encode @21 and D=A as two 16-bit machine instructions, one per line.',
        explanation:
          'An A-instruction loads a 15-bit value into A. A C-instruction computes a value, chooses destinations, and may jump. The CPU receives bits, not the assembly spelling.',
        hint: 'A-instructions start with 0. C-instructions use 111, then seven comp bits, three dest bits, and three jump bits. Use the full explanation for the encoding table.',
        starter: '// Enter two binary words, one per line.\n',
      },
      {
        id: 'mult',
        title: 'Multiply with the instructions you have',
        kind: 'assembly',
        goal: 'Multiply nonnegative RAM[0] and RAM[1], placing the result in RAM[2]. Tests use products that fit in 15 bits.',
        explanation:
          'Hack has addition but no multiply instruction. Repeated work and a conditional jump can implement multiplication. End in a stable loop so the result remains available.',
        hint: 'Think of one input as a counter and accumulate the other. Handle a zero counter before the first addition.',
        starter: '// R0 × R1 → R2\n// Write your assembly here.\n',
      },
      {
        id: 'fill',
        title: 'Connect a key to the screen',
        kind: 'assembly',
        goal: 'While a key is pressed, make every screen word -1. When released, make every screen word 0. Keep checking the keyboard forever.',
        explanation:
          'SCREEN begins at address 16384 and contains 8192 words. Each word controls sixteen pixels. KBD at 24576 reports the pressed key, or zero.',
        hint: 'Keep a screen pointer, choose the fill value from KBD, and visit every screen address. Repeat so a later key change is observed.',
        starter: '// Read KBD. Fill the screen. Repeat.\n',
      },
    ],
  },
  {
    id: 'architecture',
    project: 5,
    title: 'Build the whole computer',
    description: 'Bring calculation, storage, and instructions together.',
    reference: '/learn/reference/computer-architecture',
    tasks: [
      chip(
        'Memory',
        'Map the address space',
        { in: 16, load: 1, address: 15 },
        out,
        'Map 0–16383 to RAM16K, 16384–24575 to Screen, and 24576 to Keyboard. Writes affect RAM or screen only.',
        'Devices can share an address space. The CPU reads the keyboard as a memory location and writes pixels through the screen region.',
        'Decode the high address bits and route load separately from the read-output selection.',
      ),
      chip(
        'CPU',
        'Execute one instruction',
        { inM: 16, instruction: 16, reset: 1 },
        { outM: 16, writeM: 1, addressM: 15, pc: 15 },
        'Implement the Hack instruction set with A/D registers, the ALU, and a program counter. Reset sends pc to 0 at the next edge.',
        'A C-instruction may store its result and jump on the same clock edge. Memory writes and jump targets use the old A value, even when A is also a destination.',
        'Separate instruction decoding, the ALU data path, destination loads, and jump logic. Reuse ARegister, DRegister, ALU, and PC.',
      ),
      chip(
        'Computer',
        'Run a program on your computer',
        { reset: 1 },
        {},
        'Connect ROM32K, CPU, and Memory so the assembled program can execute.',
        'The program counter addresses instruction ROM. The A register addresses data memory. The CPU connects both paths into a complete machine.',
        'Wire the CPU memory interface to Memory and use pc to read the instruction ROM. This chip has no output pins; verification inspects its memory.',
      ),
    ],
  },
  {
    id: 'assembler',
    project: 6,
    title: 'Turn names into instructions',
    description: 'Build the translator between assembly and your computer.',
    reference: '/learn/reference/assembler',
    tasks: [
      {
        id: 'encode',
        title: 'Encode a computation',
        kind: 'encode',
        goal: 'Translate @7, D=A, @3, D=D+A, @0, M=D into six machine words, one per line.',
        explanation:
          'Assembly is a readable representation of machine instructions. A translator uses fixed comp, dest, and jump encodings; it does not execute the computation.',
        hint: 'Keep source order. The a bit in comp chooses A or M; destination bits are A, D, M.',
        starter: '// Six 16-bit binary words.\n',
      },
      {
        id: 'symbols',
        title: 'Give names an address',
        kind: 'symbols',
        goal: 'For the shown program, enter the addresses of LOOP, value, and END as JSON.',
        explanation:
          'The first pass records labels using instruction addresses, ignoring comments and label declarations. The second pass allocates new variables starting at RAM[16]. Labels and variables share a symbol table.',
        hint: 'Labels do not consume ROM words. LOOP names the first instruction. value is the first new variable. Count the real instructions before END.',
        starter: '{\n  "LOOP": 0,\n  "value": 0,\n  "END": 0\n}',
      },
      {
        id: 'assembler',
        title: 'Build your assembler',
        kind: 'assembler',
        goal: 'Write assemble(source), returning newline-separated 16-bit binary words. Support all Hack instructions, labels, variables, predefined symbols, whitespace, and comments.',
        explanation:
          'Your JavaScript runs in an isolated frame with no network or site storage access. Verification compares your output with independent reference translations. Build the two passes separately, then test them together.',
        hint: 'Pass 1 records label addresses. Pass 2 resolves @ operands and encodes C-instructions using the reference tables. Repeated variables must keep the same address.',
        starter:
          'function assemble(source) {\n  // 1. Remove comments and empty lines.\n  // 2. Record labels and their instruction addresses.\n  // 3. Resolve symbols and encode each instruction.\n  // Return a string containing one 16-bit word per line.\n  return "";\n}\n',
      },
    ],
  },
];
export const symbolProgram = '(LOOP)\n@value\nM=1\n@END\n0;JMP\n(END)\n@LOOP\n0;JMP';
export const chapterById = (id: string) => courseChapters.find((chapter) => chapter.id === id);
export const courseProgressKey = 'chipsandcode.part-one.progress.v1';
export const taskKey = (chapter: CourseChapter, task: CourseTask) => `${chapter.id}/${task.id}`;
export function permittedParts(task: CourseTask): string[] {
  const available = ['Nand', 'Not', 'And', 'Or', 'Xor', 'Mux', 'DMux'];
  for (const chapter of courseChapters) {
    for (const item of chapter.tasks) {
      if (item.id === task.id && item.chip === task.chip) {
        if (chapter.id === 'memory' || chapter.id === 'architecture') available.push('DFF');
        if (chapter.id === 'architecture')
          available.push('Screen', 'Keyboard', 'ROM32K', 'ARegister', 'DRegister');
        return [...new Set(available)].filter((name) => name !== task.chip);
      }
      if (item.chip) available.push(item.chip);
    }
  }
  return available;
}

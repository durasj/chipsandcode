import { assemble, createMachine, type HackMachine, type StepTrace } from '#lib/computer/hack.js';

/** Supplied example; never installed as the learner's answer or awarded completion. */
export const journeyFillExample = `// Supplied demonstration: the CPU repeatedly reads KBD and writes SCREEN.
(LOOP)
@KBD
D=M
@WHITE
D;JEQ
@color
M=-1
@START
0;JMP
(WHITE)
@color
M=0
(START)
@SCREEN
D=A
@pointer
M=D
(PAINT)
@color
D=M
@pointer
A=M
M=D
@pointer
M=M+1
D=M
@KBD
D=D-A
@PAINT
D;JLT
@LOOP
0;JMP`;
export function loadJourneyProgram(source = journeyFillExample) {
  const assembly = assemble(source);
  return { assembly, machine: createMachine(assembly.words) };
}
export interface RunEvidence {
  read: StepTrace | null;
  write: StepTrace | null;
  executed: number;
}
/** Bounded work for one deliberate interaction; keyboard never writes screen memory directly. */
export function runJourneyProgram(machine: HackMachine, key: number, budget = 250000): RunEvidence {
  machine.setKeyboard(key);
  let read: StepTrace | null = null,
    write: StepTrace | null = null,
    executed = 0;
  for (; executed < budget && !machine.halted; executed++) {
    const trace = machine.step();
    if (!trace) break;
    if (trace.addressM === 24576 && (trace.instruction & 0x9000) === 0x9000) read = trace;
    if (trace.writeM && trace.addressM >= 16384 && trace.addressM < 24576) write = trace;
  }
  return { read, write, executed };
}

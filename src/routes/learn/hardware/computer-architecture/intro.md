---
title: Put the computer together
updated: 2026-11-03
---

The computer joins three capabilities: an ALU transforms values, memory keeps them, and instructions choose what happens next. You have already met each interface. This layer connects them into a machine that runs a program.

[Build the computer layer](/learn/path/architecture), use the [chip builder](/tools/chip-builder), or trace instructions in the [computer tool](/tools/computer).

# A stored program

A stored-program machine keeps instructions in memory instead of fixing one sequence permanently into its wiring. Loading a different instruction sequence gives the same hardware a different job.

Hack is deliberately small: 16-bit instructions and data words, a 15-bit instruction address, two main CPU registers, and a memory-mapped screen and keyboard. Its instruction memory and data memory are separate. This arrangement is often called Harvard-style; a classic unified-memory von Neumann machine shares an address space for instructions and data. Both illustrate the stored-program idea.

Do not equate our step-by-step view with a modern processor's implementation. Real processors may overlap instructions, predict branches, cache memory, and have many more registers. Here the simpler machine makes the boundary between the instruction contract and its circuitry visible.

# Three construction contracts

| Chip | Inputs | Outputs | Responsibility |
| --- | --- | --- | --- |
| Memory | `in[16]`, `load`, `address[15]` | `out[16]` | Decode the data address and route reads and writes |
| CPU | `inM[16]`, `instruction[16]`, `reset` | `outM[16]`, `writeM`, `addressM[15]`, `pc[15]` | Execute one instruction's data and control decisions |
| Computer | `reset` | No external data output pins | Connect CPU, instruction ROM, and Memory |

Computer's observable behavior appears in its state and devices rather than an `out` pin. Loading a program into its instruction ROM and inspecting the screen or RAM are simulator facilities.

# The memory map

Memory exposes one interface over several different devices:

| Address range | Device | Read | Write |
| --- | --- | --- | --- |
| 0–16383 | RAM16K | Selected 16-bit RAM word | Store on a clock update when load is 1 |
| 16384–24575 | Screen | Selected screen word | Store on a clock update when load is 1 |
| 24576 | Keyboard | Current key code, or zero | No program write |
| 24577–32767 | Unmapped | Outside the specified valid map | Outside the specified valid map |

Decode the address before routing `load`. The keyboard must never be treated as writable RAM. Reading selects the appropriate device output using the same map. The Screen needs a 13-bit offset; RAM16K needs a 14-bit offset. Check the boundaries 16383/16384 and 24575/24576 carefully.

The project supplies Screen and Keyboard as primitives. You are responsible for their integration, not for modeling a display panel or the electronics of a keyboard. Unmapped addresses are not extra usable RAM; avoid depending on a simulator's incidental result there.

# The CPU data path

The **D register** supplies one ALU operand. The other operand is selected between the **A register** and `inM`, according to the instruction's `a` bit. The ALU's six control bits come from the C-instruction's computation field.

The A register has two sources. An A-instruction loads the literal encoded in the instruction. A C-instruction whose destination includes A loads the ALU result. D loads only when a C-instruction's destination includes D. Both registers otherwise hold their values.

`addressM` is the low 15 bits of the current A register. `outM` carries the combinational ALU result. `writeM` is true only for a C-instruction whose destination includes M. An arbitrary `outM` value when `writeM=0` does not cause a memory write.

Control bits must be gated by instruction type. Bits in an A-instruction are a literal, not destination or jump fields. Accidentally decoding them as C-instruction controls can make loading an address overwrite D, RAM, or the PC.

# The CPU control path

The PC chooses the next ROM instruction. In ordinary execution it increments. For a taken C-instruction jump it loads A's address. With `reset=1`, it restarts at zero at the next clock update.

The jump condition is derived from the final ALU result. Zero means `zr=1`; negative means `ng=1`; positive means both are 0. Combine those conditions with the three jump bits. An A-instruction never jumps, even when its low three literal bits resemble a jump code.

The PC's reset input takes priority over loading a jump target. CPU reset restarts instruction selection; it is not a command to clear RAM, erase the screen, or reset all CPU registers. A tool's separate “reset machine” or “clear memory” control may offer a broader fresh-start operation, but that is not the hardware reset pin's contract.

# One cycle, one shared old state

Think of an instruction as two stages: calculate from the old state, then commit the next state together. All writes in that instruction use the same pre-update registers.

If A is 40 and D is 7, `AM=D` stores 7 into A and into RAM[40]. It does not write RAM[7]. If an instruction both writes A and jumps, the jump target is the old A address. The newly written A is visible to the next instruction.

This rule also explains why combinational outputs can be inspected before the clock moves while stored register values change only at the update. Mixing these stages creates bugs that may survive simple programs but fail instructions with multiple destinations.

# Connect the complete machine

ROM32K accepts the CPU's `pc` output and supplies `instruction`. Data Memory accepts `addressM`, `outM`, and `writeM`, and returns the selected word as `inM`. The CPU's reset input is Computer's reset input. A common clock coordinates state updates.

Instruction ROM holds up to 32768 words and is loaded externally. It is separate from the writable data memory; writing data address 0 does not replace instruction 0. The CPU repeatedly reads the current instruction, computes its effects, and selects the next instruction address. Fetch, decode, and execute are useful explanatory phases, not additional user controls the program must call.

# Build and verify

Construct and test Memory independently. Then test CPU with supplied instruction words and `inM` values so that errors in the memory wiring cannot hide CPU errors. Finally connect Computer and run complete programs.

The official project provides CPU tests both with internal-register inspection and with externally observable outputs. A design need not expose every internal wire to satisfy the external CPU contract. For whole-computer tests, the supplied Add, Max, and Rect programs check arithmetic/storage, branching, and screen output respectively.

Use several kinds of evidence: a correct final RAM value, correct PC changes, writes at the correct addresses, and preserved state where no write should happen. Test an A-instruction with low bits that would be dangerous if misdecoded. Test both taken and untaken jumps, the zero condition, negative ALU results, simultaneous destinations, and reset while a jump is requested.

If a known-good program fails only on your constructed computer, trace the earliest incorrect hardware signal. An emulator with built-in CPU behavior is a useful reference, but running a program there does not by itself validate your HDL CPU.

# Sources and next layer

This chapter adapts [Nand2Tetris Project 5](https://www.nand2tetris.org/project05) and the public [Computer Architecture chapter](https://www.nand2tetris.org/_files/ugd/44046b_552ed0898d5d491aabafd8a768a87c6f.pdf), by Noam Nisan and Shimon Schocken. The [official project files](https://github.com/nand2tetris/projects/tree/main/05) provide Memory, CPU, and Computer contracts and tests. Adapted explanatory content retains CC BY-NC-SA 3.0; software fixtures retain their own license.

The hardware now has an instruction language. [Build the assembler](/learn/reference/assembler) that translates its symbolic spelling into the machine words it consumes.

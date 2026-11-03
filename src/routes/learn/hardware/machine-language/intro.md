---
title: Tell the machine what to do
updated: 2026-11-03
---

The same hardware can perform different jobs because instructions are data too: bit patterns stored in instruction memory. This layer introduces the Hack instruction set and uses it to control arithmetic, memory, the screen, and the keyboard.

[Write machine-language programs](/learn/path/machine-language) or open the [computer and assembler](/tools/computer).

# The programmer's view

Hack works with 16-bit words. Its instruction memory and data memory have separate address spaces. Instruction address 20 and data address 20 name different locations.

| Name | Meaning |
| --- | --- |
| A | A 16-bit register holding a value or an address |
| D | A 16-bit register used for data and calculations |
| M | The data-memory word at the address in A; not a third CPU register |
| PC | The address of the instruction to execute next |

Only the low 15 bits of A address memory. The A register's full 16-bit value can also participate in arithmetic. The program counter normally advances by one after an instruction, or changes to A's address when a jump is taken.

Data memory contains ordinary RAM and memory-mapped devices. Instruction memory contains the program's machine words. Loading a new program into the tool is an external operation; it is not a Hack instruction.

# The Hack instruction set

There are two instruction forms. An **A-instruction** sets A to a nonnegative 15-bit value. A **C-instruction** tells the ALU what to compute, where to store the result, and whether to jump.

In assembly, `@12` means A = 12. Its machine word is a leading 0 followed by the 15-bit binary representation of 12. A literal following `@` must be in 0–32767. There is no `@-1`; a negative value is formed with a computation.

A C-instruction has the shape `dest=comp;jump`. The destination and its `=` can be omitted. The jump and its `;` can be omitted. The computation is required.

| Assembly | Effect |
| --- | --- |
| `D=A` | Copy A's value into D |
| `D=M` | Read the memory word addressed by A into D |
| `M=D` | Store D in the memory word addressed by A |
| `D=D+1` | Increment D with 16-bit wraparound |
| `D;JGT` | Jump to A's address if D is strictly positive |
| `0;JMP` | Jump to A's address unconditionally |

The distinction between `D=A` and `D=M` is central: the first uses the address itself as data; the second follows the address to memory.

These small operations express several addressing ideas. An immediate value is written directly in the instruction, as in `@12`. Direct access uses a known address before reading or writing M. Indirect access first obtains an address from stored data, puts that address into A, and then accesses M. An array element is the same idea with an address calculated from a base plus an index. Hack does not need a separate array instruction to support this pattern.

# Computation codes

A C-instruction is encoded as `111accccccdddjjj`. The seven `acccccc` bits select the computation. The `a` bit selects A or M as the ALU's second input; the other six bits control the ALU pipeline from the arithmetic layer.

| comp | acccccc | comp using M | acccccc |
| --- | --- | --- | --- |
| `0` | `0101010` | — | — |
| `1` | `0111111` | — | — |
| `-1` | `0111010` | — | — |
| `D` | `0001100` | — | — |
| `A` | `0110000` | `M` | `1110000` |
| `!D` | `0001101` | — | — |
| `!A` | `0110001` | `!M` | `1110001` |
| `-D` | `0001111` | — | — |
| `-A` | `0110011` | `-M` | `1110011` |
| `D+1` | `0011111` | — | — |
| `A+1` | `0110111` | `M+1` | `1110111` |
| `D-1` | `0001110` | — | — |
| `A-1` | `0110010` | `M-1` | `1110010` |
| `D+A` | `0000010` | `D+M` | `1000010` |
| `D-A` | `0010011` | `D-M` | `1010011` |
| `A-D` | `0000111` | `M-D` | `1000111` |
| `D&A` | `0000000` | `D&M` | `1000000` |
| `D\|A` | `0010101` | `D\|M` | `1010101` |

Use the specified spellings. An assembler maps instructions, not general algebra: `D+M` is an instruction computation, while an expression such as `D+7` is not. Put a constant into A first, or use a sequence of instructions.

# Destinations and jumps

The destination field contains one bit each for A, D, and M, in that order. `000` stores nowhere; `001` stores in M; `010` stores in D; `100` stores in A. Set multiple bits to write the same result into multiple destinations. `AMD` therefore encodes as `111`. `MD` and `DM` name the same two destinations; the supplied project programs use both orders. Repeat no destination letter.

The jump field tests the **current ALU result**, interpreted as a signed two's-complement value. There is no persistent condition-code register in Hack.

| Jump | Bits | Condition on the result |
| --- | --- | --- |
| Omitted | `000` | Never jump |
| JGT | `001` | Greater than zero |
| JEQ | `010` | Equal to zero |
| JGE | `011` | Greater than or equal to zero |
| JLT | `100` | Less than zero |
| JNE | `101` | Not equal to zero |
| JLE | `110` | Less than or equal to zero |
| JMP | `111` | Always jump |

A subtraction followed by a sign test is useful when its result fits the signed range. It is not a universal signed comparison for arbitrary 16-bit inputs: overflow can reverse the sign. Keep each program's numeric assumptions explicit.

Within a single instruction, memory access and a jump target use the **old A**. If the instruction also writes A, that new value takes effect for subsequent instructions. For example, `AM=D` writes D both into A and into memory at the address A held before the instruction. This is simultaneous clocked behavior, not a sequence of assignments evaluated left to right.

# Symbols and control flow

Assembly lets you give addresses names. `(LOOP)` declares a label for the next instruction; it does not occupy a ROM location. `@LOOP` loads that instruction address into A. A conditional jump can then choose between continuing and returning to the label.

An undeclared symbolic name can identify a RAM variable. The assembler allocates variables from RAM address 16 upward. Symbols are case-sensitive: `count` and `Count` are different. A typo in a label reference may therefore become an unintended variable instead of a syntax error.

Predefined names include `R0`–`R15` for RAM addresses 0–15; `SP`, `LCL`, `ARG`, `THIS`, and `THAT` for addresses 0–4; `SCREEN` for 16384; and `KBD` for 24576. The first five names become useful in the later virtual-machine layer, but their addresses are already part of the assembler's contract.

Hack has no halt instruction. Programs often finish useful work by repeatedly jumping to a terminal label. Stopping the emulator is a tool action, distinct from a machine instruction. Likewise, a bounded run that reaches its step limit has paused; it has not proved that a program terminates.

# Screen and keyboard

The screen is 512 pixels wide and 256 pixels high. Its 8192 words occupy addresses 16384–24575. Each word describes 16 horizontal pixels, with bit 0 representing the leftmost pixel of that word. A set bit is black; a cleared bit is white.

For row r and column c, the screen word address is `16384 + r × 32 + floor(c / 16)`, and the bit index is `c mod 16`. Writing all ones to a screen word makes sixteen pixels black. Writing zero clears those pixels. Check the row boundary: the word after a row's final sixteen pixels starts the next row.

The keyboard register at address 24576 is read-only from the program's perspective. It holds zero when no key is pressed, or the code of the pressed key. Ordinary character keys use their character codes; special keys have defined Hack codes, including 128 for Enter and 130–133 for left, up, right, and down. A program reads the register; it does not receive a function callback or interrupt in this model.

# Project 4: multiplication and screen control

**Mult** computes R0 × R1 and stores the result in R2. The project assumes nonnegative inputs and a result below 32768. Plan a loop invariant: identify what your accumulated result and remaining counter mean after every iteration. Test either input equal to zero, one, several different positive values, and swapped operands. Do not assume an initial output value will already be zero.

**Fill** repeatedly observes the keyboard. Holding any key long enough must eventually make the whole screen black; releasing all keys long enough must eventually make it white. This program runs continuously. Decide how a screen position advances, where the screen ends, and when to re-read the keyboard. The contract permits different drawing orders; it does not require the entire display to change in one machine cycle.

Test Fill both by pressing and releasing keys and by checking screen memory after enough cycles. A single changed pixel is useful evidence during debugging, but it does not satisfy the complete-screen requirement. Ensure the write loop never overruns into KBD or an unmapped address.

# Debug one instruction

Before stepping, identify the current PC, A, D, and memory at A. Predict the computation, destination writes, and next PC. Step once and compare. Follow the first divergence, not just the final incorrect answer. A source line number is not necessarily a ROM address because blank lines, comments, and label declarations emit no instructions.

# Sources and next layer

This chapter adapts [Nand2Tetris Project 4](https://www.nand2tetris.org/project04) and its public [Machine Language chapter](https://www.nand2tetris.org/_files/ugd/44046b_d70026d8c1424487a451eaba3e372132.pdf), by Noam Nisan and Shimon Schocken. [Official project files](https://github.com/nand2tetris/projects/tree/main/04) contain Mult and Fill starter programs and tests. Adapted explanations retain CC BY-NC-SA 3.0; software fixtures retain their own license.

Now that the instruction contract is clear, [construct the computer that executes it](/learn/reference/computer-architecture).

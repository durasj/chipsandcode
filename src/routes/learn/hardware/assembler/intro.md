---
title: Turn symbols into instructions
updated: 2026-11-03
---

An assembler turns a program's symbolic spelling into the exact 16-bit instructions understood by the computer. It does not execute the program. This is the first translator in the software stack: after building the machine, you build a tool that writes its machine language.

[Build the assembler layer](/learn/path/assembler) or inspect translation and execution side by side in the [computer and assembler tool](/tools/computer).

# The translation contract

The input is a text file such as `Program.asm`. The output, `Program.hack`, is also text: each line contains exactly sixteen characters, each either 0 or 1. Every output line represents one instruction. The first line loads at ROM address 0, the second at address 1, and so on.

Each A-instruction or C-instruction emits one machine word. Comments, blank lines, and label declarations emit none. The binary output must match the language specification and the output of the official assembler for the same valid source.

Assembly is not a high-level expression language. The assembler looks up defined instruction fields; it does not evaluate arbitrary arithmetic expressions, invent new CPU operations, or optimize a program. `@table+3` is not part of the specified language. Address arithmetic belongs in a sequence of machine instructions.

# Parse without losing the source location

Remove the `//` comment portion of each line and ignore insignificant whitespace. Skip empty lines. Keep the original line number alongside each remaining command so an error can point to the code the learner wrote, even though ROM addresses count differently.

| Form | Example | Meaning |
| --- | --- | --- |
| A-instruction | `@27` or `@counter` | A literal or symbolic address |
| C-instruction | `D=M+1;JNE` | Computation with optional destination and jump |
| Label declaration | `(AGAIN)` | Name the next instruction's ROM address |

For a C-instruction, split the optional `dest=` prefix and optional `;jump` suffix from the required computation. Treat omission as an empty field, not the literal word `null`. The syntax does not contain a trailing semicolon when there is no jump.

Numeric A-instruction literals are nonnegative decimal integers in 0–32767. Assembly mnemonics are uppercase. User symbols are case-sensitive and may contain letters, digits, `_`, `.`, `$`, and `:`, but must not start with a digit. Thus `loop.end` is a possible symbol and `2loop` is not.

# Encode instructions without symbols first

Start with a translator whose input contains only numeric A-instructions and C-instructions. For an A-instruction, convert the value to binary and pad to 15 bits, then prepend 0. Padding is required: the value 3 must not produce a two-character output line.

For a C-instruction, look up the seven computation bits, three destination bits, and three jump bits. Join them after the `111` prefix. The complete [instruction tables](/learn/reference/machine-language#computation-codes) define those mappings.

For example, `D=A` has computation `0110000`, destination `010`, and omitted jump `000`. Its encoded word is:

```text
111 + 0110000 + 010 + 000 = 1110110000010000
```

Check fields independently before joining them. Swapping destination and jump bits can still produce sixteen valid binary digits, but the machine will execute a different operation. Reject an unknown mnemonic rather than silently replacing it with zero.

# Three kinds of symbols

All symbolic addresses eventually become integers, but they enter the symbol table in different ways.

| Kind | Examples | How the address is obtained |
| --- | --- | --- |
| Predefined | R0–R15, SP, SCREEN, KBD | Fixed by the platform |
| Label | `(AGAIN)` | Count the real instructions before the declaration |
| Variable | `@counter` without a matching declaration | Allocate the next available RAM slot, starting at 16 |

Initialize predefined entries before reading the program: R0–R15 map to 0–15; SP=0, LCL=1, ARG=2, THIS=3, THAT=4; SCREEN=16384; KBD=24576. Some names intentionally share an address. The symbol table stores addresses, not current RAM values.

A variable symbol consumes a data-memory slot. A label consumes no instruction-memory slot. Neither operation changes the source program's instructions into RAM initialization commands. When you allocate `counter` to address 16, the generated code still has to put a value into RAM[16] if the program needs one.

# Two passes, one symbol table

Forward references are the reason to separate label discovery from code generation. A program can say `@FINISH` before the declaration `(FINISH)`. If the translator immediately treats every unknown name as a variable, it assigns the wrong kind of address.

**Pass one discovers labels.** Start a ROM counter at zero. Increment it once for each A- or C-instruction. For a label declaration, associate the label with the counter's current value and do not increment. Blank lines and comments do not increment it either. By the end of this pass, every declared label has an address.

**Pass two emits code.** Start the next-variable address at 16. Skip declarations. For each symbolic A-instruction, use the existing table entry if one exists. Otherwise, create one variable entry at the next available address and advance that allocation counter. Translate the resulting numeric address as an ordinary A-instruction. Encode C-instructions with the same field tables as before.

Repeated references to a variable must reuse its first address. Allocate previously unseen variables in order of first appearance during pass two, not alphabetically. Labels and variables use one symbol namespace, even though their addresses usually refer to different memory spaces. Reset the assembler's table and counters for each new source file.

# Walk a small example

This fragment is an address-resolution exercise, not a complete program:

```text
@later
0;JMP
@sample
M=1
(later)
@sample
D=M
```

Pass one counts four instructions before `(later)`, so `later` maps to ROM address 4. Pass two encounters `@later` with that address already known. It later assigns `sample` to RAM address 16. Both occurrences of `@sample` become the same A-instruction. The declaration emits no word, leaving six output instructions.

Translation does not execute the jump to decide which lines matter. Even unreachable instructions are translated and count toward later ROM addresses. Control flow is the computer's responsibility after assembly.

# Keep the implementation in small parts

A useful design separates four responsibilities:

1. A parser classifies commands and returns their fields with source locations.
2. A code mapper converts valid computation, destination, and jump names to bits.
3. A symbol table records and retrieves numeric addresses.
4. A driver performs the passes and writes one machine word per emitted instruction.

The official project permits any implementation language. Those responsibilities can be classes or ordinary functions; the behavior matters more than the names. The guided exercises here establish encoding, label counting, variable allocation, and the complete translation procedure. The computer tool provides a working reference for comparing results.

Useful diagnostics identify malformed parentheses, empty fields, unsupported computations, repeated/conflicting label declarations, illegal symbol names, and out-of-range addresses. A 15-bit address cannot hold 32768. A program cannot fit more than 32768 instructions into ROM32K. Avoid allocating ordinary variables into the memory-mapped screen or keyboard area.

# Project 6: verify the assembler

First test symbol-free source. The official Add program and the `MaxL`, `RectL`, and `PongL` variants let you check instruction parsing and encoding before symbol handling. Then translate their symbolic counterparts and compare the complete binary output against the supplied assembler.

Add exercises basic computation and storage. Max adds branches. Rect exercises screen addressing and loops. Pong is a much larger assembly program produced from a higher-level program, making it useful for checking many symbols and long instruction sequences. Implementing Pong itself is not the assembler assignment.

Compare every output word, not only whether a program appears to run. A wrong instruction can be on a path your manual run never takes. When two outputs differ, map the first differing ROM address back to its original source line, then inspect its fields and symbol resolution.

Also test tiny cases designed to isolate mistakes: consecutive labels, a forward label, a variable referenced more than once, two names with different capitalization, comments after commands, and the boundary literals 0 and 32767. A clean translation of valid code and a useful rejection of invalid code are separate qualities worth checking.

# Sources and the next boundary

This chapter adapts [Nand2Tetris Project 6](https://www.nand2tetris.org/project06) and the public [Assembler chapter](https://www.nand2tetris.org/_files/ugd/44046b_b73759b866b249a0b3a715bf5a18f668.pdf), by Noam Nisan and Shimon Schocken. [Official project files](https://github.com/nand2tetris/projects/tree/main/06) supply the comparison programs. Adapted explanations retain CC BY-NC-SA 3.0; software fixtures retain their own license.

You have connected symbolic instructions to a machine built from logic and state. The next step is a virtual machine, followed by a higher-level language, compiler, and operating-system services. Those are [the next software layers](/learn/reference/meta/what-next), beyond this Project 6 path.

---
title: From bits to arithmetic
updated: 2026-11-03
---

A bus is a group of signals. Give each bit a place value and that same bus becomes a number. This layer turns the gates you already know into adders, then combines arithmetic and logic in one controllable circuit: the ALU.

[Build the arithmetic layer](/learn/path/arithmetic) or open the [chip builder](/tools/chip-builder).

# Numbers are an interpretation

In an unsigned binary number, bit 0 is worth 1, bit 1 is worth 2, bit 2 is worth 4, and each higher bit doubles the previous weight. The four-bit pattern `1010` represents 8 + 2 = 10. Leading zeroes change the width, not the value.

An n-bit word has 2ⁿ possible patterns. A 16-bit word can therefore represent unsigned values from 0 to 65535. Hexadecimal is a compact spelling of the same bits: each hex digit covers four bits, so `0x00FF` is `0000000011111111`, or 255. A wire does not know which notation the interface uses.

**Width is part of the contract.** If a 16-bit addition produces a seventeenth bit, that bit does not fit in the output. Hack retains the low 16 bits: 65535 + 1 becomes 0. This is arithmetic modulo 65536, not an error in the adder.

# Signed numbers and two's complement

The same 65536 patterns can represent values from −32768 to 32767. In this **two's-complement** interpretation, bit 15 has weight −32768 instead of +32768. The other bits keep their positive weights.

| Bits | Unsigned interpretation | Signed interpretation |
| --- | --- | --- |
| `0000000000000000` | 0 | 0 |
| `0111111111111111` | 32767 | 32767 |
| `1000000000000000` | 32768 | −32768 |
| `1111111111111111` | 65535 | −1 |

To negate a word, invert every bit and add one, retaining the original width. That makes subtraction possible with the same adder: x − y = x + (NOT y + 1). There is only one representation of zero. The most negative value is a useful edge case: negating −32768 at 16 bits gives the same pattern because +32768 is outside the signed range.

Addition uses the same bit operations for signed and unsigned words. Interpretation changes whether a result is mathematically in range. For example, 32767 + 1 produces the pattern for −32768. The Hack ALU has no overflow flag. Its negative flag describes the resulting bits; it does not promise that an unbounded signed calculation would have the same sign.

# Add one bit at a time

A **HalfAdder** accepts two bits and produces a two-bit total split into `carry` and `sum`. Read the result as 2 × carry + sum.

| a | b | carry | sum |
| --- | --- | --- | --- |
| 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 |
| 1 | 1 | 1 | 0 |

A **FullAdder** adds three bits: `a`, `b`, and an incoming carry `c`. Its total ranges from 0 to 3. The sum output is the low bit; carry is the high bit. All eight input cases matter, including 1 + 1 + 1 = binary 11.

To add whole words, start at bit 0. Pass each position's carry to the next position's incoming carry. The lowest position starts without an incoming carry. The final carry is discarded for `Add16`; it is not an extra output pin. This arrangement is called a ripple-carry adder because a change can propagate through successive positions in physical hardware. The logical simulator checks values, not the actual propagation delay.

# Arithmetic chip contracts

| Chip | Inputs | Outputs | Required behavior |
| --- | --- | --- | --- |
| HalfAdder | `a`, `b` | `sum`, `carry` | Encode the sum of two bits |
| FullAdder | `a`, `b`, `c` | `sum`, `carry` | Encode the sum of three bits |
| Add16 | `a[16]`, `b[16]` | `out[16]` | Low 16 bits of a + b |
| Inc16 | `in[16]` | `out[16]` | Low 16 bits of in + 1 |
| ALU | `x[16]`, `y[16]`, six control bits | `out[16]`, `zr`, `ng` | The controlled operation below |

An incrementer is useful even after an adder exists: the program counter will often need the next instruction address. A named chip gives that recurring operation a clear interface.

# The ALU is a controlled pipeline

The Hack arithmetic logic unit has two word inputs and six one-bit controls. Apply the controls in this order:

1. `zx`: replace x with zero when set.
2. `nx`: invert the resulting x word when set.
3. `zy`: replace y with zero when set.
4. `ny`: invert the resulting y word when set.
5. `f`: choose addition when 1, or bitwise AND when 0.
6. `no`: invert the resulting output word when set.

Zeroing happens before inversion. Consequently, zeroing and then inverting an input creates all ones, the signed value −1. The output is always a 16-bit word. After all six controls have taken effect, `zr` is 1 exactly when every output bit is zero; `ng` is the final output's bit 15.

There are 64 control patterns. The following 18 useful functions are the documented repertoire; the pipeline also defines the behavior of the other patterns.

| Result | zx | nx | zy | ny | f | no |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1 | 0 | 1 | 0 | 1 | 0 |
| 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| −1 | 1 | 1 | 1 | 0 | 1 | 0 |
| x | 0 | 0 | 1 | 1 | 0 | 0 |
| y | 1 | 1 | 0 | 0 | 0 | 0 |
| NOT x | 0 | 0 | 1 | 1 | 0 | 1 |
| NOT y | 1 | 1 | 0 | 0 | 0 | 1 |
| −x | 0 | 0 | 1 | 1 | 1 | 1 |
| −y | 1 | 1 | 0 | 0 | 1 | 1 |
| x + 1 | 0 | 1 | 1 | 1 | 1 | 1 |
| y + 1 | 1 | 1 | 0 | 1 | 1 | 1 |
| x − 1 | 0 | 0 | 1 | 1 | 1 | 0 |
| y − 1 | 1 | 1 | 0 | 0 | 1 | 0 |
| x + y | 0 | 0 | 0 | 0 | 1 | 0 |
| x − y | 0 | 1 | 0 | 0 | 1 | 1 |
| y − x | 0 | 0 | 0 | 1 | 1 | 1 |
| x AND y | 0 | 0 | 0 | 0 | 0 | 0 |
| x OR y | 0 | 1 | 0 | 1 | 0 | 1 |

For x = 7 and y = 9, the addition setting produces 16, with both status flags 0. For x = 9 and y = 9, subtraction x − y produces 0 and sets `zr`. Change only one control at a time and follow the intermediate transformations before memorizing any control word.

# Build and verify

Build HalfAdder, FullAdder, Add16, and Inc16 before the ALU. Reuse tested interfaces. For the ALU, first establish the main 16-bit output, then derive the two status outputs from that final word. This keeps data-path errors separate from flag errors.

Small adders allow exhaustive truth-table testing. Larger chips need carefully chosen cases: zero, all ones, a carry crossing several bit positions, the highest bit, opposite signed values, and wraparound. Check both operands independently to catch a pin accidentally wired twice. For the ALU, exercise controls across multiple input pairs; one pair of equal numbers can hide swapped inputs or a wrong subtraction direction.

The official project includes separate ALU tests with and without status outputs. Passing representative tests is evidence of correctness, not exhaustive proof over every possible pair of 16-bit inputs. Investigate the first mismatching case and the earliest stage where its value diverges.

# Sources and next layer

This chapter is an original adaptation of [Nand2Tetris Project 2](https://www.nand2tetris.org/project02) and the public [Boolean Arithmetic chapter](https://www.nand2tetris.org/_files/ugd/44046b_89c60703ebfc4bf39acef13bdc050f5d.pdf), by Noam Nisan and Shimon Schocken. Use the [official project files](https://github.com/nand2tetris/projects/tree/main/02) for the supplied contracts and test cases. Adapted explanatory content retains CC BY-NC-SA 3.0; imported software fixtures retain their own license.

Arithmetic still forgets its result when inputs change. [Add memory](/learn/reference/memory) to let a value survive.

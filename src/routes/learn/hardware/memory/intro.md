---
title: Give the machine a memory
updated: 2026-11-03
---

A combinational circuit answers a question about its current inputs. A memory circuit can answer a different question: what value was stored earlier? State gives a machine a past, so it can count, follow a sequence, and keep the results of a program.

[Build the memory layer](/learn/path/memory) or experiment with the clock in the [chip builder](/tools/chip-builder).

# Separate now from next

The primitive **DFF**, or data flip-flop, holds one bit. Over a complete clock cycle, the value supplied at its input becomes the next stored output. Between updates, changing the input does not change the stored output.

For this educational model, the clock has two observable phases. **Tick** captures the next state from the current inputs and current stored state. **Tock** commits that captured state. Inspecting the output after tick still shows the old value; after tock it shows the newly committed value. A full cycle performs both phases. This convention is a simulation model, not a transistor-level account of every physical flip-flop.

All stateful parts capture before any of them commit. If one register feeds another, a cycle moves the first register's old value into the second. It does not let a new value race through the whole chain in one cycle. This simultaneous update rule is essential when you connect a CPU's registers.

The DFF is supplied as a primitive. Project 3 asks you to build the memory devices above it, not to construct the DFF itself from combinational gates.

# Hold a bit, or load a bit

A DFF always accepts the next input. A useful **Bit** chip adds a `load` control:

| load | State after a completed cycle |
| --- | --- |
| 0 | Keep the previously stored bit |
| 1 | Store `in` |

The choice is between the incoming value and the old stored value. A feedback path through a state element is meaningful: it connects one time step to the next. A combinational loop with no storage is different; it may have no stable or unique value and is not a valid substitute for memory.

A **Register** applies the same load decision to sixteen stored bits together. There is one shared `load`, not a separate instruction for each bit. Its interface is `in[16], load → out[16]`.

# Address a word

RAM is a collection of registers with an address. If a RAM has 8 words, a 3-bit address selects one of them. Each word still holds 16 bits: **address width and word width are different quantities**.

Reading is combinational in this model: changing the address changes which stored word appears at `out`. Writing is clocked. With `load=1`, a completed cycle stores `in` at the selected address. With `load=0`, all words keep their values.

A correct write changes only the selected word. A correct read does not modify memory. When testing, write distinct values into several addresses, revisit them in a different order, and confirm that the others survived.

# Memory chip contracts

| Chip | Word width | Words | Address width | Inputs in addition to address | Output |
| --- | --- | --- | --- | --- | --- |
| Bit | 1 | 1 | None | `in`, `load` | `out` |
| Register | 16 | 1 | None | `in[16]`, `load` | `out[16]` |
| RAM8 | 16 | 8 | 3 | `in[16]`, `load` | `out[16]` |
| RAM64 | 16 | 64 | 6 | `in[16]`, `load` | `out[16]` |
| RAM512 | 16 | 512 | 9 | `in[16]`, `load` | `out[16]` |
| RAM4K | 16 | 4096 | 12 | `in[16]`, `load` | `out[16]` |
| RAM16K | 16 | 16384 | 14 | `in[16]`, `load` | `out[16]` |

Here K means 1024 words. RAM16K contains 16384 × 16 stored bits. It does not mean sixteen thousand one-bit locations.

# Grow memory through hierarchy

Larger RAMs combine smaller banks. Split an address into two pieces: high bits choose a bank, and low bits choose a word inside that bank. Route the write-enable signal to exactly one bank; select the corresponding bank's output for reads.

For example, a six-bit address for RAM64 can select one of eight RAM8 banks using three bits, then one of eight words in that bank using the remaining three bits. The bank choice must agree for both reading and writing. Reversing the address groups may pass tests at address zero and still scramble most locations.

Use a hierarchy to reason about the design, but do not mistake the logical picture for a requirement to allocate an enormous object graph in a simulator. A built-in memory chip with the same contract can represent a verified lower layer efficiently. When testing your own RAM64, however, the top-level chip under test must be your implementation, not a built-in substitute bearing the same name.

# The program counter

A **PC** is a 16-bit register that can hold, load, increment, or reset. Its input pins are `in[16]`, `load`, `inc`, and `reset`; its output is `out[16]`. Resolve competing controls in this strict order:

| Highest active control | Next value |
| --- | --- |
| reset | 0 |
| load | `in` |
| inc | old `out` + 1, retaining 16 bits |
| None | old `out` |

Reset overrides load; load overrides increment. These are clocked state updates. Setting reset does not make the stored output change before the update. Incrementing 65535 wraps to zero. Later, the CPU uses the low 15 bits as the instruction-memory address.

The PC gives control flow a simple physical meaning. Most instructions increment it. A taken jump loads a different address. Restarting a program resets it to zero.

# A useful clock experiment

Load the value 6 into a Register with `load=1`. Before a cycle its output is still the old value. Tick, inspect, then tock: the output becomes 6. Set `load=0`, change the input to 11, and complete another cycle. The output must remain 6. Finally, enable load and cycle again; it becomes 11.

Repeat the same experiment with RAM, adding an address. Then test two addresses whose low bits match but high bits differ. This catches mistakes in bank selection that nearby addresses may not reveal.

# Build and verify

Construct Bit, Register, the RAM hierarchy, and PC. Test hold behavior as carefully as loading. Check first and last addresses, bank boundaries, several consecutive writes, and reads before and after each clock phase. PC tests must include simultaneous controls to establish precedence, not just one active control at a time.

The official scripts interleave input changes, `tick`, `tock`, and recorded outputs. In the [chip builder](/tools/chip-builder), compile your design and open **Test scripts** to run a TST script with optional CMP expected output. Read the timing of each expected row before interpreting a failure: a value correct one half-cycle too early is still incorrect. Simulator initialization or a tool's “clear state” action is separate from a chip's specified input pins.

# Sources and next layer

This chapter adapts [Nand2Tetris Project 3](https://www.nand2tetris.org/project03) and the public [Memory chapter](https://www.nand2tetris.org/_files/ugd/44046b_1801b5682e4d4a67bd05e14235665d8b.pdf), by Noam Nisan and Shimon Schocken. [Official project files](https://github.com/nand2tetris/projects/tree/main/03) include clocked tests for every required construction. Explanatory adaptations retain CC BY-NC-SA 3.0; project software retains its own license.

Now the machine can calculate and remember. [Machine language](/learn/reference/machine-language) specifies the instructions that will control those capabilities.

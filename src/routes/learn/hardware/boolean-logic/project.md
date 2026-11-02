---
title: Gate contracts and larger buses
updated: 2026-11-03
---

Build one reliable part, then use its behavior to understand the next. This chapter collects the single-bit construction contracts and the larger bus and routing operations described in the original material.

# The construction loop

1. Read the input, output, and behavior contract.
2. Connect permitted parts in Visual mode, or describe the same circuit in HDL.
3. Change inputs and inspect the result.
4. Test every input combination.
5. Repair any failing case, then continue.

The guided path introduces each tool gradually. [Continue learning](/learn). For independent experiments, open the [hardware simulator](/tools/hardware-simulator).

The workbench supplies primitive equivalents of previously introduced gates as permitted components. It does not yet package your own earlier implementation as a reusable custom chip library.

# The supplied NAND primitive

NAND gives the opposite of AND. It is 0 only when both inputs are 1.

| a   | b   | out |
| --- | --- | --- |
| 0   | 0   | 1   |
| 0   | 1   | 1   |
| 1   | 0   | 1   |
| 1   | 1   | 0   |

You explore its behavior, then use it as a supplied part. You do not have to construct it. The earlier NOT and AND demonstrations explain what the operations mean; the construction exercises ask you to realize them from the chosen primitive. [Why NAND is enough](/learn/reference/boolean-logic/background#universality).

[Inspect supplied NAND](/tools/hardware-simulator/BuiltinNand).

# Single-bit gates

## NOT: invert a signal

The output is the opposite of the input. A NOT gate is also called an **inverter**.

| in  | out |
| --- | --- |
| 0   | 1   |
| 1   | 0   |

Hint: consider what a NAND does when both of its inputs receive the same signal.

[Open the NOT exercise](/tools/hardware-simulator/ExerciseNot).

## AND: require both inputs

The output is 1 only when both inputs are 1. NAND already gives the opposite answer; use a gate you understand to reverse it.

## OR: accept either input

The output is 1 when at least one input is 1. Both inputs may be 1. Try rewriting the condition as “it is not the case that both inputs are 0.”

## XOR: detect a difference

The output is 1 when exactly one input is 1. It is 0 when they match. Describe the two situations that should produce a 1, then combine them.

| a   | b   | AND | OR  | XOR |
| --- | --- | --- | --- | --- |
| 0   | 0   | 0   | 0   | 0   |
| 0   | 1   | 0   | 1   | 1   |
| 1   | 0   | 0   | 1   | 1   |
| 1   | 1   | 1   | 1   | 0   |

Open an exercise: [AND](/tools/hardware-simulator/ExerciseAnd), [OR](/tools/hardware-simulator/ExerciseOr), or [XOR](/tools/hardware-simulator/ExerciseXor). Each has four exhaustive input cases.

# Selecting and routing

## Mux: choose one input

A **multiplexor**, or mux, selects one data input and passes it to the output. The selector chooses a route; it is not a power switch.

| sel | out |
| --- | --- |
| 0   | a   |
| 1   | b   |

The full contract has three binary inputs and eight cases:

| a   | b   | sel | out |
| --- | --- | --- | --- |
| 0   | 0   | 0   | 0   |
| 0   | 1   | 0   | 0   |
| 1   | 0   | 0   | 1   |
| 1   | 1   | 0   | 1   |
| 0   | 0   | 1   | 0   |
| 0   | 1   | 1   | 1   |
| 1   | 0   | 1   | 0   |
| 1   | 1   | 1   | 1   |

A useful expression is `(a AND NOT sel) OR (b AND sel)`. With sel=0, only a can reach the output; with sel=1, only b can.

[Open the Mux exercise](/tools/hardware-simulator/ExerciseMux).

## DMux: choose one output

A **demultiplexor**, or demux, takes one data input and sends it to a selected output. Every other output is 0.

| in  | sel | a   | b   |
| --- | --- | --- | --- |
| 0   | 0   | 0   | 0   |
| 0   | 1   | 0   | 0   |
| 1   | 0   | 1   | 0   |
| 1   | 1   | 0   | 1   |

Equivalently, `a = in AND NOT sel` and `b = in AND sel`. Check both outputs in every case. Routing an input of 0 still produces 0 at the chosen output; the selection does not create a 1.

[Open the DMux exercise](/tools/hardware-simulator/ExerciseDMux).

# Buses

A **bus** groups several signals into one interface. A 16-bit bus has sixteen bits, named `data[0]` through `data[15]`. When a bus represents an unsigned binary number, bit 0 is the least significant bit and bit 15 is the most significant.

A word's width and the number of inputs are different things. A two-input, 16-bit AND has two buses, each containing sixteen bits. It applies sixteen independent AND operations.

| Operation | Contract for each bit i                |
| --------- | -------------------------------------- |
| Not16     | out[i] = NOT in[i]                     |
| And16     | out[i] = a[i] AND b[i]                 |
| Or16      | out[i] = a[i] OR b[i]                  |
| Mux16     | out[i] = a[i] if sel=0; otherwise b[i] |

The selector of Mux16 is **one bit**. It selects an entire word; it does not need one selector per data bit.

For a four-bit illustration, NOT of `0011` is `1100`. The same construction works at 8, 16, or 32 bits: repeat the one-bit operation in parallel. Bitwise AND and OR are not arithmetic addition.

[Explore 16-bit gates in the buses and routing tool](/tools/buses).

These operations are executable behavioral models in that tool. The current guided circuit graph and hardware simulator do not provide full multi-bit HDL construction. A working lab output does not mean a custom Not16 implementation has been built or verified.

# Multi-way operations

A multi-way gate combines or selects among more than two inputs. “Multi-way” describes the number of alternatives; “multi-bit” describes the width of each alternative.

## OR across a word

**Or8Way** reduces eight input bits to one output. The result is 1 if any input is 1, and 0 only if all eight inputs are 0. This differs from Or16, which combines two words and produces a word.

It can be composed as a chain or a tree of two-input OR gates. Both give the same Boolean answer; a balanced tree uses fewer successive gate stages than a long chain.

## Multi-way multiplexors

A 4-way, 16-bit mux chooses one of four words. Its selector has two bits:

| sel[1] | sel[0] | Selected word |
| ------ | ------ | ------------- |
| 0      | 0      | a             |
| 0      | 1      | b             |
| 1      | 0      | c             |
| 1      | 1      | d             |

An 8-way, 16-bit mux chooses among eight words and needs three selector bits. For a power-of-two number of alternatives m, the number of selector bits is `log₂(m)`.

A 4-way mux can be built from three 2-way muxes: select between a and b, select between c and d, then select between those two intermediate results. Extending the selection tree gives an 8-way mux.

## Multi-way demultiplexors

A 4-way, 1-bit demux sends its input to a, b, c, or d according to a two-bit selector. An 8-way version uses three selector bits and eight outputs.

| sel | a   | b   | c   | d   |
| --- | --- | --- | --- | --- |
| 00  | in  | 0   | 0   | 0   |
| 01  | 0   | in  | 0   | 0   |
| 10  | 0   | 0   | in  | 0   |
| 11  | 0   | 0   | 0   | in  |

A demux tree repeatedly splits one route into two. The same routing idea can carry a bus, but the original 4-way and 8-way construction contracts here carry a **single bit**.

[Try Or8Way, 4-way and 8-way muxes, and demuxes](/tools/buses). Change the selector and check that only the chosen data reaches the output. For demuxes, also inspect every inactive output.

# Correctness, then efficiency

There is usually more than one correct circuit. Begin by satisfying the interface for all inputs. Then compare designs by their number of parts, repeated subexpressions, fan-out, and depth of dependent gates.

These comparisons can reveal opportunities to simplify a logical network. They are not a physical timing or power measurement. Real optimization also depends on transistor technology, wire lengths and capacitance, layout, manufacturing cost, and other electrical constraints.

NAND is not the only valid foundation. NOR alone is universal, and a library containing AND, OR, and NOT is also complete. Choosing a different primitive changes how you express a design, not the Boolean behavior you are trying to implement.

# After the logic layer

You now have the vocabulary for signals, logic operations, composition, and routing. Arithmetic organizes gates to calculate; memory adds state; architecture connects calculation, storage, and control. Those later chapters require new runtimes and exercises and are not yet implemented here.

[See the available next steps](/learn/reference/meta/what-next).

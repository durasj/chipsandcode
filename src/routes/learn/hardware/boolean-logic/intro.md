---
title: From signals to logic
updated: 2026-11-03
---

A computer stores and transforms information. At the bottom of that process are signals with two logical states: **0** and **1**. Gates turn those signals into useful rules. Connect the rules and they become the parts of a larger machine.

# Start with behavior

First, change a single signal and watch its output. Then meet **NOT**, which reverses a signal, and **AND**, which checks whether two inputs are both 1. Those two ideas make **NAND** easier to understand: it is the opposite of AND.

The guided path introduces each control when it becomes useful. You can [start learning](/learn), or use these explanations whenever you want the reasoning behind a step.

# Why build from one gate?

NAND is a supplied building block in this project. Copies of it can form NOT, AND, and OR. Those operations can express every Boolean function, so a single kind of primitive is enough to build any combinational logic circuit. [See why this works](/learn/reference/boolean-logic/background#universality).

That does not mean one gate is a whole computer. A computer also needs state, timing, arithmetic, instructions, and software. Building the logic foundation makes those later ideas less mysterious.

# How the material fits together

- **Explore:** understand signals, NOT, AND, and NAND by changing inputs.
- **Build:** construct NOT, AND, OR, XOR, Mux, and DMux. Check every input combination.
- **Explain:** connect truth tables, Boolean expressions, gate diagrams, and HDL.
- **Scale:** use the Boolean functions and bus tools to explore canonical expressions, multi-bit operations, and multi-way routing.

A chip's **interface** tells you what it promises. Its **implementation** is the network that fulfils that promise. There can be several correct implementations; start with correctness, then compare their structure.

# Read or experiment

[Logic, composition, and HDL](/learn/reference/boolean-logic/background) develops the theory, including a worked XOR implementation and test script.

[Gate contracts and larger buses](/learn/reference/boolean-logic/project) collects the construction goals and explains how the same logic scales to several bits and several routes.

The [hardware simulator](/tools/hardware-simulator) runs the project's supported HDL and test scripts. The [Boolean functions tool](/tools/boolean-functions) and [buses and routing tool](/tools/buses) make the remaining logic concepts directly explorable.

# What is available now

The guided constructions cover single-bit combinational logic. The tools also evaluate multi-bit and multi-way behavior. Arithmetic, clocked storage, a processor, and higher-level software are the journey ahead; they are not completed learning chapters in this release.

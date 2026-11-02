# Chips and Code: content and simulator audit

Baseline audit of the `main` branch of [durasj/chipsandcode](https://github.com/durasj/chipsandcode) through the GitHub connector on 2 November 2026, before the interface redesign. This inventory distinguishes source content from executable simulator support. Release verification is reported separately.

## Actual shipped scope

The baseline README described a browser-based, no-prerequisites, free experience and claimed the first week of Nand2Tetris. The actual project page contains a supplied NAND demonstration, **six embedded construction exercises**, and descriptions of multi-bit and multi-way gates. Treat those as distinct levels of support.

| Existing source                                         | Verified contents                                                                                                                                                               | Layer / interaction treatment                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/routes/learn/hardware/boolean-logic/intro.md`      | Build gates from NAND; later processing/storage chapters described as coming soon                                                                                               | Logic foundation: construct a computer from binary signals                                               |
| `src/routes/learn/hardware/boolean-logic/background.md` | Binary values, truth tables, expressions, canonical representation, gate abstraction/composition, physical construction context, HDL and simulation/testing; worked XOR example | Contextual reference entries; inspect signals and truth-table evidence; optional algebra/HDL explanation |
| `src/routes/learn/hardware/boolean-logic/project.md`    | NAND demo; NOT, AND, OR, XOR, Mux, DMux exercises; descriptive bus/multi-way extensions; perspective on alternative primitives and optimization                                 | Six construction missions after a short NAND discovery, then explicitly marked expansion plans           |
| `src/lib/hardware-simulator/examples/BuiltinNand.ts`    | Supplied NAND with test and comparison fixtures                                                                                                                                 | Onboarding device that players probe; do not award construction mastery for merely toggling it           |
| `src/lib/hardware-simulator/examples/ExerciseNot.ts`    | Empty NOT implementation; 2 input cases                                                                                                                                         | Inverter: output is the opposite of its input                                                            |
| `src/lib/hardware-simulator/examples/ExerciseAnd.ts`    | Empty AND implementation; all 4 cases                                                                                                                                           | Conjunction: output high only when both inputs are high                                                  |
| `src/lib/hardware-simulator/examples/ExerciseOr.ts`     | Empty OR implementation; all 4 cases                                                                                                                                            | Disjunction: output high when either input is high                                                       |
| `src/lib/hardware-simulator/examples/ExerciseXor.ts`    | Empty XOR implementation; all 4 cases                                                                                                                                           | Difference detector: output high when the inputs disagree                                                |
| `src/lib/hardware-simulator/examples/ExerciseMux.ts`    | Empty Mux implementation; all 8 cases                                                                                                                                           | Receiver selects one of two input signals; selector routes data, rather than acting as an enable         |
| `src/lib/hardware-simulator/examples/ExerciseDMux.ts`   | Empty DMux implementation; 4 cases and 2 expected output pins                                                                                                                   | Router sends an input signal to one of two destinations; inactive destination must remain 0              |

## Existing simulation capabilities and limits

The existing simulator is a valuable reusable implementation. `ChipFactory.ts` builds composite chips from HDL AST parts and internal wires; `CustomChip.ts` runs a network of those parts. Real implementations exist for `Nand`, `Not`, `And`, `Or`, and `Xor` in `src/lib/hardware-simulator/chips/builtin/`.

**Mux and DMux native classes are placeholders**, both extending `NotImplemented`. That does not prevent constructing their composite HDL from working NOT/AND/OR/NAND parts, which is what their exercise fixtures request. The workbench must not instantiate a built-in Mux/DMux to stand in for a player's completed construction without implementing it or using that construction.

**The player's reusable chip library is not implemented in the factory.** `ChipFactory.LOADED` is an unused empty object; `fromDefined` resolves only `ChipFactory.BUILTIN`. Reusing actual player-authored designs as component packages needs registration with dependency resolution or equivalent graph flattening. A badge or inventory label alone does not provide this functionality. Restricting available primitives by mission also needs explicit enforcement because the current factory exposes its built-ins independently of progression.

**Multi-bit and later computer stages are future work.** `CustomChip.ts` explicitly lists support for words and clocked behavior as TODOs. `Not16Chip.ts` is a `NotImplemented` class. Descriptive bus and multi-way content can be covered through an interactive reference model now, but full construction missions require simulator and fixture work. Do not present ALU, RAM, CPU, assembler, or later weeks as playable based on README aspirations.

**Animation is an interpretation of combinational evaluation.** The existing runtime uses breadth-first propagation and a 9,999 iteration loop guard, not modeled physical electrical delay. Show an educational signal trace, not claims about measured voltage, timing, energy, or real current. The shared visual/code graph must reject cycles, missing connections and unsupported parts and keep failures recoverable.

## Recommended playable slice

The workbench must provide complete construction and verification for the existing contracts. Let players inspect the target behavior, build a network, toggle inputs, see intermediate 0/1 states, and run exhaustive tests. A mission completes only if the player's network passes all required input combinations and both outputs where applicable. Keep expected and actual values visible, including an actionable counterexample on failure.

The six existing fixtures already define reliable small-machine contracts. Preserve those contracts and exercise IDs, with their technical chip names visible throughout. The signal monitor must visualize the actual output of the same circuit; it must not be a disconnected animation triggered by a success button.

## Known source corrections handled in the adapted reference

- The background section titled “Two-Input Boolean Functions” contains an eight-row, three-input table copied from the earlier example. It does **not** show all sixteen two-input functions as its caption claims. The adapted reference omits this incorrect table and uses complete gate truth tables.
- Its function-count formula is rendered as `${2^2}^n`; the correct count for Boolean functions of `n` inputs is `2^(2^n)`.
- The background expands VHDL as “Virtual”; that expansion is incorrect. In the adapted content, simply call the project's syntax “HDL” and explain what it describes.
- The project calls NOT a “converter”; use the conventional “inverter.”
- `ExerciseAnd.ts` starts its comment with “Not gate”; the adapted challenge uses the correct AND name; the legacy fixture is separate.
- The project’s multi-way demultiplexor prose ends with “8-way 1-bit multiplexor”; the context indicates demultiplexor. Keep this a documented future capability until implemented.
- The introduction's descriptions of uniform chapter structure and later chapters are aspirations rather than shipped navigation. The adapted reference links only to available sections.

## Attribution and continuity

`README.md` states **software: MIT; learning content: CC BY-NC-SA 3.0**. `src/routes/about/+page.svelte` explicitly credits Nand2Tetris content under that license and says Chipsandcode is not affiliated with or endorsed by Nand2Tetris. Retain the applicable credits and license links when adapting existing explanations, diagrams, exercises, and source text. Keep original interface artwork identifiable separately from adapted course material. Preserve existing `/learn/hardware/...` links as deep links into or alongside the reference, and keep the Hardware IDE accessible for free exploration.

## Sources inspected

`README.md`; `src/routes/about/+page.svelte`; the three Boolean logic Markdown files listed above; `BuiltinNand.ts`; the six exercise fixtures listed above; `src/lib/hardware-simulator/chips/ChipFactory.ts`; `CustomChip.ts`; `builtin/{NotImplemented,NandChip,NotChip,AndChip,OrChip,XorChip,MuxChip,DMuxChip,Not16Chip}.ts`.

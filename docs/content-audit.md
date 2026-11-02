# Chips and Code: complete source adaptation

The repository contained one Boolean logic chapter: `intro.md` (14 lines), `background.md` (143), `project.md` (237), and `meta/what-next.md` (17). This audit covers all 411 source lines from the pre-redesign course. Later README chapter names were plans, not additional learning material.

The four documents now contain corrected full explanations, rendered at `/learn/reference/...` in the same visual system as Learn and Tools. The compact reference links into the relevant full-text section. The former course routes redirect to these pages; they do not expose a second interface. Embedded legacy editors have been replaced by contextual links to the simulator under Tools.

## Source-to-experience coverage

| Source material                                                                     | Adapted explanation                                                        | Interaction or tool                                                              |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Introduction: binary building blocks and constructing a computer from gates         | `/learn/reference/boolean-logic`                                           | Guided signals → supplied NOT → supplied AND → NAND, then circuit construction   |
| Boolean algebra: two values, NOT, AND, OR, XOR, NAND, NOR                           | `/learn/reference/boolean-logic/background#signals-and-boolean-operations` | Foundational exploration and compact reference gate controls                     |
| Three-variable truth table and `(a OR b) AND NOT c`                                 | `background#truth-tables`                                                  | Compact reference exposes inputs and intermediate values                         |
| Canonical representation, literals, and sum of products                             | `background#canonical-representation`                                      | `/tools/boolean-functions` edits table outputs and derives canonical expressions |
| All sixteen two-input functions, equivalence, implication, and function count       | `background#all-two-input-functions`                                       | Boolean functions tool evaluates every two-input truth table                     |
| NAND and NOR universality, NOT/AND/OR constructions                                 | `background#universality`                                                  | NAND's optional deeper explanation and Boolean functions tool                    |
| Physical gates, transistors, silicon, alternate switching technologies, abstraction | `background#gates-and-physical-signals`                                    | Precise distinction between logical signals and electrical quantities            |
| Primitive/composite gates, interfaces, internal signals, three-input AND, fan-out   | `background#interfaces-and-composition`                                    | Visual/code workbench and compact reference                                      |
| Worked XOR implementation and alternate designs                                     | `background#a-worked-xor-circuit`                                          | `/tools/hardware-simulator/Xor` retains the source example and fixture           |
| HDL header, part interfaces, named internal wires, structural interpretation        | `background#reading-hdl`                                                   | Same simulator and parser, now under Tools                                       |
| Test scripts, expected/actual values, exhaustive testing and its limits             | `background#testing-a-construction`                                        | Guided exhaustive tests plus simulator Tests and Output views                    |
| Why model before fabrication; timing, power, and cost limits                        | `background#from-a-model-to-physical-hardware`                             | Explicit simulator boundary; no fabricated physical measurements                 |
| Project objective and supplied NAND contract                                        | `/learn/reference/boolean-logic/project#the-supplied-nand-primitive`       | NAND observation; `/tools/hardware-simulator/BuiltinNand`                        |
| NOT, AND, OR, XOR contracts and hints                                               | `project#single-bit-gates`                                                 | Six guided builds retain existing scalar contracts and exercise IDs              |
| Full Mux truth table and selector meaning                                           | `project#selecting-and-routing`                                            | Guided Mux construction and `ExerciseMux` simulator fixture                      |
| DMux contract and all inactive outputs                                              | `project#dmux-choose-one-output`                                           | Guided DMux construction and `ExerciseDMux` fixture                              |
| Bus notation, word width, Not16, And16, Or16, Mux16                                 | `project#buses`                                                            | `/tools/buses` evaluates the multi-bit behavior                                  |
| Or8Way versus bitwise OR                                                            | `project#multi-way-operations`                                             | Buses and routing tool evaluates reduction                                       |
| 4/8-way 16-bit mux, selector width, composition trees                               | `project#multi-way-multiplexors`                                           | Buses and routing tool routes actual words                                       |
| 4/8-way 1-bit demux, inactive zero outputs                                          | `project#multi-way-demultiplexors`                                         | Buses and routing tool evaluates every output                                    |
| Alternative primitives and efficiency considerations                                | `project#correctness-then-efficiency`                                      | Optional comparison after correct constructions; no timing claims                |
| What next, contribution links, wider Nand2Tetris curriculum                         | `/learn/reference/meta/what-next`                                          | Links to available labs, simulator, and official external continuation           |

Paths beginning with `background#` and `project#` are relative to `/learn/reference/boolean-logic/`.

## Corrections made during adaptation

- Replaced the incorrectly duplicated three-input table under “Two-Input Boolean Functions” with all sixteen actual two-input functions. Output strings consistently use row order 00, 01, 10, 11.
- Corrected the number of Boolean functions of n inputs to `2^(2^n)`, distinguishing it from the `2^n` input combinations.
- Introduced ordinary NOT and AND behavior before NAND. Explained NAND as NOT-AND and justified its role through functional completeness.
- Used **inverter**, not “converter,” for NOT.
- Explained HDL accurately; removed the incorrect expansion of VHDL as “Virtual.” Distinguished this educational syntax from VHDL and Verilog.
- Corrected the 8-way, 1-bit **demultiplexor** reference that previously said multiplexor.
- Distinguished bitwise operations from arithmetic and multi-bit width from multi-way alternatives.
- Clarified that a selector routes data rather than enabling power; a 0 input remains 0 along the chosen route.
- Separated logical fan-out from real electrical loading and logical circuit depth from physical propagation time.
- Qualified exhaustive testing as a guarantee of the modeled finite truth table, not a proof of physical fabrication, timing, or simulator correctness.
- Replaced unsupported claims that the existing simulator could build the full computer. Later chapters are explicitly still to be authored.
- Removed the claim that six scalar constructions complete the entire original first project, which also includes multi-bit construction work.
- Preserved source attribution and content licensing while removing dated update text, decorative quotations, and the legacy editor embeds.

## Executable scope and limits

The guided workbench constructs and verifies NOT, AND, OR, XOR, Mux, and DMux after exploration of supplied primitive behavior. Visual and code views share the same scalar, feed-forward circuit representation, parser, and simulator. All truth-table cases, including both DMux outputs, are checked.

The hardware simulator remains the existing HDL/test-script environment, integrated under Tools. NAND, NOT, AND, OR, and XOR have real built-in implementations. Mux and DMux construction fixtures use composite networks; their built-in classes remain placeholders. The simulator does not gain support for every placeholder class simply because its interface is redesigned.

The Boolean functions tool and buses/routing tool are executable behavioral explorations of the previously descriptive material. They extend what a learner can manipulate and inspect. They do not assert that arbitrary multi-bit HDL designs have been compiled or that a player's custom 16-bit gate has passed a construction exercise.

The factory does not yet register the player's earlier custom implementations as reusable chip packages. The workbench supplies primitive equivalents of permitted previously introduced gates. Both the full text and product avoid claiming a custom reusable library exists.

Arithmetic, sequential state, memory, CPU construction, machine language, an assembler, and high-level software are future layers. Their names and conceptual relationship appear in the landing journey, not as working chapters or tools.

## Licensing and continuity

Software remains MIT licensed. Adapted learning content remains **CC BY-NC-SA 3.0**, credited to the existing Chips and Code material by Jan Duras and its Nand2Tetris source by Noam Nisan and Shimon Schocken. The full-text pages preserve license links and the statement that Chips and Code is not affiliated with or endorsed by Nand2Tetris.

Existing `/learn/hardware/...` addresses are compatibility redirects into the new reference, and `/experiment/hardware-ide/...` addresses resolve into Tools. Canonical links within the adapted experience use `/learn`, `/learn/reference/...`, and `/tools/...` only.

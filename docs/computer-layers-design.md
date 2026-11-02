# Chips and Code: through the layers of a computer

## Direction

Retain the original **Chips and Code** name, chip/code symbol, and indigo identity. The experience is a technical game about constructing a computer: start with binary signals at the dark foundation, then rise through increasingly abstract systems toward light, high-level software. The computer itself is the world. There is no separate fictional setting or geography.

The core activity is engineering: make a circuit, inspect its behavior, find a failing case, and change the design. Progress comes from functioning systems. Supporting explanations stay in an optional reference view, available without replacing the workbench.

## Current implementation boundary

The first layer contains the existing single-bit material: supplied NAND, then NOT, AND, OR, XOR, Mux, and DMux. Arithmetic, memory, architecture, and software appear as **planned layers**, with an explanation of their role in a computer. Their presence in the stack does not make their exercises, runtimes, or editors playable.

| Layer        | Role                                                      | Current status                                      |
| ------------ | --------------------------------------------------------- | --------------------------------------------------- |
| Logic        | Binary signals, gates, composition, and routing           | Seven interactive steps; six construction exercises |
| Arithmetic   | Bits organized into words, addition, and ALU operations   | Planned                                             |
| Memory       | Clocked state, registers, addressing, and RAM             | Planned                                             |
| Architecture | Instruction execution and a complete processor            | Planned                                             |
| Software     | Machine instructions, assembly, and higher-level programs | Planned                                             |

The existing Markdown course and full hardware IDE remain accessible. Interactive bus and multi-way-selector explanations in the reference are concept demonstrations, not implemented construction challenges.

## Navigation and progression

An exploded computer stack shows the relationship between layers. Higher layers are visibly lighter and more abstract; the foundation is dark and detailed. Selecting a layer reveals its purpose and status. Logic exposes the seven existing gate steps and the next useful action.

The gates remain freely explorable. Completed chips are recorded only after the required evidence: all four observations for supplied NAND, or every truth-table case for a constructed chip. A suggested next step gives direction without enforcing artificial locks. Completion is evidence that a design satisfies its small, exhaustive contract; it is not a claim of independent transfer mastery.

Progress and drafts are stored on the current device. The reference, chips view, and workbench can be revisited. Server/account synchronization is separate future work.

## One circuit, two representations

Visual and code are equal authoring views of the same circuit:

- **Visual:** add permitted parts, connect a source to a destination pin, and inspect live values. Labeled connection controls provide another keyboard-accessible way to wire.
- **Code:** edit real HDL with the existing syntax, interfaces, and part names.
- **Split:** keep the schematic and HDL side by side. On narrow displays, preserve readable panels and allow a single-view choice.

Valid supported HDL updates the circuit. Visual edits regenerate corresponding HDL. Incomplete or invalid text must remain available for repair; it must never silently disappear on a view change, reload, or parser failure. An error must block tests of an outdated visual circuit. The workbench must clearly distinguish the last parsed circuit from the current unparsed code.

The shared model is deliberately bounded: scalar, feed-forward combinational circuits built from the mission's permitted primitives. Import accepts the supported model or reports why a construct cannot be represented. Unsupported buses, constants, feedback, unknown parts, and invalid interfaces must not be silently approximated. The full hardware IDE remains available for its existing broader authoring workflow.

HDL is structural code. It describes the connections between components, not the order in which a program executes. Arbitrary internal wire names and valid declaration order should not change a circuit's meaning. A graph view is a second representation, not a second simulator.

## The interaction loop

1. Inspect the chip interface and required behavior.
2. Build with gates or write the equivalent HDL.
3. Toggle inputs and observe the circuit's real outputs and intermediate signals.
4. Run every input case. Inspect expected and actual values, including both DMux outputs.
5. Repair the failing design without losing work or being penalized.
6. Save the verified result and continue to the next chip.

A live signal monitor makes state legible using values and labels as well as color. It is driven by the same circuit used for testing. Signal traces visualize Boolean propagation; they do not claim to measure voltage, current, energy, or physical delay.

## Contracts retained from the source material

| Chip | Required behavior                                                  | Exhaustive cases         |
| ---- | ------------------------------------------------------------------ | ------------------------ |
| NAND | `out = NOT(a AND b)`; supplied primitive                           | 4 observations           |
| NOT  | `out = NOT(in)`                                                    | 2                        |
| AND  | `out = a AND b`                                                    | 4                        |
| OR   | `out = a OR b`                                                     | 4                        |
| XOR  | `out = a XOR b`                                                    | 4                        |
| Mux  | `out = a` for `sel=0`, otherwise `b`                               | 8                        |
| DMux | Route `in` to `a` for `sel=0`, otherwise `b`; inactive output is 0 | 4, checking both outputs |

Mux and DMux are composed from implemented elementary gates. Their placeholder built-in classes are not used as a shortcut. Later steps offer supplied primitive equivalents of earlier chips; they do not yet register the player's earlier custom implementations as reusable component packages.

## Reference content

The optional reference covers signals and truth tables, Boolean expressions and canonical representation, abstraction and composition, HDL, buses, and multi-way selectors. Inputs and outputs remain manipulable so reading is connected to behavior. Source links and Nand2Tetris attribution stay visible. Existing learning-content licensing remains CC BY-NC-SA 3.0; software remains MIT.

## Interaction standards

Use clear contracts, recoverable errors, visible keyboard focus, readable code, and equivalent touch/keyboard wiring. State must never depend on color alone. Avoid punitive timers, streaks, currency, compulsory animation, or praise that overstates what was learned. Optional sound must remain muted unless enabled. Respect reduced motion.

The visual direction should make people want to inspect the machine. Precision, responsive signals, depth, and the relationship between code and circuitry provide the engagement.

## Future work

Future layers require real simulator and content development: word/bus support; sequential and clocked state; arithmetic components; memory; CPU architecture; machine and assembly tools; and higher-level software. Additional editor work may include general undo/redo, reusable player-authored chip packages, richer code navigation, dependency tracing, and synchronized accounts. These are plans, not features implied by the stack artwork.

See [the content audit](content-audit.md) for source limits and [the art direction](art-direction.md) for the visual system.

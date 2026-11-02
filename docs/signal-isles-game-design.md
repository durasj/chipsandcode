# Signal Isles game design: vision and implementation scope

This document is a design proposal, not a claim that every described interaction is shipped.

## Implementation snapshot — 2 November 2026

Implemented in the current redesign source: a selectable seven-station world, locally saved completion and circuit drafts, a chip collection, a field guide, a NAND discovery activity, six visual circuit builders (NOT, AND, OR, XOR, Mux, DMux), direct source-to-pin wiring with labeled connection menus, mission-specific mechanical scenes driven by live circuit outputs, generated read-only HDL, hints, one-step undo after clearing a circuit, and exhaustive truth-table checks for every single-bit mission. Composed designs compile through the existing HDL parser and hardware simulator. Mux and DMux are constructed from supported elementary parts rather than relying on missing built-in implementations. The proposed `isles` geography below was subsequently refined into the Signal Isles map.

Proposed later features, **not implemented by this source snapshot**: an explorable character-controlled world; step-by-step signal execution; general undo/redo; bidirectional HDL editing; player-authored reusable component packages; adaptive or fresh-context transfer challenges; a separate Applied mastery state; server/account progress synchronization; a migration adapter for old completion records; multi-bit and multi-way playable missions; and a new district synthesis challenge.

Current completion means passing the exhaustive single-bit contract (or discovering NAND's four cases), not independently demonstrated transfer mastery. Later workshops provide primitive equivalents of earlier chips; they do not instantiate a saved earlier player-authored circuit. All stations are available to explore, with a recommended next station rather than hard prerequisite locks. Progress is stored on the device. Publication and deployment status must be reported separately by the release owner.

The source-grounded scope statements in the proposal below describe the original audit before the redesign. In particular, “executable support must be verified/implemented” for scalar Mux/DMux has now been addressed through composition and checked by the circuit test suite; the described bus/multi-way extensions remain future scope.

---

# Chipsandcode: a world you bring to life

## Product thesis

Chipsandcode becomes a playable digital workshop: restore a quiet machine-world by designing the chips that make its systems work. Every successful design becomes a reusable tool and produces an immediate, persistent change in the world. Boolean logic is the material the player handles; the lesson text becomes a field notebook beside that activity.

This is a proposed interaction design grounded in the repository inventory supplied by the lead agent. The current material covers the first week of Nand2Tetris. Six embedded exercises are verified: Not, And, Or, Xor, Mux, and DMux. The project also describes multi-bit and multi-way extensions, whose embedded exercises are not present. Runtime primitives currently include Not, Nand, And, Or, and Xor; that does not establish that composed circuits, Mux, DMux, or the extensions are production-ready. Every implementation must distinguish content coverage from executable simulator coverage.

The central design test: **could a player finish this interaction without using the intended logic concept?** If yes, improve the interaction before adding more rewards or animation.

## Core fantasy and tone

You are a small, capable systems builder arriving in an interconnected workshop district. Its equipment is intact but its logic is missing. You restore it one useful behavior at a time. A small expressive maintenance bot can respond to your designs, carry parts, and point at visible signals; it never becomes a talking textbook that blocks play.

The world should look handmade and tactile: miniature devices, visible ports, little bridges, chunky modular surfaces, expressive lights, satisfying physical controls. Electrical metaphors are visual representations of binary logic, not claims to simulate voltage, resistance, current, or real-world electrical safety.

Keep language human and concrete. The player sees “Make the light respond to both switches” before seeing “AND gate.” After solving, naming the behavior gives them a useful abstraction they already understand. A chip label and notation remain available throughout for people who prefer the formal view.

## The game loop

1. **Notice a visible problem.** A machine visibly responds incorrectly; its target behavior can be previewed with controllable inputs.
2. **Inspect the contract.** Input names, output names, allowed parts, and target states sit beside the workbench. No hidden trick requirements.
3. **Build a model.** Place chips, connect ports, branch wires, and observe signals. Dragging is optional: select source, then select destination; keyboard controls support the same actions.
4. **Run and investigate.** A signal pulse travels through the actual graph, values appear on ports, and the first diverging output is easy to find. The player can pause and step evaluation.
5. **Revise without penalty.** Failed cases give evidence, never lost lives. Undo, reset, and hints are always available.
6. **Verify the design.** Every required truth-table case passes. A successful-looking animation is insufficient.
7. **Use what you built.** The repaired machine starts working, a route or interaction becomes usable, and the verified chip enters the player's toolbox.
8. **Apply it elsewhere.** A short transfer problem changes the story framing or input arrangement so recognition alone cannot establish mastery.

The map is a navigable index of working systems. The workbench is the main play surface. The notebook contains the existing conceptual explanations. Move between these layers without losing the current circuit.

## First ten minutes

This sequence introduces the actual NAND foundation and then the first two verified exercises. Times are design targets, not enforced timers. Players can inspect, replay, or take as long as they need.

| Time       | Player action                                                                                                                                              | Learning underneath                                                  | Visible result                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 0:00–0:40  | Touch two switches on the supplied NAND device; see both input values and its output. A tiny four-state tester is visible.                                 | Inputs and outputs; NAND's behavior; truth tables.                   | The output and attached signal lamp respond immediately.                                    |
| 0:40–1:10  | Open the first broken device: a night marker. Toggle its “daylight detected” input and preview what it should do.                                          | Specify a Boolean function before implementing it.                   | Target marker is lit for input 0 and dark for input 1.                                      |
| 1:10–3:30  | Build the night marker controller using the provided NAND part. Wire, run both test cases, inspect errors, revise.                                         | Construct NOT from NAND.                                             | Both truth cases pass; the marker becomes a permanent lit landmark.                         |
| 3:30–4:15  | Name and save the discovered chip as NOT. Inspect its reusable package, with the internal circuit expandable.                                              | Abstraction and hierarchical composition.                            | NOT appears in the toolbox; its ports and behavior remain inspectable.                      |
| 4:15–5:00  | Reach a beacon with two interlocks. Toggle the four combinations and examine the desired response.                                                         | AND's four-case contract.                                            | A ghost preview shows the beacon active only when both inputs are high.                     |
| 5:00–7:45  | Build its controller from allowed parts. Test the full four-case table, then inspect any failing input combination.                                        | Construct AND using established components/NAND; systematic testing. | The actual beacon reacts to the player's circuit, including incorrect states before repair. |
| 7:45–8:30  | Verify all four cases. The beacon lights and an adjacent workshop lane opens.                                                                              | Functional equivalence across the complete input space.              | A tangible world change and a reusable AND chip, rather than a lesson-complete modal.       |
| 8:30–10:00 | Optional short transfer: use AND for a different pair of binary conditions, with inputs in different physical positions. Then select the next visible job. | Transfer beyond story labels; pin identity and composition.          | Player chooses between a new job and free experimentation.                                  |

The NOT challenge states the desired behavior and allowed parts. It does not immediately reveal that the NAND inputs should be joined. Hints progress from “Try both possible inputs” to a conceptual clue to a visual example only when requested. The AND challenge likewise presents its contract without drawing the solution.

### Concrete beacon contract

Both “power ready” and “dish aligned” are binary signals. They are deliberately independent. The output is a logical signal controlling a fictional beacon indicator, not an electrical power calculation.

| Power ready (`a`) | Dish aligned (`b`) | Required beacon (`out`) |
| ----------------- | ------------------ | ----------------------- |
| 0                 | 0                  | 0                       |
| 0                 | 1                  | 0                       |
| 1                 | 0                  | 0                       |
| 1                 | 1                  | 1                       |

Testing should show expected and actual outputs for the selected case. A failing case should read, for example: “With power ready = 0 and dish aligned = 1, the beacon should be off. Your output is 1.” Keep the precise fault visible. Let players step through their own circuit without highlighting a canned solution.

## Campaign mapping to the existing material

The standard Project 1 extension names below are proposed identifiers for the described multi-bit/multi-way families; verify exact headings and canonical IDs before importing. The mapping creates no new claim that those exercises or runtimes already exist.

| Existing content or exercise             | Proposed playable job                              | Actual player interaction                                                                                  | Completion evidence                                                                 | Scope                                                                         |
| ---------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Boolean logic introduction               | Wake the supplied NAND test rig                    | Toggle binary inputs; inspect output; make a prediction before a run.                                      | All four states are inspectable; initial orientation is skippable.                  | Intro content exists; proposed game interaction.                              |
| Boolean logic background                 | Field notebook, attached to selected signals/chips | Reveal truth tables, terminology, notation, and existing explanatory text in context.                      | Knowledge remains searchable and accessible outside missions.                       | Existing text reused.                                                         |
| Built-in NAND foundation                 | First working part on the bench                    | Explore the supplied chip as a black box; see its truth table; branch its inputs.                          | NAND contract is correct in every input state.                                      | Built-in primitive exists.                                                    |
| `ExerciseNot`                            | Night markers                                      | Build an inverter that lights for a low input and turns off for a high input.                              | Both truth cases pass.                                                              | Embedded exercise exists; proposed visual adaptation.                         |
| `ExerciseAnd`                            | Double-interlock beacon                            | Build a controller that enables output only when both independent conditions are high.                     | All four truth cases pass.                                                          | Embedded exercise exists; proposed visual adaptation.                         |
| `ExerciseOr`                             | Two-call help bell                                 | Either of two call buttons can request the same bell; both pressed still requests one output.              | All four truth cases pass.                                                          | Embedded exercise exists; proposed visual adaptation.                         |
| `ExerciseXor`                            | Mismatch detector                                  | Flag a disagreement between two independent sensor bits. Equal values remain quiet.                        | All four truth cases pass, especially 1/1 = 0.                                      | Embedded exercise exists; proposed visual adaptation.                         |
| `ExerciseMux`                            | Signal selector                                    | Switch which of two input signals reaches a single output using a separate select signal.                  | All eight scalar input combinations pass.                                           | Embedded exercise exists; executable support must be verified/implemented.    |
| `ExerciseDMux`                           | Signal dispatch                                    | Send one input to one selected output while the other stays low.                                           | All four scalar input combinations produce both correct outputs.                    | Embedded exercise exists; executable support must be verified/implemented.    |
| Multi-bit NOT (`Not16`)                  | Invert a signal panel                              | Apply the same behavior independently to every lane of a 16-bit bus. Expand/collapse lanes.                | Per-lane equivalence; one-hot, all-low/all-high, alternating and generated vectors. | Described extension; new interaction/runtime work.                            |
| Multi-bit AND (`And16`)                  | Pair two signal panels                             | Combine corresponding lanes from two input buses.                                                          | Per-lane AND equivalence with crossed-lane tests.                                   | Described extension; new interaction/runtime work.                            |
| Multi-bit OR (`Or16`)                    | Merge indicator panels                             | Combine corresponding lanes without losing their positions.                                                | Per-lane OR equivalence with crossed-lane tests.                                    | Described extension; new interaction/runtime work.                            |
| Multi-bit Mux (`Mux16`)                  | Choose a whole signal panel                        | Select one complete 16-bit input bus with one select bit.                                                  | Selected bus reproduced exactly; unselected bus cannot affect output.               | Described extension; new interaction/runtime work.                            |
| Multi-way OR (`Or8Way`)                  | Any-signal alarm board                             | Reduce eight independent bits to one “any active” indicator.                                               | All 256 input combinations can be exhaustively tested.                              | Described extension; new interaction/runtime work.                            |
| Multi-way Mux (`Mux4Way16`, `Mux8Way16`) | Four/eight-source routing desk                     | Hierarchically choose one bus using two/three select bits.                                                 | Every select address routes the correct bus; targeted/generated vector checks.      | Described extension; verify exact source names; new interaction/runtime work. |
| Multi-way DMux (`DMux4Way`, `DMux8Way`)  | Four/eight-destination dispatch                    | Route one signal to exactly one addressed output.                                                          | Exhaustive single-bit input and select combinations; other outputs remain low.      | Described extension; verify exact source names; new interaction/runtime work. |
| Project completion                       | District systems check                             | Combine earned parts across several small machines, with independent inputs and a visible signal contract. | Correct component behavior and composition; no unrelated new prerequisite.          | Proposed synthesis challenge, explicitly new content.                         |

The six embedded exercises form the first fully interactive campaign slice. The described extensions become a separately scoped next release unless their missing runtimes and validators are completed. Do not present their map nodes as playable while they are documentation-only.

## World layout and navigation

Use three compact places for the verified six-exercise slice: **Marker Walk** (NOT/AND), **Signal Yard** (OR/XOR), and **Routing House** (Mux/DMux). Places reflect different uses of logic rather than arbitrary levels. A later **Bus Workshop** holds the multi-bit/multi-way material once implemented.

World navigation must preserve a direct, keyboard-friendly mission list with state, prerequisites, and “continue where I left off.” Spatial discovery adds delight, while actual access never depends on perceiving color, guessing where to click, or playing a dexterity game. All visible active objects need clear hover/focus treatment and names.

The player can revisit any finished mission, experiment freely, and inspect its saved circuit. Persist the current workspace and the last selected test input. Preserve existing completion records through a canonical content-ID adapter; do not assume an old completion proves new mastery evidence that was never collected.

## The workbench as the main game

The board occupies most of the challenge screen. The target machine stays visible beside it and responds to the current output. The player's toolbox is small and contextual. Chips are visibly modular and expandable, with clear input/output direction and named ports. High signals have both a visual state and a numeric value; low signals remain legible rather than disappearing into darkness.

Four reusable tools make the environment feel like a game while teaching engineering habits:

- **Inspect:** select any port, wire, or chip to see its value, role, and local explanation.
- **Trace:** follow a signal from an input through the circuit, with visible branch relationships.
- **Step:** evaluate a combinational circuit in a pedagogical sequence. This is a visualization of dependency evaluation, not a claim about physical gate timing.
- **Test:** run the contract, inspect failing cases, and jump directly to their input states.

Always include undo/redo, disconnect, clear-board with confirmation, and a recovery path for invalid wiring. Fan-out should be supported and visually understandable. Fan-in to one input is invalid unless a component explicitly provides it. Reject or diagnose cycles clearly; the current combinational-logic chapter does not need to introduce sequential state through accidental feedback.

Formal HDL remains reachable. A later bidirectional HDL/visual view can show that the playful circuit is a real specification, but it requires a genuine shared model and parser. Do not fake synchronization in a prototype or silently discard constructs the visual editor cannot represent. For the first prototype, clearly choose and implement one authoritative editing model.

## Mastery, rewards, and replay

Completion and mastery are distinct. **Built** means the circuit passes its required cases. **Applied** means the player has used the concept in a fresh context. Hints do not disqualify either; the relevant evidence is the resulting behavior and transfer.

Rewards should reinforce competence: a reusable chip, a changed machine, newly available systems, cosmetic workshop pieces, a growing collection of the player's own designs. Keep XP secondary if used at all. The world should not pretend a five-minute interaction produces broad professional expertise.

No hearts, energy limits, mandatory streaks, punitive countdowns, or public failure boards. Optional timed challenges can appear after mastery with unlimited ordinary practice still available. Skipping celebratory animation, muting audio, reducing motion, and choosing a quieter visual mode must not reduce progress.

Players can ask for help in three useful levels: a restatement of the contract, a concept clue attached to the failing case, and an inspectable worked example. Worked examples should be labeled; the following transfer task changes the context so reproducing the example is not the only assessed action.

## Validation and runtime requirements

Small truth tables should be exhaustively checked: NOT has 2 rows; two-input gates 4; scalar Mux 8; scalar DMux 4. Each case must inspect every declared output. The UI may animate a single case, but completion uses the actual evaluator across all required cases.

For large buses, indiscriminate exhaustive input enumeration is impractical. Prefer compositional validation of a restricted, well-defined circuit model, complemented by targeted and generated tests. Explain whether a check is exhaustive or sampled. Include all-zero/all-one, alternating patterns, one-hot lane tests, and distinct source patterns that expose bus swapping and select-address errors. Reorder or refresh transfer cases without using randomness as the only correctness oracle.

Separate the circuit model, evaluator, test contracts, player evidence, and presentation. The same actual output must drive the truth table, wire state, machine animation, and completion result. A local prototype may store progress locally, but real accounts need durable, versioned progress and circuit saves connected to the existing auth/data layer.

## A disciplined first release

1. Build one polished world region and a complete NOT → AND loop, including incorrect circuits, test evidence, hints, part reuse, saved state, and restoration.
2. Validate the interaction with the actual source contracts and the current simulator. Confirm the mission is enjoyable before adding campaign surface area.
3. Expand to OR/XOR using the same tools and contracts; add Mux/DMux once their executable path is verified.
4. Import the existing introduction/background into contextual notebook entries, retaining canonical content identity and direct access.
5. Add bus/multi-way systems only when their model, editor, and validators work. Treat the final district systems check as new authored synthesis content.

Useful validation observations: Can a first-time player discover the objective without reading a tutorial page? Can they explain why a failing case fails? Can they intentionally repair it? Can they build the same function in a new setting? Can a keyboard-only player complete the same work? Does returning after several days reveal the next useful action immediately?

## Pitfalls to avoid

- A conventional lesson list covered with XP, gemstones, and a map. The actual problem-solving interaction must change.
- A spectacular world selector with an ordinary embedded article as the main activity.
- Lore that teaches the wrong abstraction, such as treating a single binary signal as stored power or a combinational gate as a memory element.
- Rewarding one lucky input state. Every small gate requires all truth cases.
- A large empty world, unimplemented playable-looking nodes, or promises of a CPU campaign unsupported by current content.
- Drag-only wiring, color-only signal values, mandatory movement, tiny ports, or animation that obscures state.
- Testing a hidden hardcoded solution while showing an unrelated editable board. The player’s actual graph must determine the outcome.

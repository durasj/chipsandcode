# Chips and Code: one interface, from signals up

## The experience

The original chip/code mark and indigo identity remain. A computer is the subject of the experience, not a fictional map. The landing begins “Break down the magic of computers. By building your own.” Native scrolling separates a recognizable laptop into physical components, moves into its processor, and reveals binary signals. The closing section connects those signals back to gates, circuits, computers, and code.

The animation is continuous and scroll-driven. It adds no timeline controls or autoplay loop. Mobile and reduced-motion views use the same visual phases as static illustrations. Deep surfaces use explicit light text; the pale conclusion uses explicit dark text and a dark focus ring. Meaningful signal strokes and control boundaries must remain legible, including inactive states.

## Navigation and routing

Every page shares **Learn, Tools, About**, the original brand mark, and a small footer. There is no parallel legacy interface, theme menu, or account dropdown.

| Destination | Behavior |
| --- | --- |
| `/` | Computer disassembly story and one primary learning action |
| `/learn` | Starts or resumes the guided learning sequence |
| `/learn/reference/...` | Complete corrected explanations in the same design |
| `/tools` | Hardware simulator, Boolean functions, buses and routing |
| `/tools/hardware-simulator[/id]` | Free-form HDL simulation and saved/example experiments |
| `/tools/boolean-functions` | Truth tables, canonical expressions, equivalence, NAND HDL |
| `/tools/buses` | Multi-bit gates and multi-way routing |
| `/about` | Purpose, research, credits, and device storage explanation |

Existing `/experiment/hardware-ide[/id]` and `/learn/hardware/...` URLs redirect to their canonical counterparts. Experiment IDs, API paths, and ownership checks remain unchanged. `/signin` redirects to the explanation of anonymous sessions on About; there is no unsupported sign-in flow.

## Foundational learning

A new learner first operates one binary signal. A supplied NOT gate shows the opposite output, then a supplied AND gate demonstrates the two-input condition. NAND follows as AND with an inverted result. The learner observes each input combination before continuing.

The NAND conclusion explains why this primitive matters. Tying its inputs creates NOT; combining NANDs creates AND and OR; those operations can express arbitrary Boolean functions. Deeper theory is optional. Opening the full explanation after completing observations preserves the observation state without awarding construction credit.

Six construction exercises follow in dependency order: NOT, AND, OR, XOR, Mux, DMux. Instructions follow the actual first circuit: add a gate, select a source, connect both inputs, connect the output, test. Additional incomplete parts are identified explicitly rather than leaving the learner with a hidden test action.

A circuit passes only when every truth-table case matches, including both DMux outputs. A passing test becomes one Continue action. Invalid or edited code invalidates the prior result. Saved progress resumes at the earliest unfinished exercise, while verified chips can be reopened.

## Visual and code

Visual, Code, and Split are representations of one circuit, not separate simulators. The guided workspace uses the existing HDL parser and circuit runtime, with a deliberately bounded scalar, feed-forward model. Valid supported HDL updates the graph; visual edits update the HDL. Invalid source remains editable across views and reloads, and blocks stale verification.

Connections, hints, signal history, and detailed test results open on request. Direct pin wiring and labeled connection menus both work with the keyboard. Opening the short reference keeps the current learning component mounted, so inputs, drafts, and results survive the detour.

Progress and drafts are local to the current browser. The simulator has its existing server-backed anonymous experiment sharing; this is separate from learning-progress synchronization.

## Complete existing material

The source contains one Boolean logic chapter. Its introduction, background, project, and next-steps text are adapted into complete reading with source corrections and attribution. The short reference links to the relevant full sections. Buses and multi-way selectors now have executable models in Tools rather than being described only as future work.

The Boolean-function lab covers all sixteen two-input functions, editable truth tables, canonical sums of products, equivalence checks, and real NAND-only HDL. Each generated function is exercised through the existing parser and simulator for all four input cases in unit tests.

The bus lab implements Not16, And16, Or16, Mux16, Or8Way, Mux4Way16, Mux8Way16, DMux4Way, and DMux8Way. Inputs accept validated decimal, hexadecimal, or binary; each view shows actual computed values and selector behavior. These are dedicated combinational models. They do not add general bus support, clocked state, RAM, CPU, or assembly execution to the HDL engine.

The Hardware simulator retains Monaco editing, tests, output comparisons, pin inspection, examples, local drafts, shared experiments, and ZIP download within the same design. Invalid HDL clears stale tests and outputs. Saving a bundled example creates a new experiment. Edits made while a save is pending remain visibly unsaved when the earlier response arrives.

## Accessibility and verification

Use native controls, visible keyboard focus, values alongside color, explicit readable palettes, and bounded horizontal scrolling for code/diagrams. All public routes share the same navigation. The scroll story has a static equivalent, and the optional film has captions and a transcript.

Verification covers types, simulator/model tests, builds, existing editing/sharing flows, the novice sequence, reference detours, redirects, mobile layouts, and accessibility checks without global color-contrast exclusions. Automated checks complement visual and keyboard review; they do not certify every assistive-technology combination.

## Boundaries

Arithmetic, clocked memory, processor architecture, machine/assembly tools, and higher-level software have no source chapters yet and remain future work. The optional 48-second film introduces that wider journey; its current master is silent. Do not imply those layers are already playable or the film is narrated.

See [source coverage](content-audit.md), [visual direction](art-direction.md), and [film production](intro-production.md).

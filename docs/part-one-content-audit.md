# Part I reference coverage

This revision extends the existing Boolean logic explanations through Nand2Tetris Project 6. The new prose is an original adaptation of the official public chapter PDFs and project contracts, preserving author attribution and the explanatory content's CC BY-NC-SA 3.0 license. Official software fixtures have their own MIT license and retained source headers; the website-content license is not applied indiscriminately to those files.

Detailed source URLs and specification nuances are recorded in `docs/part-one-sources.md`. Every new article also links its official project page, chapter PDF, and project files.

## Reference and learning coverage

| Project | Canonical full explanation               | Concepts and construction contracts                                                                                                                                                                                                                                    | Guided chapter                 |
| ------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1       | `/learn/reference/boolean-logic/project` | Existing scalar gates plus Not16, And16, Or16, Mux16, Or8Way, Mux4Way16, Mux8Way16, DMux4Way, DMux8Way; bus width versus number of alternatives                                                                                                                        | `/learn/path/buses`            |
| 2       | `/learn/reference/boolean-arithmetic`    | Place value; unsigned and signed words; two's complement; carry; wraparound; HalfAdder, FullAdder, Add16, Inc16; six-stage ALU control and all 18 documented functions; final zr/ng flags                                                                              | `/learn/path/arithmetic`       |
| 3       | `/learn/reference/memory`                | DFF primitive; current versus next state; tick/tock; simultaneous updates; Bit, Register, all five RAM sizes; bank/address decomposition; clocked writes and combinational reads; PC priority and wrapping                                                             | `/learn/path/memory`           |
| 4       | `/learn/reference/machine-language`      | A/D/M/PC; separate ROM and data space; both instruction formats; every comp and jump code; destination bits; old-A semantics; addressing; labels and variables; memory-mapped screen and keyboard; Mult and Fill contracts/testing                                     | `/learn/path/machine-language` |
| 5       | `/learn/reference/computer-architecture` | Stored programs; Harvard-style memory separation; Memory/CPU/Computer interfaces; complete valid memory map; data path and control path; reset; simultaneous destination writes; ROM integration; isolated CPU and whole-machine verification                          | `/learn/path/architecture`     |
| 6       | `/learn/reference/assembler`             | File formats; parsing; source locations; complete instruction encoding; predefined symbols; label versus variable addresses; two passes and forward references; allocation order; module design; diagnostic boundaries; official Add/Max/Rect/Pong comparison strategy | `/learn/path/assembler`        |

`/learn/reference/meta/what-next` distinguishes the guided lesson scope, which ends at Project 6, from the available tools. The VM emulator (`/tools/vm`), Jack compiler (`/tools/compiler`), and bitmap editor (`/tools/bitmap`) support exploration of later software layers; Projects 7–12 are linked to the official course rather than presented as local lessons.

## Meaning preserved across interfaces

- The scalar visual workbench remains a separate introductory representation. Its previously supplied primitive equivalents are not described as automatic exports of the learner's own chip definitions.
- The new chip builder supports explicit HDL dependencies and bounded TST script execution with optional CMP comparison. Reading links distinguish exploration of a built-in behavioral model from validation of the learner's construction.
- Clocked examples distinguish observing old state after tick from committing captured state at tock. They do not describe a sequential loop of register writes as simultaneous hardware behavior.
- The CPU reset pin resets the PC, not all RAM. A tool's fresh-machine control is not presented as the same contract.
- A-instructions cannot write D or RAM or take jumps; their literal bits must not be decoded as C-instruction control bits.
- Memory writes and jump targets in a C-instruction use the pre-update A register, including simultaneous A destinations.
- The screen occupies 8192 16-bit words, with bit 0 at the left of each word. KBD is read-only; addresses above it are not usable extra RAM.
- ALU flags describe the wrapped 16-bit result. A sign test on subtraction is not claimed to implement every signed comparison when overflow is possible.
- The assembler's symbol table records addresses, not data values. Labels count emitted ROM instructions, while new variables receive RAM addresses starting at 16.
- Official fixtures use both MD and DM destination ordering; the reference explains equivalent unique destination sets.
- The prose gives contracts, construction reasoning, and small instructional fragments. It does not publish complete Mult, Fill, CPU, or assembler student-assignment source solutions.

## Integration

The existing Markdoc loader discovers new source documents via its recursive glob; no loader exception or legacy page was added. `referencePages` supplies continuous previous/next navigation and the existing closed chapter-picker disclosure. The full-text page's metadata and eyebrow now apply to all computer layers rather than only logic.

The two existing Boolean logic overview/project pages were amended only to remove obsolete statements that arithmetic, memory, CPU, or assembler chapters were unavailable and to link the new continuation. Established explanations and attribution remain.

Verification of the executable course and engines belongs to their unit and browser suites. This map records curriculum coverage and source fidelity; it is not a claim that prose alone completes the original construction assignments.

# Topic choices and transparent recommendations

Decision for [#49](https://github.com/durasj/chipsandcode/issues/49), stacked on revamp [#47](https://github.com/durasj/chipsandcode/pull/47), inspected at `17da6ded505c6859ce2adc955a1ef750680fbcf2`. Sources reviewed 15 November 2026.

## The problem in this course

The signal introduction is deliberately guided. Gate missions previously resumed at the first unchecked gate; only verified gates could be reopened. Projects 1–6 already allowed task selection, but there was no direct gate/topic entry, no shared view of progress, and no way to express that a topic was familiar or that help was needed. Construction checks establish that a particular answer meets its modeled specification. They do not establish retention, independent reasoning, or transfer to a new task.

## Alternatives and evidence

| Approach                           | Benefit                                                                            | Cost / uncertainty                                                                                            | Decision                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Self-selected starting topic       | Experienced learners bypass familiar material; beginners retain the original entry | Self-reports can be mistaken                                                                                  | Add optional topic navigation, explicit skips, and recovery links             |
| Optional diagnostic questions      | Could identify narrower gaps before a project                                      | Needs validated questions, variants and explanations; a short quiz could overstate understanding              | Defer a separate placement test                                               |
| Challenge-first entry              | Existing circuit/assembly checks offer useful, immediate task-specific evidence    | One construction can be copied or solved with help; success does not verify all prerequisites                 | Offer existing synthesis tasks, without crediting earlier tasks               |
| Automatic performance placement    | Could respond without requiring feedback                                           | Current data cannot reliably distinguish misconceptions from exploration, editor errors or outside experience | Use verified task IDs to suggest unfinished work, never infer learner ability |
| Permanent beginner/advanced tracks | Simple presentation                                                                | Knowledge varies by topic and labels impede recovery                                                          | Keep preferences per topic                                                    |

[Khan Academy's Course and Unit Mastery](https://support.khanacademy.org/hc/en-us/articles/115002552631-What-are-Course-and-Unit-Mastery) is a useful comparison: it distinguishes skill-level evidence and reports how activities affect progress. Its multi-level mastery system depends on assessment activities that this course does not have. We borrow topic-level granularity and visible evidence, not its ratings or thresholds.

[Carnegie Mellon's learning principles](https://www.cmu.edu/teaching/principles/learning.html) describe the importance of prior knowledge, component skills followed by integration, targeted feedback and learner self-monitoring. These support our choice to expose prerequisite refreshers, smaller practice steps and synthesis tasks. This is a design inference, not evidence that these particular rules improve circuit-learning outcomes.

## Chosen interaction

- `/learn` still starts immediately with the signal. There is no onboarding question or compulsory assessment.
- **Choose a topic** is a closed, keyboard-operable disclosure near the top of Learn, the path, and each project. It exposes nine topics through the assembler. Direct links accept stable mission/task IDs; ordinary step controls update the URL so reload/back restores the selected work. Unrecognized IDs safely fall back to normal progress.
- **Adjust this topic** is a closed disclosure near the work, also available at gate milestones. It does not interrupt every edit, test, hint or successful action. Closing it dismisses the interaction and restores focus. Feedback remains changeable at any time.
- **Too easy** offers an existing synthesis challenge in the same topic. If that challenge is current/already checked, it offers the next unfinished, unskipped topic. Nothing navigates automatically.
- **About right** offers the first unchecked activity in this topic, then the next available topic.
- **Need more help** exposes a task-specific hint and offers the smaller first activity. This also reverses a previous skip. Full explanations and relevant prerequisite activities remain linked.
- **Familiar? Skip this topic** records a learner choice, keeps earlier work accessible and excludes that topic from forward suggestions. It never adds verified tasks or observed intro steps. Reset one topic or all learning choices without touching work.

| Topic                             | More challenge             | More help / focused starting point                                   |
| --------------------------------- | -------------------------- | -------------------------------------------------------------------- |
| Signals, NOT and AND observations | Begin gate construction    | Signal switch and first-gate observations                            |
| Logic gates                       | XOR composition            | NAND behavior; current construction hint                             |
| Routing                           | Demultiplexor construction | Multiplexor and logic-gate refreshers                                |
| Words and buses                   | Eight-way demultiplexor    | Single-bit inversion applied to a word                               |
| Arithmetic                        | ALU control                | Half adder, gates and buses                                          |
| Memory                            | Program counter            | One stored bit, routing and buses                                    |
| Machine language                  | Keyboard-to-screen program | Decode an instruction, arithmetic and memory                         |
| Architecture                      | Complete Computer          | Memory interface, arithmetic, memory and machine-language refreshers |
| Assembler                         | Implement an assembler     | Encode a computation, machine-language refresher                     |

“Harder” means combining more existing ideas, not reducing explanation access or imposing stricter verification. “Easier” means a smaller construction and an immediately available hint, not lowering the correctness requirement. Visual/Code/Split preferences and all six tool types are unchanged. New task variants are not necessary for voluntary challenge entry; variants and multiple independent demonstrations would be necessary before claiming measured mastery.

## Signals, uncertainty and dependencies

`model.ts` is a pure, deterministic ruleset. Its inputs are stable topic/task IDs, explicit topic feedback/skips, checked task IDs, and the existing observed-introduction flag. There are no learner timestamps, elapsed/completion/dwell times, inactivity, hint counts, failed attempts or editor errors. Simulator clocks and assembler safety timeouts continue to function independently.

Topic prerequisites are explicit in `topics.ts`, including hardware branches: memory depends on routing/buses rather than requiring arithmetic, and the assembler depends on machine language rather than every hardware construction. Incomplete prerequisite activities remain listed as optional refreshers even when skipped by choice. A skip is not proof of understanding, nor is absence of a checked task proof of a gap. The UI says what has been checked here and uses “suggestion,” never a mastery score.

Default suggestions resume unfinished work. Completing every activity permits suggesting the next topic; this describes activity completion only. One pass affects only that task. One failure or use of help cannot demote the learner, lock navigation or change their stated preference.

## State, migration and failure handling

The new `chipsandcode.learning-choices.v1` payload contains only `{ version: 1, topics: { [topicId]: { feedback?, skipped? } } }`. Familiarity is recorded only as the learner's explicit skip, not as an assessment score. Feedback is a separate field and does not imply familiarity. Unknown topics/values, invalid JSON and unsupported versions are ignored. There is no account, network request, analytics or new backend.

Existing completion/draft keys are retained:

- Gate progress: `chipsandcode.progress.v1`, with `chipsandcode.signal-isles.progress.v1` fallback.
- Intro observations: `chipsandcode.signal-intro.v1`; pre-existing NAND progress with no intro flag retains the revamp's legacy inference that the introduction has been seen. A newly checked NAND reached through direct entry stores `not-observed` when the introduction was not explored, preventing that historical fallback from crediting skipped observations. Actually exploring the introduction replaces it with `complete`.
- Gate drafts: `chipsandcode:workbench:draft:<mission>:v2`, with the existing legacy draft reader.
- Project progress and drafts: `chipsandcode.part-one.progress.v1` and `chipsandcode.part-one.draft.<chapter>/<task>`.

An additive evidence reader joins these views without rewriting old work. Current in-memory task completions are included immediately. A small storage adapter caches read and written values; when local storage fails, latest drafts, progress and choices remain usable through client-side topic navigation. Failed writes never resurrect stale persisted drafts. Notices explain the limits: a full reload or closed tab can lose session-only work. Recovering storage permits subsequent writes again. Resetting choices cannot clear completion or draft keys.

Each save/reset also emits the browser event `chipsandcode:learning-choices-changed` with the same versioned payload in `event.detail`. Optional visual-journey consumers can update immediately without importing this feature; the payload includes session-only changes when storage writes fail. No completion, draft or timing data is included.

## Verification and limits

Unit coverage exercises novice defaults, skips without credit, challenge/help/normal rules, topic-specific uncertainty, prerequisites, resets, schema validation, old-store reads, failed storage and unchanged recommendations under radically different clocks and unrelated metadata. Browser coverage adds direct and repeated task navigation, recovery with saved drafts, feedback changes/reload, legacy progress, denied storage, keyboard controls, 320px layouts and accessibility checks. The existing full learner/tool suites remain required.

This first version makes controllable, explainable recommendations. It does not claim accurate personalization or learning effectiveness. Follow-up learner testing should examine whether people find the controls, whether synthesis steps are suitable, whether suggested prerequisites are useful, and whether beginners retain their approachable entry. Any future diagnostic/mastery feature needs independent task variants, misconception evidence, and evaluation with learners before introducing scoring.

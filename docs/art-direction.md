# Chips and Code: visual direction

## Identity

Use the original Chips and Code logo assets and indigo `#4f46e5`. The product remains Chips and Code. The redesign should feel precise, capable, and intriguing: an interactive machine that exposes its structure. Technical details are part of the visual identity, not decorative text scattered over a generic game skin.

## A page made of computer layers

The original homepage question—“Wondering how computers work?”—leads the experience. Keep its promise: build from chips to code, with no prerequisites, free in the browser. Avoid introducing HDL, chip selection, test controls, and progress statistics before the visitor has begun.

The homepage follows native scrolling through a dark logic foundation toward light software. A sticky technical diagram changes with the current layer and moves at different rates from its supporting planes. Each section adds one idea and one short explanation. Mobile and reduced-motion layouts keep static diagrams next to their descriptions. Do not hijack scrolling, require animation, or add chapter tabs, playback buttons, or timecodes.

Use one prominent learning action in the opening, repeated at the conclusion. Both enter the same foundational learning flow. Keep navigation in one quiet menu and the separate 48-second introduction behind a text link at the end. Its media production and narration status remain documented in [intro production](intro-production.md).

Connected traces, registers, instruction patterns, and code should explain the current layer. Make the dependency from simple to complex legible. The later layers show the intended journey; a concise availability note explains that logic is playable today. Animation must follow scrolling and support the explanation, not compete with it.

The result should feel closer to a schematic, instrument panel, or software development environment than a miniature landscape. Avoid fictional place names, collectible gems, mascots, scenery, and unrelated reward metaphors.

## Palette and material

| Role                  | Color     |
| --------------------- | --------- |
| Deep background       | `#0b0d14` |
| Working surface       | `#12151f` |
| Primary text          | `#f0f0f7` |
| Secondary text        | `#a1a5b6` |
| Dividers              | `#303446` |
| Original brand        | `#4f46e5` |
| Bright signal / focus | `#a79fff` |

Use restrained indigo illumination against dark neutral surfaces. Higher stack layers introduce pale surfaces as a meaningful shift in abstraction. Keep the workbench low-glare and high-contrast. Active signals must include readable `0`/`1` values and names; glow alone is insufficient.

Small corner radii, fine borders, deliberate spacing, and flat technical controls keep the interface coherent. Avoid oversized rounded cards or ornamental skeuomorphism. Let visual depth concentrate in the hero and explanatory diagrams, with working panels remaining visually stable.

## Typography

Use the same clean sans-serif family throughout navigation, instructions, and the reference, with strong but restrained headline scale. Body and instructional copy should be readable at ordinary viewing distances; avoid shrinking labels to fit redundant content. Use monospace for code, pin names, binary values, layer numbers, and compact instrument labels. Prefer concrete terms—signals, gates, interface, test, verify—to fictional mission language.

## Workbench

Reveal tools as their purpose becomes clear. The first screen has one signal switch. The next introduces two NAND inputs and asks the learner to read one output at a time. The first constructed chip provides a concrete next instruction based on its current wiring.

The editable circuit and HDL remain peers. Start a new workspace in Visual mode and offer Code or Split through one compact selector; retain an existing preference. Split view shows the relationship between a pin assignment and a wire without shrinking either into a decorative inset. Preserve readable single-view options on narrow screens.

Present the chip contract once, make direct wiring the main construction action, and keep alternate connection menus in a disclosure. Test evidence appears when testing is relevant. Put signal analysis, hints, and explanations behind explicit secondary actions. A verified circuit has one save action. Invalid code is an ordinary, recoverable state with a concise diagnostic.

## Reference

The reference uses the same dark technical surfaces and indigo selection states. The interactive models keep signals, expressions, and truth-table rows connected. Use source examples and diagrams without pretending they are new construction levels. Preserve the original source links and licensing.

## Accessibility and responsiveness

Native controls provide the signal switches, view selection, disclosures, video controls, and wiring actions. Visible labels should match their accessible names. Focus must remain obvious on dark and light surfaces. Numerical and textual state accompany color. Responsive layouts must work at 320px without making the entire page overflow; a clearly bounded code or schematic surface may scroll internally.

Animations should explain selection or a real signal state. Honor reduced motion and keep sound optional. No decorative motion should compete with reading code or tracing a connection.

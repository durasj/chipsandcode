# The Signal Isles — visual direction

A miniature archipelago of machines comes to life as the player learns to build logic from NAND. The map foregrounds places and their state. Existing explanations remain available as a field guide at the workbench.

## Implemented station map

The map uses an exact `1200 × 720` SVG coordinate system. Each station has a real HTML button over separately rendered SVG art. The callback returns the stable curriculum identifier; `completed` changes light and power states, while `selected` changes the selected location and label.

| Order | ID | Label | Place / interaction idea | Center |
| --- | --- | --- | --- | --- |
| 01 | nand | The spark | Origin generator; discover NAND by manipulating inputs | 178, 500 |
| 02 | not | Flip the signal | Inverter tower; flip a signal using NAND | 354, 340 |
| 03 | and | Better together | Paired generators; activate only when both inputs are high | 536, 510 |
| 04 | or | Another way | Radio receiver; receive either input | 716, 355 |
| 05 | xor | One or the other | Paired observatory; distinguish exactly one active input | 1002, 505 |
| 06 | mux | Choose a path | Router workshop; use a selector to route one input | 988, 210 |
| 07 | dmux | Send it onward | Signal depot; route an input to a chosen output | 675, 145 |

The beacon at 219,177 is a non-playable landmark, not an extra curriculum item. Small ferries, buoys, vegetation, copper traces, contour lines, and land strata provide art density without claiming extra playable content.

## Materials and color

Ink-blue sea `#10212d`, raised cream instruments `#f4eedf`, dark instrument text `#172839`, copper `#ee9255`, mint power `#7bd9b5`, warm muted land, and subdued gray-green inactive structures. Mint is meaningful: it indicates a live signal or restored place. Selection uses warm cream and copper. Functional circuits should use precise geometry and verified state rather than painted or generated connections.

Use readable sans-serif interface type, with monospace confined to short instrument readings, numbering, and code. Pair the miniature world with generous typography in the surrounding shell. Avoid an XP dashboard, lesson-card wall, or constant glowing sci-fi borders.

## Desktop and mobile

On desktop, let the map dominate. The shell should put a concise current objective beside or over its edge and expose one obvious action into the selected workshop. The map is intentionally compatible with a right-hand mission panel, but labels remain inside the art rather than becoming a list of course cards.

At narrow widths, the map keeps its readable miniature scale and scrolls horizontally. A compact set of real station buttons beneath it provides immediate access to every location without requiring spatial panning. Portrait workbenches should use a full-width machine, bottom tool tray, reachable Test action, and instrument details in a sheet. Drag interactions must also support select-then-tap and keyboard controls.

## Motion and sound

Completed locations illuminate and power their outbound cable. Cable animation follows its actual path. Selection changes local emphasis; controls move by only a couple of pixels. Respect `prefers-reduced-motion`; the map already stops current animation and transitions. Restoring a location can add a brief local power-on sequence in the owning game shell. Do not animate the whole map continuously or let decorative movement compete with a task.

Sound should be optional and remembered: soft contact clicks, relay ticks, and a short restoration tone. The map itself emits no audio.

## Scope

This art establishes a visual wrapper for the verified first-week gate sequence. It does not imply that later multi-bit, arithmetic, memory, or computer-building exercises already exist. Progress must be derived from actual game state; the component never completes or unlocks a station itself.

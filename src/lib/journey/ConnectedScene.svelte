<script lang="ts">
  import type { JourneyStep } from './data';
  import type { ConnectedDiagram, DiagramNode, DiagramEdge, Side } from './schematicTypes';
  export let step: JourneyStep;
  export let diagram: ConnectedDiagram;
  export let verified = false;
  function titleLines(value: string, width: number) {
    const limit = width < 400 ? 25 : 52;
    const lines = [''];
    for (const word of value.split(' ')) {
      if (lines.at(-1)!.length + word.length + 1 > limit) lines.push(word);
      else lines[lines.length - 1] += (lines.at(-1) ? ' ' : '') + word;
    }
    return lines;
  }
  $: titles = titleLines(step.label, diagram.width);
  const point = (node: DiagramNode, side: Side, offset = 0): [number, number] =>
    side === 'left'
      ? [node.x, node.y + node.h / 2 + offset]
      : side === 'right'
        ? [node.x + node.w, node.y + node.h / 2 + offset]
        : side === 'top'
          ? [node.x + node.w / 2 + offset, node.y]
          : [node.x + node.w / 2 + offset, node.y + node.h];
  function wire(edge: DiagramEdge, model: ConnectedDiagram) {
    const from = model.nodes.find((node) => node.id === edge.from)!;
    const to = model.nodes.find((node) => node.id === edge.to)!;
    const horizontal = Math.abs(from.y - to.y) < 25;
    const fromSide =
      edge.fromSide ??
      (horizontal ? (from.x < to.x ? 'right' : 'left') : from.y < to.y ? 'bottom' : 'top');
    const toSide =
      edge.toSide ??
      (horizontal ? (from.x < to.x ? 'left' : 'right') : from.y < to.y ? 'top' : 'bottom');
    const start = point(from, fromSide, edge.fromOffset),
      end = point(to, toSide, edge.toOffset);
    const middle =
      edge.via ??
      (horizontal
        ? [
            [(start[0] + end[0]) / 2, start[1]],
            [(start[0] + end[0]) / 2, end[1]],
          ]
        : [
            [start[0], (start[1] + end[1]) / 2],
            [end[0], (start[1] + end[1]) / 2],
          ]);
    const points = [start, ...middle, end] as [number, number][];
    const previous = points[points.length - 2];
    const angle = Math.atan2(end[1] - previous[1], end[0] - previous[0]);
    const arrow = `M${end[0] - 7 * Math.cos(angle - 0.45)} ${end[1] - 7 * Math.sin(angle - 0.45)}L${end[0]} ${end[1]}L${end[0] - 7 * Math.cos(angle + 0.45)} ${end[1] - 7 * Math.sin(angle + 0.45)}`;
    return {
      path: points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' '),
      arrow,
      label: edge.labelAt ?? [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 - 7],
    };
  }
</script>

<svg
  class="schematic connected-schematic"
  viewBox={`0 0 ${diagram.width} ${diagram.height}`}
  role="img"
  aria-label={`${step.label}: ${step.change}`}
>
  <title>{step.label} — connected conceptual composition</title>
  <desc
    >{step.prior}
    {step.change}
    {step.next} Arrows label the movement of data or control; supplied parts are identified.</desc
  >
  <rect
    class="component-outline"
    class:verified
    x="10"
    y="15"
    width={diagram.width - 20}
    height={diagram.height - 30}
    rx="8"
  />
  {#each titles as line, i (i)}<text
      x={diagram.width / 2}
      y={titles.length > 1 ? 36 + i * 21 : 48}
      class="component-title">{line}</text
    >{/each}
  {#each diagram.edges as edge, i (i)}
    {@const line = wire(edge, diagram)}
    <path d={line.path} class="connection" />
    <path d={line.arrow} class="arrow" />
    {#if edge.label}<text x={line.label[0]} y={line.label[1]} class="wire-label">{edge.label}</text
      >{/if}
  {/each}
  {#each diagram.nodes as node (node.id)}
    <g
      class="node"
      class:terminal={node.kind === 'input' || node.kind === 'output'}
      class:supplied={node.kind === 'supplied'}
      class:control={node.kind === 'control'}
    >
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={node.kind === 'input' || node.kind === 'output' ? node.h / 2 : 4}
      />
      <text
        x={node.x + node.w / 2}
        y={node.y + node.h / 2 + (node.detail ? -4 : 5)}
        class="node-name">{node.label}</text
      >
      {#if node.detail}<text
          x={node.x + node.w / 2}
          y={node.y + node.h / 2 + 15}
          class="node-detail">{node.detail}</text
        >{/if}
    </g>
  {/each}
  {#each diagram.notes ?? [] as note, i (i)}<text x={note.x} y={note.y} class="diagram-note"
      >{note.text}</text
    >{/each}
</svg>

<style>
  .schematic {
    display: block;
    width: 100%;
    height: auto;
    font-family: ui-monospace, monospace;
  }
  text {
    text-anchor: middle;
    fill: #dedaf0;
  }
  .component-outline {
    fill: #0d111c;
    stroke: #62687d;
  }
  .component-outline.verified {
    stroke: #b2a7ff;
  }
  .component-title {
    font-size: 17px;
  }
  .connection,
  .arrow {
    fill: none;
    stroke: #a193c8;
    stroke-width: 1.6;
  }
  .wire-label {
    font-size: 11px;
    fill: #d0c1f2;
    paint-order: stroke;
    stroke: #0d111c;
    stroke-width: 5px;
    stroke-linejoin: round;
  }
  .node rect {
    fill: #1c2236;
    stroke: #a294c9;
    stroke-width: 1;
  }
  .node.terminal rect {
    fill: #121b2a;
    stroke: #8494b9;
  }
  .node.supplied rect {
    stroke-dasharray: 4 3;
  }
  .node.control rect {
    fill: #2b2340;
  }
  .node-name {
    font-size: 14px;
  }
  .node-detail,
  .diagram-note {
    font-size: 11px;
    fill: #bdc4d9;
  }
</style>

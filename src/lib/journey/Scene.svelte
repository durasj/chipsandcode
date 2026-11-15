<script lang="ts">
  import { onMount } from 'svelte';
  import type { JourneyStep } from './data';
  import { systemEvidence } from './system';
  import ConnectedScene from './ConnectedScene.svelte';
  import { basicDiagram } from './basicDiagrams';
  import { advancedDiagram } from './advancedDiagrams';
  export let step: JourneyStep;
  export let outside = false;
  export let verified = false;
  export let completed: string[] = [];
  $: progress = systemEvidence(completed);
  export let live: Record<string, number | boolean> = {};
  let small = false;
  onMount(() => {
    const media = matchMedia('(max-width: 600px)');
    const update = () => {
      small = media.matches;
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  });
  $: width = small ? 300 : 780;
  $: detailed = !connected ? (basicDiagram(step, small) ?? advancedDiagram(step, small)) : null;
  $: height = connected
    ? small
      ? 520
      : 420
    : small
      ? step.diagram === 'parallel'
        ? 655
        : 440
      : 340;
  $: gridCount =
    step.diagram === 'parallel' ? 16 : step.diagram === 'bank' ? (step.count === 16384 ? 4 : 8) : 0;
  $: columns = small ? 2 : 8;
  $: cellWidth = (width - 80) / columns;
  $: software = ['instruction', 'loop', 'encode', 'symbols', 'translator'].includes(step.diagram);
  $: connected = outside || ['devices', 'computer'].includes(step.diagram);
  $: activeModule =
    step.id === 'architecture/computer'
      ? 'Computer'
      : step.id === 'memory/pc'
        ? 'CPU'
        : step.layer === 'arithmetic'
          ? 'ALU'
          : step.layer === 'memory' || step.id === 'architecture/memory'
            ? 'Memory'
            : step.layer === 'assembler' || step.layer === 'machine-language'
              ? 'ROM'
              : step.id === 'architecture/cpu'
                ? 'CPU'
                : 'Logic';
  $: modules = small
    ? [
        { label: 'ROM', sub: 'supplied · program words', x: 20, y: 40, w: 110, h: 60 },
        { label: 'CPU', sub: 'A · D · PC · control', x: 170, y: 40, w: 110, h: 60 },
        { label: 'Logic', sub: 'gates → word paths', x: 20, y: 165, w: 110, h: 60 },
        { label: 'ALU', sub: 'inside the CPU', x: 170, y: 165, w: 110, h: 60 },
        { label: 'Keyboard', sub: 'supplied · 24576', x: 20, y: 345, w: 110, h: 60 },
        { label: 'Memory', sub: 'RAM + device map', x: 170, y: 270, w: 110, h: 60 },
        { label: 'Screen', sub: 'supplied · pixels', x: 170, y: 365, w: 110, h: 60 },
      ]
    : [
        { label: 'ROM', sub: 'supplied · program words', x: 40, y: 35, w: 155, h: 65 },
        { label: 'CPU', sub: 'A · D · PC · control', x: 310, y: 35, w: 160, h: 65 },
        { label: 'Logic', sub: 'gates → word paths', x: 40, y: 180, w: 155, h: 65 },
        { label: 'ALU', sub: 'inside the CPU', x: 310, y: 180, w: 160, h: 65 },
        { label: 'Keyboard', sub: 'supplied · 24576', x: 590, y: 35, w: 155, h: 65 },
        { label: 'Memory', sub: 'RAM + device map', x: 590, y: 150, w: 155, h: 65 },
        { label: 'Screen', sub: 'supplied · pixels', x: 590, y: 265, w: 155, h: 65 },
      ];
  $: systemEdges = [
    ['ROM', 'CPU'],
    ['Logic', 'ALU'],
    ['ALU', 'CPU'],
    ['CPU', 'Memory'],
    ['Keyboard', 'Memory'],
    ['Memory', 'Screen'],
  ].map(([a, b]) => {
    const start = modules.find((item) => item.label === a)!,
      end = modules.find((item) => item.label === b)!;
    if (start.x === end.x)
      return `M${start.x + start.w / 2} ${start.y + (start.y < end.y ? start.h : 0)}V${end.y + (start.y < end.y ? 0 : end.h)}`;
    return `M${start.x + start.w} ${start.y + start.h / 2}H${(start.x + start.w + end.x) / 2}V${end.y + end.h / 2}H${end.x}`;
  });
  $: parts = step.parts;
</script>

{#if detailed}
  <ConnectedScene {step} diagram={detailed} {verified} />
{:else}
  <svg
    viewBox={`0 0 ${width} ${height}`}
    class="schematic"
    role="img"
    aria-label={`${step.label}: ${outside ? 'place in the connected computer' : step.change}`}
  >
    <title>{step.label} — {outside ? 'Place in the computer' : 'Conceptual composition'}</title>
    <desc
      >{step.prior}
      {step.change}
      {step.next} Screen and Keyboard are supplied devices. Connections show functional relationships,
      not physical scale.</desc
    >
    {#if connected}
      <rect
        x="8"
        y="8"
        width={width - 16}
        height={height - 37}
        rx="15"
        class="computer-frame"
        class:system-current={step.id === 'architecture/computer'}
      />
      <text x="22" y="28" class="frame-title">COMPUTER</text>
      <path
        d={`M${width / 2 - 52} ${height - 29}V${height - 12}M${width / 2 + 52} ${height - 29}V${height - 12}M${width / 2 - 88} ${height - 10}H${width / 2 + 88}`}
        class="computer-stand"
      />
      <rect
        x={small ? 160 : 292}
        y="18"
        width={small ? 130 : 195}
        height={small ? 222 : 245}
        rx="9"
        class="cpu-boundary"
      />
      <g class="connections"
        >{#each systemEdges as path (path)}<path d={path} />{/each}</g
      >
      {#each modules as item (item.label)}
        {@const earned = progress[item.label]?.count ?? 0}
        {@const total = progress[item.label]?.total ?? 0}
        {@const focused = item.label === activeModule}
        {@const keepPiece =
          focused &&
          !software &&
          step.id !== 'architecture/computer' &&
          step.label !== item.label &&
          step.label.length < 19}
        {@const device = item.label === 'Screen' || item.label === 'Keyboard'}
        <g
          class="module"
          class:active={focused ||
            (step.id === 'architecture/computer' && ['CPU', 'ROM', 'Memory'].includes(item.label))}
          class:earned={earned > 0}
          class:unbuilt={!earned && !device}
          data-system-module={item.label}
          data-evidence-count={earned}
        >
          <rect x={item.x} y={item.y} width={item.w} height={item.h} rx="5" />
          {#if keepPiece}
            <text x={item.x + item.w / 2} y={item.y + 13} class="node-detail"
              >{item.label} · reusable piece</text
            >
            <g class="preserved-piece"
              ><rect x={item.x + 10} y={item.y + 21} width={item.w - 20} height="28" rx="3" />
              <text x={item.x + item.w / 2} y={item.y + 40} class="node-name">{step.label}</text></g
            >
          {:else if device}
            {#if item.label === 'Screen'}
              <rect
                x={item.x + item.w / 2 - 30}
                y={item.y + 8}
                width="60"
                height="28"
                rx="2"
                class="device-display"
              />
              <path
                d={`M${item.x + item.w / 2 - 12} ${item.y + 40}H${item.x + item.w / 2 + 12}`}
                class="connections"
              />
            {:else}
              {#each Array.from({ length: 12 }, (_, i) => i) as i (i)}<rect
                  x={item.x + item.w / 2 - 36 + (i % 6) * 12}
                  y={item.y + 10 + Math.floor(i / 6) * 13}
                  width="9"
                  height="9"
                  rx="1"
                  class="device-key"
                />{/each}
            {/if}
            <text x={item.x + item.w / 2} y={item.y + 55} class="node-detail"
              >{item.label}{small ? '' : ' · supplied'}</text
            >
          {:else}
            <text x={item.x + item.w / 2} y={item.y + 27} class="node-name">{item.label}</text>
            <text x={item.x + item.w / 2} y={item.y + 46} class="node-detail"
              >{earned
                ? progress[item.label].pieces.slice(small ? -1 : -2).join(' · ')
                : small
                  ? ({
                      ROM: 'program words',
                      CPU: 'A · D · PC',
                      Logic: 'gates / words',
                      ALU: 'inside CPU',
                      Memory: 'RAM / devices',
                    }[item.label] ?? item.sub)
                  : item.sub}</text
            >
          {/if}
          {#if total}<text x={item.x + item.w / 2} y={item.y + item.h + 15} class="evidence-label"
              >{earned
                ? small
                  ? `${earned}/${total} steps`
                  : `${earned}/${total} steps explored / verified`
                : small
                  ? 'not verified'
                  : 'not verified here'}</text
            >{/if}
          {#if device && small}<text
              x={item.x + item.w / 2}
              y={item.y + item.h + 15}
              class="node-detail">supplied</text
            >{/if}
        </g>
      {/each}
      {#if !small}<text x="388" y="290" class="relationship">Arithmetic + state meet here.</text
        ><text x="388" y="310" class="node-detail">The program directs reads and writes.</text>{/if}
      <text x={small ? width / 2 : 250} y={height - 52} class="system-legend"
        >{small
          ? software
            ? 'Source → words → ROM → execution'
            : 'Dashed = not verified here.'
          : software
            ? 'Source → encoded words → ROM → execution'
            : 'Your verified pieces accumulate here. Dashed outlines are not verified.'}</text
      >
    {:else}
      <rect
        x="16"
        y="18"
        width={width - 32}
        height={height - 36}
        rx="8"
        class="component-outline"
        class:verified
      />
      <text x={width / 2} y="47" class="component-name">{step.label}</text>
      {#if step.diagram === 'signal'}
        <path d={`M70 ${height / 2}H${width - 70}`} class="signal-path" class:high={!!live.in} />
        <circle cx="70" cy={height / 2} r="28" class="signal-terminal" class:high={!!live.in} />
        <circle
          cx={width - 70}
          cy={height / 2}
          r="28"
          class="signal-terminal"
          class:high={!!live.out}
        />
        <text x="70" y={height / 2 + 6} class="bit-value">{Number(live.in ?? 0)}</text>
        <text x={width - 70} y={height / 2 + 6} class="bit-value">{Number(live.out ?? 0)}</text>
        <text x={width / 2} y={height / 2 - 45} class="node-detail"
          >one wire · two possible values</text
        >
        <text x={width / 2} y={height / 2 + 70} class="relationship"
          >A value, carried from input to output.</text
        >
      {:else if gridCount}
        <text x={width / 2} y="78" class="node-detail grid-caption"
          >{step.diagram === 'parallel'
            ? small
              ? '16 independent bit lanes'
              : 'Same operation · independent bit positions'
            : `${step.count?.toLocaleString('en-US')} words · select bank + word`}</text
        >
        {#each Array.from({ length: gridCount }, (_, i) => i) as i (i)}
          {@const x = 40 + (i % columns) * cellWidth}
          {@const y = 105 + Math.floor(i / columns) * (small ? 58 : 67)}
          <path d={`M${x + cellWidth / 2 - 4} ${y - 12}V${y}`} class="connections" />
          <rect {x} {y} width={cellWidth - 8} height="42" rx="3" class="part" />
          <path d={`M${x + (cellWidth - 8) / 2} ${y + 42}V${y + 50}`} class="connections" />
          <text x={x + (cellWidth - 8) / 2} y={y + 17} class="tile-label">{step.parts[0]}</text>
          <text x={x + (cellWidth - 8) / 2} y={y + 33} class="tile-index"
            >{step.diagram === 'parallel' ? `bit ${i}` : `bank ${i}`}</text
          >
        {/each}
        <text x={width / 2} y={height - 55} class="relationship"
          >{step.diagram === 'bank'
            ? 'load routes down · selected data returns'
            : step.id === 'memory/register'
              ? 'shared load + clock · one stored word'
              : step.id === 'buses/mux16'
                ? 'one shared selector · sixteen data paths'
                : 'No carry between these lanes.'}</text
        >
      {:else if ['select', 'distribute', 'reduce'].includes(step.diagram)}
        {@const reverse = step.diagram === 'distribute'}
        {@const count = step.count ?? 8}
        {@const leafX = reverse ? width - 65 : 65}
        {@const rootX = reverse ? 65 : width - 65}
        {@const top = 100}
        {@const span = height - 160}
        {#each Array.from({ length: count }, (_, i) => i) as i (i)}
          {@const y = top + (i * span) / (count - 1)}
          <path d={`M${leafX} ${y}H${width / 2}V${height / 2 + 15}H${rootX}`} class="connections" />
          <circle cx={leafX} cy={y} r="15" class="part" />
          <text x={leafX} y={y + 4} class="tile-label"
            >{i.toString(2).padStart(Math.log2(count), '0')}</text
          >
        {/each}
        <rect x={width / 2 - 45} y={height / 2 - 10} width="90" height="50" rx="4" class="part" />
        <text x={width / 2} y={height / 2 + 11} class="node-name"
          >{step.diagram === 'reduce' ? 'OR tree' : 'routing'}</text
        >
        <text x={width / 2} y={height / 2 + 28} class="tile-index"
          >{step.diagram === 'reduce' ? 'any high?' : `${Math.log2(count)} select bits`}</text
        >
        <circle cx={rootX} cy={height / 2 + 15} r="17" class="signal-terminal" />
        <text x={rootX} y={height / 2 + 19} class="tile-label">{reverse ? 'in' : 'out'}</text>
        <text x={width / 2} y={height - 30} class="node-detail"
          >{reverse
            ? 'one input → selected destination'
            : step.diagram === 'reduce'
              ? 'many input bits → one answer'
              : 'selected input → one output'}</text
        >
      {:else if step.diagram === 'instruction' || step.diagram === 'encode'}
        <text x={width / 2} y="95" class="code-text"
          >{step.diagram === 'instruction'
            ? 'Source: @21; D=A'
            : 'Source: @7; D=A; @3; D=D+A'}</text
        >
        <path d={`M${width / 2} 114V145`} class="connections" />
        {#each ['111', '0 110000', '010', '000'] as word, i (i)}
          {@const x = small ? 20 + (i % 2) * 140 : 85 + i * 155}
          {@const y = small ? 160 + Math.floor(i / 2) * 75 : 155}
          <rect {x} {y} width={small ? 130 : 150} height="48" rx="4" class="part" />
          <text x={x + (small ? 65 : 75)} y={y + 28} class="code-text">{word}</text>
          <text x={x + (small ? 65 : 75)} y={y + 65} class="node-detail"
            >{['C instruction', 'computation', 'destination', 'jump'][i]}</text
          >
        {/each}
        <text x={width / 2} y={height - 40} class="relationship">D=A becomes 1110110000010000</text>
      {:else if step.diagram === 'adder' && step.count === 16}
        {#each ['bit 0', 'bit 1', '…', 'bit 15'] as bit, i (i)}
          {@const x = small ? 55 : 65 + i * 175}
          {@const y = small ? 85 + i * 78 : 125}
          <rect {x} {y} width={small ? 190 : 145} height="55" class="part" rx="4" />
          <text x={x + (small ? 95 : 72)} y={y + 23} class="node-name">{bit}</text>
          <text x={x + (small ? 95 : 72)} y={y + 43} class="node-detail">FullAdder</text>
          {#if i < 3}<path
              d={small ? `M${width / 2} ${y + 55}V${y + 78}` : `M${x + 145} 152H${x + 175}`}
              class="connections"
            />{/if}
        {/each}
        <text x={width / 2} y={height - 30} class="relationship"
          >Carry moves toward the higher bit.</text
        >
      {:else if step.diagram === 'address'}
        {#each [['0–16383', 'RAM16K', 'read / write'], ['16384–24575', 'Screen · supplied', 'read / write → pixels'], ['24576', 'Keyboard · supplied', 'read only']] as region, i (i)}
          {@const y = small ? 105 + i * 90 : 95 + i * 64}
          <rect x="35" {y} width={width - 70} height={small ? 76 : 54} rx="4" class="part" />
          <text x={small ? width / 2 : 160} y={y + 23} class="code-text">{region[0]}</text>
          <text x={small ? width / 2 : width / 2} y={y + (small ? 43 : 23)} class="node-name"
            >{region[1]}</text
          >
          <text x={small ? width / 2 : width - 160} y={y + (small ? 62 : 23)} class="node-detail"
            >{region[2]}</text
          >
        {/each}
        <text x={width / 2} y={height - 30} class="relationship"
          >Address decode selects one region.</text
        >
      {:else if step.diagram === 'cpu'}
        {#each ['A register', 'D register', 'ALU', 'PC + jump control'] as part, i (i)}
          {@const x = small ? 65 : 95 + (i % 2) * 320}
          {@const y = small ? 90 + i * 68 : 95 + Math.floor(i / 2) * 110}
          <rect {x} {y} width={small ? 230 : 270} height="52" rx="4" class="part" />
          <text x={x + (small ? 115 : 135)} y={y + 31} class="node-name">{part}</text>
          {#if i < 3}<path
              d={small ? `M180 ${y + 52}V${y + 68}` : `M${x + 135} ${y + 52}V${y + 77}`}
              class="connections"
            />{/if}
        {/each}
        <text x={width / 2} y={height - 30} class="relationship"
          >Instruction → calculation · destinations · next PC</text
        >
      {:else if step.diagram === 'state'}
        <path
          d={`M35 ${height / 2}H${width / 2 - 80}M${width / 2 + 80} ${height / 2}H${width - 35}M${width - 55} ${height / 2}V${height - 85}H${width / 2 - 100}V${height / 2 + 20}H${width / 2 - 80}`}
          class="connections"
        />
        <rect x={width / 2 - 80} y={height / 2 - 40} width="160" height="80" rx="4" class="part" />
        <text x={width / 2} y={height / 2 - 10} class="node-name">Mux → DFF</text>
        <text x={width / 2} y={height / 2 + 16} class="node-detail">choose → capture</text>
        <text x={width / 2} y="95" class="relationship">load + clock</text>
        <text x={width / 2} y={height - 57} class="node-detail"
          >feedback keeps the stored value</text
        >
        <text x={width / 2} y={height - 37} class="node-detail"
          >DFF is supplied · state changes at the edge</text
        >
      {:else}
        {#each parts as part, i (i)}
          {@const cols = small ? 1 : Math.min(3, parts.length)}
          {@const w = small ? 230 : 185}
          {@const x = small ? 65 : (width - cols * w - (cols - 1) * 22) / 2 + (i % cols) * (w + 22)}
          {@const y = 100 + Math.floor(i / cols) * (small ? 63 : 85)}
          <rect {x} {y} width={w} height="48" rx="4" class="part" />
          <text x={x + w / 2} y={y + 29} class="node-name">{part}</text>
          {#if i < parts.length - 1}<path
              d={small ? `M${width / 2} ${y + 48}V${y + 63}` : `M${x + w / 2} ${y + 48}V${y + 61}`}
              class="connections"
            />{/if}
        {/each}
        <text x={width / 2} y={height - 60} class="relationship"
          >{software
            ? 'A representation of work the machine executes.'
            : step.diagram === 'counter'
              ? 'reset → load → increment → hold'
              : step.diagram === 'alu'
                ? 'control bits → chosen result + zero / negative flags'
                : 'Reusable parts, connected by signals.'}</text
        >
        <text x={width / 2} y={height - 35} class="node-detail"
          >{software
            ? 'Software runs on the computer; it is not an outer hardware layer.'
            : `${step.inputs.join(', ')} → ${step.outputs.join(', ')}`}</text
        >
      {/if}
    {/if}
  </svg>
{/if}

<style>
  .schematic {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
    font-family: ui-monospace, monospace;
  }
  text {
    fill: #d7d8e8;
    text-anchor: middle;
  }
  .frame-title {
    text-anchor: start;
    font-size: 10px;
    fill: #b2a6cf;
  }
  .computer-frame.system-current {
    stroke: #c4b5fd;
  }
  .computer-frame {
    fill: #0d111b;
    stroke: #51586e;
    stroke-width: 2;
  }
  .computer-stand {
    fill: none;
    stroke: #51586e;
    stroke-width: 3;
  }
  .module.unbuilt > rect {
    fill: #101522;
    stroke-dasharray: 4 4;
  }
  .module.earned > rect {
    fill: #28213e;
    stroke: #a092cb;
  }
  .module .preserved-piece rect {
    fill: #3b2d58;
    stroke: #d5c4ff;
    stroke-width: 1.5;
  }
  .module .device-display {
    fill: #d7daea;
    stroke: #707994;
  }
  .module .device-key {
    fill: #41445c;
    stroke: #9294b4;
  }
  .evidence-label {
    fill: #beb5d6;
    font-size: 8px;
  }
  .system-legend {
    fill: #bbb4ce;
    font-size: 9px;
  }
  :global(.revealing) .preserved-piece {
    transform-box: fill-box;
    transform-origin: center;
    animation: preserve-piece 0.65s cubic-bezier(0.2, 0.7, 0.3, 1) both;
  }
  @keyframes preserve-piece {
    from {
      transform: scale(1.7);
    }
    to {
      transform: scale(1);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(.revealing) .preserved-piece {
      animation: none;
    }
  }
  .cpu-boundary {
    fill: #1c182c55;
    stroke: #65587d;
    stroke-dasharray: 4 4;
  }
  .component-outline {
    fill: #0d111c;
    stroke: #414862;
    stroke-width: 1;
  }
  .component-outline.verified {
    stroke: #b2a7ff;
  }
  .component-name {
    font-size: 17px;
    fill: #f3f0ff;
  }
  .connections,
  .connections path {
    fill: none;
    stroke: #6a668f;
    stroke-width: 1.7;
  }
  .part {
    fill: #1b2034;
    stroke: #8d83c3;
    stroke-width: 1;
  }
  .node-name {
    font-size: 13px;
  }
  .node-detail {
    font-size: 10px;
    fill: #b4bbce;
  }
  .tile-label {
    font-size: 10px;
  }
  .tile-index {
    font-size: 9px;
    fill: #b4bbce;
  }
  .code-text {
    font-size: 13px;
    fill: #d7cbff;
  }
  .relationship {
    font-size: 11px;
    fill: #c1b9e4;
  }
  .signal-path {
    stroke: #535d76;
    stroke-width: 3;
  }
  .signal-terminal {
    fill: #1b2034;
    stroke: #8b83b5;
  }
  .signal-path.high {
    stroke: #c4b5fd;
  }
  .signal-terminal.high {
    fill: #6d5bd3;
    stroke: #ddd3ff;
  }
  .bit-value {
    font-size: 21px;
    fill: #fff;
  }
  .module rect {
    fill: #151a29;
    stroke: #4b526b;
    stroke-width: 1;
  }
  .module.active rect {
    fill: #27203e;
    stroke: #c4b5fd;
    stroke-width: 2;
  }
  .module.active .node-name {
    fill: #ede4ff;
  }
  @media (max-width: 600px) {
    .node-name {
      font-size: 15px;
    }
    .node-detail {
      font-size: 12px;
    }
    .relationship {
      font-size: 12px;
    }
    .tile-label {
      font-size: 14px;
    }
    .tile-index {
      font-size: 11px;
    }
    .grid-caption {
      font-size: 12px;
    }
    .evidence-label,
    .system-legend {
      font-size: 11px;
    }
  }
</style>

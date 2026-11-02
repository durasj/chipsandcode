<script lang="ts">
  export let layer = 0;
  export let travel = 0;
  export let reducedMotion = false;

  const descriptions = [
    'Signals and logic: two states, zero and one.',
    'Arithmetic: three plus one becomes four, or binary 0100.',
    'Memory: a register stores the value 0100 between clock edges.',
    'Architecture: computation, memory, and control work together as a computer.',
    'Software: a small function adds three and one and returns four.',
  ];
  $: drift = reducedMotion ? 0 : travel;
</script>

<svg
  class="layer-scene"
  viewBox="0 0 720 550"
  role="img"
  aria-label={descriptions[layer]}
  data-scene={layer}
>
  <g class="supporting-layers" aria-hidden="true">
    {#each Array.from({ length: layer + 1 }) as _, index}
      <path
        d="M60 352 290 226 662 358 432 494Z"
        transform={`translate(0,${index * -20 + drift * (index + 1) * -7})`}
        fill="currentColor"
        fill-opacity=".012"
        stroke="currentColor"
        stroke-opacity={0.09 + index * 0.025}
        stroke-width="1"
      />
    {/each}
  </g>
  <g class="main-diagram" transform={`translate(0,${drift * -36})`}>
    {#if layer === 0}
      <path class="faint" d="M94 286H626M94 170V330M626 170V330" />
      <path class="signal" d="M94 286H210V204H386V286H510V204H626" />
      <circle cx="210" cy="204" r="5" class="signal-point" />
      <circle cx="386" cy="286" r="5" class="signal-point" />
      <text x="144" y="254" class="large-bit">0</text>
      <text x="288" y="169" class="large-bit">1</text>
      <text x="444" y="254" class="large-bit">0</text>
      <text x="561" y="169" class="large-bit">1</text>
      <text x="360" y="377" class="diagram-note" text-anchor="middle"
        >Two states. A single bit.</text
      >
    {:else if layer === 1}
      <g class="addition">
        <text x="178" y="168" class="operator">3</text>
        <text x="508" y="168" class="binary" text-anchor="end">0011</text>
        <text x="126" y="244" class="operator">+</text>
        <text x="178" y="244" class="operator">1</text>
        <text x="508" y="244" class="binary" text-anchor="end">0001</text>
        <path class="faint" d="M126 277H551" />
        <text x="178" y="348" class="operator result">4</text>
        <text x="508" y="348" class="binary result" text-anchor="end">0100</text>
      </g>
      <text x="360" y="404" class="diagram-note" text-anchor="middle">Gates become an adder.</text>
    {:else if layer === 2}
      <path class="faint" d="M78 216H156M564 216H642" />
      <g>
        {#each ['0', '1', '0', '0'] as bit, index}
          <rect x={156 + index * 102} y="168" width="102" height="96" class="register-cell" />
          <text
            x={207 + index * 102}
            y="230"
            class="stored-bit"
            class:result={bit === '1'}
            text-anchor="middle">{bit}</text
          >
        {/each}
      </g>
      <path class="faint" d="M156 329H223V301H274V329H376V301H427V329H564" />
      <path class="clock-edge" d="M223 287V342" />
      <text x="360" y="394" class="diagram-note" text-anchor="middle"
        >A value held between clock edges.</text
      >
    {:else if layer === 3}
      <rect x="182" y="100" width="352" height="280" rx="3" class="computer-outline" />
      <text x="207" y="132" class="small-label">CPU</text>
      <rect x="218" y="159" width="116" height="80" rx="2" class="component-box" />
      <text x="276" y="205" class="component-name" text-anchor="middle">ALU</text>
      <rect x="376" y="159" width="122" height="80" rx="2" class="component-box" />
      <text x="437" y="205" class="component-name" text-anchor="middle">Registers</text>
      <rect x="218" y="284" width="280" height="62" rx="2" class="component-box" />
      <text x="358" y="321" class="component-name" text-anchor="middle">Control</text>
      <path class="signal" d="M334 198H376M276 239V284M437 239V284" />
      <path class="signal" d="M534 198H591V315H628" />
      <path class="faint" d="M591 198V119H628" />
      <text x="634" y="124" class="small-label">IN</text>
      <text x="634" y="320" class="small-label">OUT</text>
      <path class="signal" d="M358 380V408H126V234H182" />
      <rect x="72" y="148" width="108" height="70" rx="2" class="component-box" />
      <text x="126" y="188" class="component-name" text-anchor="middle">Memory</text>
      <path class="faint" d="M126 218V234" />
    {:else}
      <path class="faint" d="M103 131H588M103 365H588" />
      <g class="source-code">
        <text x="118" y="190"
          ><tspan class="result">function</tspan> add(a, b) {String.fromCharCode(123)}</text
        >
        <text x="118" y="229"> <tspan class="result">return</tspan> a + b;</text>
        <text x="118" y="268">{String.fromCharCode(125)}</text>
        <text x="118" y="329">add(3, 1);</text>
      </g>
      <text x="553" y="330" class="answer" text-anchor="end">4</text>
      <text x="360" y="412" class="diagram-note" text-anchor="middle"
        >The same signals. A new way to think.</text
      >
    {/if}
  </g>
</svg>

<style>
  .layer-scene {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
    color: var(--story-ink, #f6f5ff);
  }
  .faint,
  .signal,
  .clock-edge {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
  }
  .faint {
    stroke-opacity: 0.28;
  }
  .signal {
    stroke: var(--story-accent, #b3aaff);
    stroke-width: 2;
  }
  .signal-point {
    fill: var(--story-accent, #b3aaff);
  }
  .large-bit {
    fill: currentColor;
    font:
      48px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    text-anchor: middle;
  }
  .diagram-note {
    fill: currentColor;
    font:
      14px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .operator {
    fill: currentColor;
    font:
      34px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .binary {
    fill: currentColor;
    font:
      46px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.14em;
  }
  .result {
    fill: var(--story-accent, #b3aaff);
  }
  .register-cell {
    fill: none;
    stroke: currentColor;
    stroke-opacity: 0.45;
  }
  .stored-bit {
    fill: currentColor;
    font:
      41px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .clock-edge {
    stroke: var(--story-accent, #b3aaff);
    stroke-width: 3;
  }
  .computer-outline {
    fill: none;
    stroke: currentColor;
    stroke-opacity: 0.35;
  }
  .component-box {
    fill: var(--story-bg, #080a11);
    stroke: currentColor;
    stroke-opacity: 0.6;
  }
  .component-name {
    fill: currentColor;
    font:
      17px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .small-label {
    fill: currentColor;
    font:
      13px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.08em;
  }
  .source-code {
    fill: currentColor;
    font:
      22px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    white-space: pre;
  }
  .answer {
    fill: var(--story-accent, #4f46e5);
    font:
      54px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
</style>

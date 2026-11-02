<script lang="ts">
  import { computerLayers, type ComputerLayerId } from './layers';

  export let completed: string[] = [];
  export let selected = 'nand';
  export let onselect: (id: string) => void;
  export let selectedLayer: string = 'logic';
  export let onlayerselect: ((id: ComputerLayerId) => void) | undefined = undefined;

  const descendingLayers = [...computerLayers].reverse();
  const gates = [
    { id: 'nand', name: 'NAND', role: 'primitive' },
    { id: 'not', name: 'NOT', role: 'inverter' },
    { id: 'and', name: 'AND', role: 'conjunction' },
    { id: 'or', name: 'OR', role: 'disjunction' },
    { id: 'xor', name: 'XOR', role: 'difference' },
    { id: 'mux', name: 'Mux', role: 'selector' },
    { id: 'dmux', name: 'DMux', role: 'router' },
  ];
  const plateFills = ['#e4e4f5', '#9898bf', '#515478', '#262b47', '#101421'];
  const plateEdges = ['#b0b1cc', '#6b6e92', '#373e61', '#202843', '#242b43'];
  const circuitInks = ['#55528b', '#333958', '#b2b3d6', '#a3a5d0', '#958cff'];
  $: verifiedCount = gates.filter((gate) => completed.includes(gate.id)).length;

  function chooseLayer(id: ComputerLayerId) {
    onlayerselect?.(id);
  }
</script>

<div class="computer-stack">
  <div class="stack-index" aria-hidden="true">
    <span>THE COMPUTER, UNFOLDED</span>
    <span>00 — 04</span>
  </div>
  <div class="stack-stage">
    <svg class="stack-art" viewBox="0 0 650 720" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="stack-axis" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#eeedff" stop-opacity=".6" />
          <stop offset=".5" stop-color="#8981ed" stop-opacity=".4" />
          <stop offset="1" stop-color="#4f46e5" stop-opacity=".7" />
        </linearGradient>
        <radialGradient id="stack-glow">
          <stop stop-color="#4f46e5" stop-opacity=".17" />
          <stop offset="1" stop-color="#4f46e5" stop-opacity="0" />
        </radialGradient>
        <filter id="stack-shadow" x="-30%" y="-60%" width="180%" height="240%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <pattern id="stack-grid" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M36 0H0V36" stroke="#686588" stroke-opacity=".075" />
        </pattern>
      </defs>
      <rect width="650" height="720" fill="url(#stack-grid)" />
      <ellipse cx="280" cy="560" rx="300" ry="210" fill="url(#stack-glow)" />
      <path d="M295 27V662" stroke="url(#stack-axis)" stroke-width="1.5" stroke-dasharray="3 8" />
      <path
        d="M75 130V610M515 130V610"
        stroke="#8e87c0"
        stroke-opacity=".16"
        stroke-dasharray="3 7"
      />
      <path d="M50 650L280 582 540 660" stroke="#65617d" stroke-opacity=".23" />
      <path d="M85 675L295 612 510 675" stroke="#65617d" stroke-opacity=".15" />
      <!-- Draw from bottom upward so each abstraction sits visibly above its foundation. -->
      {#each [...descendingLayers].reverse() as layer}
        {@const index = descendingLayers.findIndex((item) => item.id === layer.id)}
        {@const offset = 25 + index * 113}
        <g
          class="stack-plate"
          class:active-plate={selectedLayer === layer.id}
          transform={`translate(0 ${offset})`}
          style={`--plate-ink:${circuitInks[index]}`}
        >
          <path
            d="M65 100L294 29 531 100 303 173Z"
            fill="#040610"
            opacity=".6"
            filter="url(#stack-shadow)"
          />
          <path d="M65 83L300 155V174L65 102Z" fill={plateEdges[index]} />
          <path d="M300 155L535 83V102L300 174Z" fill={plateEdges[index]} opacity=".7" />
          <path
            class="plate-top"
            d="M65 83L300 11 535 83 300 155Z"
            fill={plateFills[index]}
            stroke={plateEdges[index]}
            stroke-width="1.3"
          />
          <path
            class="plate-highlight"
            d="M65 102L300 174 535 102"
            stroke="#8980ff"
            stroke-width="2"
          />
          <g
            transform="matrix(.94 .285 -.94 .285 300 27)"
            stroke={circuitInks[index]}
            stroke-width="2.1"
          >
            {#if layer.id === 'software'}
              <rect
                x="12"
                y="12"
                width="180"
                height="180"
                rx="3"
                fill="#f8f7ff"
                fill-opacity=".45"
                stroke-opacity=".4"
              />
              <path d="M12 42H192" stroke-opacity=".35" />
              <circle cx="26" cy="27" r="3" fill={circuitInks[index]} stroke="none" />
              <circle
                cx="38"
                cy="27"
                r="3"
                fill={circuitInks[index]}
                fill-opacity=".5"
                stroke="none"
              />
              <path
                d="M32 65H58M68 65H114M44 86H72M82 86H151M44 107H105M115 107H165M44 128H67M77 128H120M32 149H56"
                stroke-width="5"
                stroke-linecap="square"
                stroke-opacity=".75"
              />
              <path d="M148 154L159 165 148 176M137 154L126 165 137 176" stroke-width="3" />
            {:else if layer.id === 'architecture'}
              <path
                d="M0 40H58V66M142 66V40H200M0 165H58V140M142 140V165H200M25 0V23H82V61M178 0V23H120V61M25 202V185H82V145M178 202V185H120V145"
                stroke-opacity=".5"
              />
              <rect
                x="55"
                y="55"
                width="96"
                height="96"
                rx="2"
                fill={circuitInks[index]}
                fill-opacity=".08"
                stroke-width="3"
              />
              <rect x="68" y="68" width="70" height="70" stroke-opacity=".45" />
              {#each [74, 90, 106, 122] as pin}
                <path
                  d={`M${pin} 44V54M${pin} 152V163M44 ${pin}H54M152 ${pin}H163`}
                  stroke-width="4"
                />
              {/each}
              <path d="M83 96H121M83 108H110" stroke-width="6" />
              <circle cx="190" cy="40" r="4" fill={circuitInks[index]} />
            {:else if layer.id === 'memory'}
              <path d="M11 95H193M11 108H193M11 121H193" stroke-opacity=".35" />
              {#each [15, 75, 135] as x}
                {#each [20, 140] as y}
                  <rect
                    {x}
                    {y}
                    width="46"
                    height="52"
                    rx="2"
                    fill={circuitInks[index]}
                    fill-opacity=".1"
                  />
                  <path
                    d={`M${x + 8} ${y + 17}H${x + 38}M${x + 8} ${y + 27}H${x + 38}M${x + 8} ${y + 37}H${x + 24}`}
                    stroke-opacity=".5"
                  />
                  <path
                    d={`M${x + 13} ${y - 7}V${y}M${x + 33} ${y - 7}V${y}M${x + 13} ${y + 52}V${y + 59}M${x + 33} ${y + 52}V${y + 59}`}
                    stroke-width="3"
                  />
                {/each}
              {/each}
            {:else if layer.id === 'arithmetic'}
              <path
                d="M7 53H49M7 153H49M148 53H197M148 153H197M99 6V49M99 151V197"
                stroke-opacity=".6"
              />
              <path
                d="M51 37L100 65 149 37V166L100 139 51 166Z"
                fill={circuitInks[index]}
                fill-opacity=".07"
                stroke-width="2.5"
              />
              <path d="M82 102H118M100 84V120" stroke-width="5" />
              <path
                d="M12 43V63M22 43V63M12 143V163M22 143V163M175 43V63M185 43V63M175 143V163M185 143V163"
                stroke-opacity=".45"
              />
              <circle cx="100" cy="181" r="4" fill={circuitInks[index]} />
            {:else}
              <path
                d="M0 44H34V76H70M0 117H28V100H70M129 88H165V45H204M0 171H51V161H102M161 174H204"
                stroke-opacity=".7"
              />
              <path d="M70 65H89C133 65 133 111 89 111H70Z" fill="#211d4a" stroke-width="2.5" />
              <circle cx="125" cy="88" r="5" fill="#101421" />
              <path
                d="M102 143H124C168 143 168 190 124 190H102Z"
                fill="#211d4a"
                stroke-width="2.5"
              />
              <circle cx="157" cy="167" r="5" fill="#101421" />
              <path d="M128 88V125H83V180H102" stroke-opacity=".7" />
              {#each [[0, 44], [0, 117], [0, 171], [204, 45], [204, 174]] as point}
                <circle cx={point[0]} cy={point[1]} r="4" fill="#a49aff" stroke="none" />
              {/each}
              <path
                class="signal-flow"
                d="M0 44H34V76H70M129 88H165V45H204"
                stroke="#d1cbff"
                stroke-width="3"
                stroke-dasharray="3 70"
              />
            {/if}
          </g>
          <path
            d="M318 160L335 155M341 153L358 148M364 146L381 141"
            stroke={circuitInks[index]}
            stroke-width="2"
            opacity=".65"
          />
        </g>
      {/each}
      <g stroke="#716b9d" stroke-opacity=".45">
        {#each [129, 242, 355, 468, 581] as y}
          <path d={`M535 ${y - 21}H553L570 ${y}H625`} />
          <circle cx="535" cy={y - 21} r="2.5" fill="#9991d4" stroke="none" />
        {/each}
      </g>
    </svg>
    <nav class="layer-controls" aria-label="Computer layers">
      {#each descendingLayers as layer}
        <button
          class:chosen={selectedLayer === layer.id}
          class:available={layer.status === 'available'}
          aria-pressed={selectedLayer === layer.id}
          onclick={() => chooseLayer(layer.id)}
          data-layer={layer.id}
        >
          <span class="layer-number">{layer.number}</span>
          <span class="layer-name">{layer.title}</span>
          <span class="layer-state">{layer.status === 'available' ? 'BUILD NOW' : 'PLANNED'}</span>
        </button>
      {/each}
    </nav>
    <div class="foundation-label" aria-hidden="true">
      <span>0</span><i></i><span>1</span> EVERYTHING STARTS HERE
    </div>
  </div>
  <section class="logic-path" aria-label="Logic challenges">
    <div class="path-heading">
      <span>00 / LOGIC CIRCUITS</span>
      <span>{verifiedCount}<b>/</b>07 VERIFIED</span>
    </div>
    <nav class="gate-controls" aria-label="Logic circuits">
      {#each gates as gate, index}
        <button
          class:chosen={selected === gate.id && selectedLayer === 'logic'}
          class:verified={completed.includes(gate.id)}
          aria-pressed={selected === gate.id && selectedLayer === 'logic'}
          onclick={() => {
            chooseLayer('logic');
            onselect(gate.id);
          }}
          data-mission={gate.id}
        >
          <span class="gate-index"
            >{completed.includes(gate.id) ? '✓' : String(index + 1).padStart(2, '0')}</span
          >
          <span>{gate.name}</span>
          <span class="gate-role">{gate.role}</span>
          {#if completed.includes(gate.id)}<span class="sr-only">verified</span>{/if}
        </button>
      {/each}
    </nav>
  </section>
</div>

<style>
  .computer-stack {
    min-width: 0;
    color: #e8e7f3;
  }
  .stack-index,
  .path-heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    color: #9c99b0;
    font:
      10px/1.5 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.12em;
  }
  .stack-index {
    padding: 0 0 5px 4px;
  }
  .stack-stage {
    position: relative;
    width: 100%;
    aspect-ratio: 1.12;
    isolation: isolate;
  }
  .stack-art {
    position: absolute;
    width: 87%;
    height: 100%;
    left: -4%;
    top: 0;
    overflow: visible;
  }
  .stack-plate {
    transition: opacity 0.25s;
  }
  .plate-highlight {
    opacity: 0;
    transition: opacity 0.25s;
  }
  .active-plate .plate-highlight {
    opacity: 1;
  }
  .active-plate .plate-top {
    stroke: #a79fff;
    stroke-width: 2;
  }
  .signal-flow {
    animation: signal-travel 4s linear infinite;
  }
  .layer-controls {
    position: absolute;
    top: 9.7%;
    right: 0;
    bottom: 12.7%;
    width: 28%;
    display: grid;
    grid-template-rows: repeat(5, 1fr);
  }
  .layer-controls button {
    align-self: center;
    display: grid;
    grid-template-columns: 22px 1fr;
    text-align: left;
    gap: 2px 8px;
    min-height: 52px;
    padding: 9px 8px;
    background: #0e1019;
    border: 1px solid transparent;
    border-left-color: #38374d;
    border-radius: 0;
    color: #b8b6c8;
    cursor: pointer;
    transition:
      background 0.18s,
      border-color 0.18s;
  }
  .layer-controls button:hover {
    background: #1b1b2d;
    border-left-color: #b8afff;
    color: #f4f2ff;
  }
  .layer-controls button.chosen {
    background: #211f3a;
    color: #f4f1ff;
    border-color: #6961b3;
    border-left: 3px solid #a69aff;
    padding-left: 6px;
  }
  .layer-number {
    grid-row: span 2;
    align-self: center;
    color: #9791b3;
    font:
      10px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .layer-name {
    font-size: 12px;
    line-height: 1.4;
    font-weight: 600;
  }
  .layer-state {
    color: #9691aa;
    font:
      8px/1.5 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.1em;
  }
  .available .layer-state {
    color: #b6acff;
  }
  .foundation-label {
    position: absolute;
    bottom: 3.5%;
    left: 12%;
    display: flex;
    align-items: center;
    gap: 9px;
    color: #827c99;
    font:
      8px/1.5 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.12em;
  }
  .foundation-label span {
    color: #c3baff;
    font-size: 11px;
  }
  .foundation-label i {
    height: 1px;
    width: 21px;
    background: #7066bc;
  }
  .logic-path {
    border-top: 1px solid #2b2b3e;
    padding-top: 15px;
  }
  .path-heading {
    font-size: 9px;
    letter-spacing: 0.1em;
  }
  .path-heading b {
    color: #665f8e;
    margin: 0 4px;
    font-weight: normal;
  }
  .gate-controls {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 5px;
    margin-top: 12px;
  }
  .gate-controls button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 9px;
    min-height: 63px;
    padding: 10px 9px;
    background: #131520;
    color: #b5b6c9;
    border: 1px solid #2c2e42;
    border-radius: 3px;
    font:
      11px/1.1 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    cursor: pointer;
    transition:
      background 0.18s,
      border-color 0.18s;
  }
  .gate-controls button:hover {
    background: #24223a;
    border-color: #8e83dc;
  }
  .gate-controls button.chosen {
    background: #282244;
    color: #f1eeff;
    border-color: #9083e3;
    box-shadow: inset 0 -2px #9083e3;
  }
  .gate-controls button.verified .gate-index {
    color: #bcb3ff;
  }
  .gate-role {
    font-size: 8px;
    color: #a7a3bb;
    letter-spacing: -0.03em;
  }
  .gate-index {
    color: #9291aa;
    font-size: 9px;
  }
  button:focus-visible {
    outline: 2px solid #d0c8ff !important;
    outline-offset: 3px;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  @keyframes signal-travel {
    to {
      stroke-dashoffset: -146;
    }
  }
  @media (max-width: 520px) {
    .stack-stage {
      aspect-ratio: 0.95;
    }
    .stack-art {
      width: 94%;
      left: -12%;
    }
    .layer-controls {
      width: 33%;
      top: 10%;
      bottom: 13%;
    }
    .layer-controls button {
      grid-template-columns: 15px 1fr;
      gap: 2px 4px;
      padding: 7px 4px;
      min-height: 44px;
    }
    .layer-controls button.chosen {
      padding-left: 2px;
    }
    .layer-name {
      font-size: 10px;
    }
    .layer-number {
      font-size: 9px;
    }
    .layer-state {
      font-size: 7px;
      letter-spacing: 0.04em;
    }
    .foundation-label {
      left: 5%;
      font-size: 7px;
      gap: 5px;
    }
    .gate-role {
      font-size: 8px;
    }
    .gate-controls {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 5px;
    }
    .gate-controls button {
      padding: 9px 4px;
      font-size: 9px;
      min-height: 57px;
    }
    .path-heading,
    .stack-index {
      font-size: 8px;
      letter-spacing: 0.04em;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .signal-flow {
      animation: none;
    }
    .stack-plate,
    .plate-highlight,
    button {
      transition: none;
    }
  }
</style>

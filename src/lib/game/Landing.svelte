<script lang="ts">
  import LayerJourney from './LayerJourney.svelte';
  import { getMission, missions, truthTable, type MissionId } from './missions';

  export let completed: string[] = [];
  export let selected: MissionId = 'nand';
  export let onselect: (id: string) => void;
  export let onstart: (id: string) => void;
  export let onreference: () => void;
  export let onwatch: () => void;
  export let introOpen = false;
  export let verified: string | null = null;

  let exampleInputs: Record<string, boolean> = {};
  $: activeMission = getMission(selected);
  $: nextUnverified = missions.find((mission) => !completed.includes(mission.id));
  $: nextMission = nextUnverified ?? missions[0];
  $: example = truthTable(activeMission).find((row) =>
    activeMission.inputs.every((pin) => row.inputs[pin] === (exampleInputs[pin] ?? false)),
  )!;

  function chooseMission(id: MissionId) {
    exampleInputs = {};
    onselect(id);
  }

  function toggleExample(pin: string) {
    exampleInputs = { ...exampleInputs, [pin]: !(exampleInputs[pin] ?? false) };
  }
</script>

<div class="landing">
  <section class="hero" aria-labelledby="journey-heading">
    <div class="hero-copy">
      <h1 id="journey-heading" tabindex="-1">From signals<br />to <em>software.</em></h1>
      <p>Wire a circuit or write its HDL. See how each layer makes the next possible.</p>
      <div class="hero-actions">
        <button class="primary-button" on:click={() => onstart(nextMission.id)}
          >{completed.length ? 'Continue building' : 'Begin building'}<span aria-hidden="true"
            >↗</span
          ></button
        >
        <button class="film-button" on:click={onwatch}
          ><span class="play-icon" aria-hidden="true">▷</span> Watch the journey</button
        >
      </div>
    </div>
    <div class="hero-motion"><LayerJourney suspended={introOpen} /></div>
    <a class="explore-link" href="#layer-logic"
      ><span aria-hidden="true">↓</span> Explore the layers</a
    >
  </section>

  <section class="layer logic-layer" id="layer-logic" tabindex="-1" aria-labelledby="logic-title">
    <div class="layer-inner">
      <header class="layer-header">
        <div class="layer-label">
          <span>00</span>
          <h2 id="logic-title">Signals & logic</h2>
        </div>
        <span class="layer-progress">{completed.length} / {missions.length} CHIPS VERIFIED</span>
      </header>
      {#if verified}<p class="verified-notice" role="status">
          {verified} verified. Added to your chips.
        </p>{/if}
      <section class="challenge-selector" aria-label="Logic challenges">
        {#each missions as mission}
          <button
            data-mission={mission.id}
            class:selected={selected === mission.id}
            class:verified={completed.includes(mission.id)}
            aria-pressed={selected === mission.id}
            on:click={() => chooseMission(mission.id)}
          >
            <span class="challenge-number"
              >{completed.includes(mission.id)
                ? '✓'
                : String(mission.number).padStart(2, '0')}</span
            >
            <strong
              >{mission.chip === 'Nand'
                ? 'NAND'
                : mission.chip === 'Not'
                  ? 'NOT'
                  : mission.chip === 'And'
                    ? 'AND'
                    : mission.chip === 'Or'
                      ? 'OR'
                      : mission.chip === 'Xor'
                        ? 'XOR'
                        : mission.chip}</strong
            >
            <span class="challenge-role"
              >{mission.location === 'NAND primitive' ? 'Primitive' : mission.location}</span
            >
          </button>
        {/each}
      </section>
      <div class="logic-problem">
        <div class="problem-copy">
          <h3>{activeMission.title}</h3>
          <p>{activeMission.brief}</p>
          <div class="problem-actions">
            <button
              class="primary-button"
              on:click={() => onstart(verified && nextUnverified ? nextUnverified.id : selected)}
              >{verified && nextUnverified
                ? 'Next chip'
                : completed.includes(selected)
                  ? 'Reopen workbench'
                  : 'Build this chip'}<span aria-hidden="true">↗</span></button
            >
            <button class="reference-button" on:click={onreference}>Open reference</button>
          </div>
        </div>
        <div
          class="specification"
          role="group"
          aria-label={`${activeMission.chip} required behavior`}
        >
          <div class="specification-heading">
            <span>REQUIRED BEHAVIOR</span><span>TOGGLE AN INPUT</span>
          </div>
          <div class="specification-circuit">
            <div class="specification-inputs">
              {#each activeMission.inputs as pin}
                <button
                  class:high={exampleInputs[pin] ?? false}
                  aria-label={`Input ${pin} ${Number(exampleInputs[pin] ?? false)}`}
                  aria-pressed={exampleInputs[pin] ?? false}
                  on:click={() => toggleExample(pin)}
                  ><span>{pin}</span><strong>{Number(exampleInputs[pin] ?? false)}</strong></button
                >
              {/each}
            </div>
            <div class="specification-chip"><span>{activeMission.chip}</span></div>
            <div class="specification-outputs" aria-live="polite">
              {#each activeMission.outputs as pin}
                <div class:high={example.expected[pin]}>
                  <strong>{Number(example.expected[pin])}</strong><span>{pin}</span>
                </div>
              {/each}
            </div>
          </div>
          <p>{activeMission.goal}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="layer arithmetic-layer" id="layer-arithmetic" aria-labelledby="arithmetic-title">
    <div class="layer-inner">
      <header class="layer-header">
        <div class="layer-label">
          <span>01</span>
          <h2 id="arithmetic-title">Arithmetic</h2>
        </div>
        <span class="planned">Planned</span>
      </header>
      <div class="layer-problem">
        <div class="problem-copy">
          <h3>Add two<br />binary numbers.</h3>
          <p>Combine gates into adders. Combine adders into an arithmetic logic unit.</p>
        </div>
        <figure class="binary-addition" aria-label="Binary addition: three plus one equals four">
          <div class="binary-row">
            <span class="binary-operation"></span><span class="binary-digits"
              >000000<span class="lit-bit">11</span></span
            ><span class="decimal">3</span>
          </div>
          <div class="binary-row">
            <span class="binary-operation">+</span><span class="binary-digits"
              >0000000<span class="lit-bit">1</span></span
            ><span class="decimal">1</span>
          </div>
          <div class="binary-row binary-result">
            <span class="binary-operation">=</span><span class="binary-digits"
              >00000<span class="lit-bit">1</span>00</span
            ><span class="decimal">4</span>
          </div>
          <figcaption>Gates → adders → ALU</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="layer memory-layer" id="layer-memory" aria-labelledby="memory-title">
    <div class="layer-inner">
      <header class="layer-header">
        <div class="layer-label">
          <span>02</span>
          <h2 id="memory-title">Memory</h2>
        </div>
        <span class="planned">Planned</span>
      </header>
      <div class="layer-problem">
        <div class="problem-copy">
          <h3>Keep a value<br />when the input changes.</h3>
          <p>Introduce a clock. Store a bit, assemble registers, and give the computer a memory.</p>
        </div>
        <figure class="memory-trace">
          <svg
            viewBox="0 0 470 210"
            role="img"
            aria-label="A register takes the data input at each rising clock edge, and holds its output between edges."
          >
            <defs
              ><pattern
                id="landing-memory-grid"
                width="20"
                height="30"
                patternUnits="userSpaceOnUse"
                ><path
                  d="M20 0H0V30"
                  fill="none"
                  stroke="currentColor"
                  stroke-opacity=".07"
                /></pattern
              ></defs
            >
            <rect x="65" y="8" width="400" height="188" fill="url(#landing-memory-grid)" />
            <g class="trace-labels"
              ><text x="0" y="42">data</text><text x="0" y="108">clock</text><text x="0" y="168"
                >stored</text
              ></g
            >
            <g
              transform="translate(65 0)"
              fill="none"
              stroke-linejoin="round"
              stroke-linecap="round"
            >
              <path d="M0 48H100V24H220V48H400" class="data-trace" />
              <path d="M0 110H120V85H180V110H300V85H360V110H400" class="clock-trace" />
              <path d="M0 170H120V145H300V170H400" class="stored-trace" />
              <path d="M120 12V188M300 12V188" class="sampling-edges" />
              <circle cx="120" cy="145" r="4" class="sample-point" /><circle
                cx="300"
                cy="170"
                r="4"
                class="sample-point"
              />
            </g>
          </svg>
          <figcaption>Sample on the rising edge. Hold between edges.</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section
    class="layer architecture-layer"
    id="layer-architecture"
    aria-labelledby="architecture-title"
  >
    <div class="layer-inner">
      <header class="layer-header">
        <div class="layer-label">
          <span>03</span>
          <h2 id="architecture-title">Architecture</h2>
        </div>
        <span class="planned">Planned</span>
      </header>
      <div class="layer-problem">
        <div class="problem-copy">
          <h3>Execute<br />one instruction.</h3>
          <p>
            Connect the ALU, memory, and control. Trace how a processor turns an instruction into a
            result.
          </p>
        </div>
        <figure
          class="instruction-cycle"
          aria-label="The instruction cycle: fetch an instruction, decode it, execute it, then repeat."
        >
          <div class="cycle-line">
            <div><span>01</span><strong>Fetch</strong><small>Read instruction</small></div>
            <span class="cycle-arrow" aria-hidden="true">→</span>
            <div><span>02</span><strong>Decode</strong><small>Select operation</small></div>
            <span class="cycle-arrow" aria-hidden="true">→</span>
            <div><span>03</span><strong>Execute</strong><small>Update state</small></div>
          </div>
          <div class="cycle-return" aria-hidden="true"><span>←</span></div>
          <figcaption>A program becomes a sequence of state changes.</figcaption>
        </figure>
      </div>
    </div>
  </section>

  <section class="layer software-layer" id="layer-software" aria-labelledby="software-title">
    <div class="layer-inner">
      <header class="layer-header">
        <div class="layer-label">
          <span>04</span>
          <h2 id="software-title">Software</h2>
        </div>
        <span class="planned">Planned</span>
      </header>
      <div class="layer-problem">
        <div class="problem-copy">
          <h3>Write what<br />the machine should do.</h3>
          <p>
            Move from instructions to languages. Understand the layers beneath every line of code.
          </p>
          <button class="start-from-bottom" on:click={() => onstart(nextMission.id)}
            >Start with logic <span aria-hidden="true">↗</span></button
          >
        </div>
        <figure class="code-abstraction">
          <div class="source-line"><span class="code-keyword">let</span> total = a + b;</div>
          <div class="abstraction-axis" aria-hidden="true"><span></span><i>↓</i><span></span></div>
          <div class="abstraction-layers">
            <span>Instructions</span><i aria-hidden="true">↓</i><span>Circuits</span><i
              aria-hidden="true">↓</i
            ><span class="signal-bits">0&nbsp; 1&nbsp; 0&nbsp; 1</span>
          </div>
          <figcaption>Abstraction changes the view. The signals still do the work.</figcaption>
        </figure>
      </div>
    </div>
  </section>
</div>

<style>
  .landing {
    --indigo: #4f46e5;
    --light-indigo: #b4adff;
    color: #eeeef6;
    background: #090b11;
  }
  .landing *,
  .landing *::before,
  .landing *::after {
    box-sizing: border-box;
  }
  button,
  a {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  button {
    cursor: pointer;
    font-family: inherit;
  }
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid #aaa4ff !important;
    outline-offset: 5px;
  }
  .hero {
    max-width: 1480px;
    margin: auto;
    padding: 56px 4% 32px;
    display: grid;
    grid-template-columns: minmax(280px, 0.82fr) minmax(0, 1.45fr);
    gap: 28px 5%;
    align-items: center;
  }
  .hero-copy {
    min-width: 0;
  }
  h1 {
    font-size: clamp(42px, 4.6vw, 68px);
    font-weight: 500;
    line-height: 1.04;
    letter-spacing: -0.055em;
    margin: 0;
  }
  h1 em {
    font-style: normal;
    color: #b4adff;
  }
  .hero-copy > p {
    font-size: 14px;
    line-height: 1.8;
    color: #a8adbf;
    max-width: 310px;
    margin: 22px 0 28px;
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 9px 18px;
  }
  .primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    min-height: 46px;
    padding: 12px 16px;
    border: 1px solid #6d63ff;
    border-radius: 3px;
    background: #4f46e5;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    transition: background 0.15s;
  }
  .primary-button:hover {
    background: #6258ef;
  }
  .primary-button > span {
    font-size: 18px;
    font-weight: 400;
  }
  .film-button {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 10px 0;
    min-height: 44px;
    color: #d3d3e3;
    font-size: 11px;
    white-space: nowrap;
  }
  .film-button:hover {
    color: white;
  }
  .play-icon {
    display: grid;
    place-items: center;
    height: 25px;
    width: 25px;
    border: 1px solid #4c4b68;
    border-radius: 50%;
    font:
      16px ui-monospace,
      monospace;
    padding-left: 2px;
    color: #b4adff;
  }
  .hero-motion {
    min-width: 0;
    --journey-height: 420px;
  }
  .explore-link {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 12px;
    width: fit-content;
    min-height: 44px;
    font:
      9px ui-monospace,
      SFMono-Regular,
      monospace;
    text-transform: uppercase;
    letter-spacing: 1.3px;
    color: #a8adbf;
    text-decoration: none;
  }
  .explore-link > span {
    color: #b4adff;
    font-size: 17px;
  }
  .layer {
    border-top: 1px solid var(--layer-line);
    background: var(--layer-bg);
    color: var(--layer-text);
    scroll-margin-top: 20px;
  }
  .layer:focus {
    outline: none !important;
  }
  .software-layer button:focus-visible {
    outline-color: #4f46e5 !important;
  }
  .layer-inner {
    max-width: 1380px;
    margin: auto;
    padding: 34px 5% 64px;
  }
  .layer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-bottom: 27px;
  }
  .layer-label {
    display: flex;
    align-items: baseline;
    gap: 20px;
  }
  .layer-label > span {
    font:
      10px ui-monospace,
      SFMono-Regular,
      monospace;
    color: var(--layer-muted);
    letter-spacing: 1px;
  }
  .layer-label h2 {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
    letter-spacing: -0.2px;
  }
  .planned,
  .layer-progress {
    font:
      9px ui-monospace,
      SFMono-Regular,
      monospace;
    color: var(--layer-muted);
    letter-spacing: 0.8px;
  }
  .planned {
    text-transform: uppercase;
  }
  .logic-layer {
    --layer-bg: #090b11;
    --layer-text: #eeeef6;
    --layer-muted: #a6aabd;
    --layer-line: #282b3b;
  }
  .verified-notice {
    color: #c7bdff;
    font-size: 12px;
    margin: -8px 0 20px;
  }
  .challenge-selector {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    border-top: 1px solid #303346;
    border-bottom: 1px solid #303346;
  }
  .challenge-selector button {
    position: relative;
    display: grid;
    grid-template-columns: 20px 1fr;
    align-content: start;
    align-items: baseline;
    gap: 9px 12px;
    min-height: 85px;
    padding: 16px 14px;
    text-align: left;
    border-right: 1px solid #282b3b;
    color: #b6b9ca;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .challenge-selector button:last-child {
    border-right: 0;
  }
  .challenge-selector button:hover {
    background: #131521;
    color: #fff;
  }
  .challenge-selector button.selected {
    color: #f1edff;
    background: #1b1830;
  }
  .challenge-selector button.selected::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    background: #a69cff;
  }
  .challenge-number {
    font:
      8px ui-monospace,
      SFMono-Regular,
      monospace;
    color: #a6aabd;
  }
  .verified .challenge-number {
    color: #c1baff;
  }
  .challenge-selector strong {
    font:
      13px ui-monospace,
      SFMono-Regular,
      monospace;
  }
  .challenge-role {
    grid-column: 2;
    font-size: 9px;
    line-height: 1.6;
    color: #a6aabd;
  }
  .logic-problem {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 9%;
    padding-top: 42px;
  }
  .problem-copy {
    min-width: 0;
  }
  .problem-copy h3 {
    margin: 0;
    font-size: clamp(29px, 3vw, 42px);
    line-height: 1.15;
    letter-spacing: -1.5px;
    font-weight: 500;
  }
  .logic-problem h3 {
    font-size: clamp(26px, 2.5vw, 35px);
  }
  .problem-copy p {
    max-width: 360px;
    margin: 19px 0 0;
    color: var(--layer-muted);
    font-size: 13px;
    line-height: 1.9;
  }
  .problem-actions {
    display: flex;
    align-items: center;
    gap: 22px;
    flex-wrap: wrap;
    margin-top: 25px;
  }
  .reference-button {
    min-height: 44px;
    color: #b5b0d9;
    font-size: 11px;
    padding: 8px 0;
  }
  .reference-button:hover {
    color: white;
  }
  .specification {
    border: 1px solid #303346;
    padding: 19px 23px;
    background: #0d101a;
    min-width: 0;
  }
  .specification-heading {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    font:
      8px ui-monospace,
      SFMono-Regular,
      monospace;
    letter-spacing: 0.8px;
    color: #a6aabd;
  }
  .specification-circuit {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0;
    min-height: 148px;
    padding: 25px 0 15px;
  }
  .specification-inputs,
  .specification-outputs {
    display: grid;
    gap: 12px;
  }
  .specification-inputs {
    padding-right: 33px;
  }
  .specification-outputs {
    padding-left: 33px;
  }
  .specification-inputs button,
  .specification-outputs > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 9px;
    position: relative;
    min-height: 34px;
    color: #a9adc1;
    font:
      10px ui-monospace,
      SFMono-Regular,
      monospace;
  }
  .specification-inputs strong,
  .specification-outputs strong {
    display: grid;
    place-items: center;
    width: 29px;
    height: 29px;
    border: 1px solid #53536a;
    background: #191c2a;
    color: #d6d6e7;
    font:
      14px ui-monospace,
      SFMono-Regular,
      monospace;
  }
  .specification-inputs .high strong,
  .specification-outputs .high strong {
    background: #4f46e5;
    color: #fff;
    border-color: #a69cff;
    box-shadow: 0 0 14px #7970ff25;
  }
  .specification-inputs button::after,
  .specification-outputs > div::before {
    content: '';
    position: absolute;
    width: 33px;
    height: 1px;
    top: 50%;
    background: #50526a;
  }
  .specification-inputs button::after {
    right: -33px;
  }
  .specification-outputs > div::before {
    left: -33px;
  }
  .specification-inputs button.high::after,
  .specification-outputs > .high::before {
    background: #a69cff;
  }
  .specification-chip {
    position: relative;
    display: grid;
    place-items: center;
    width: 88px;
    min-height: 84px;
    background: #181728;
    border: 1px solid #6d638f;
    box-shadow:
      inset 0 0 0 5px #10121b,
      inset 0 0 0 6px #323048;
    color: #dbd4ff;
    font:
      15px ui-monospace,
      SFMono-Regular,
      monospace;
  }
  .specification-chip::before,
  .specification-chip::after {
    content: '';
    position: absolute;
    height: 5px;
    left: 12px;
    right: 12px;
    background: repeating-linear-gradient(to right, #8b81bd 0 3px, transparent 3px 12px);
  }
  .specification-chip::before {
    top: -6px;
  }
  .specification-chip::after {
    bottom: -6px;
  }
  .specification > p {
    margin: 15px 0 0;
    border-top: 1px solid #282b3b;
    padding-top: 13px;
    color: #a6aabd;
    font-size: 11px;
    line-height: 1.7;
  }
  .layer-problem {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9%;
    align-items: center;
    min-height: 240px;
  }
  .arithmetic-layer {
    --layer-bg: #171a2c;
    --layer-text: #f0eff9;
    --layer-muted: #b9b9cf;
    --layer-line: #32354b;
  }
  .memory-layer {
    --layer-bg: #45465f;
    --layer-text: #fff;
    --layer-muted: #d0d0e0;
    --layer-line: #62637a;
  }
  .architecture-layer {
    --layer-bg: #b8b8ca;
    --layer-text: #1d1d32;
    --layer-muted: #45455e;
    --layer-line: #9999af;
  }
  .software-layer {
    --layer-bg: #f1f1f7;
    --layer-text: #202037;
    --layer-muted: #5d5c73;
    --layer-line: #d3d2df;
  }
  figure {
    margin: 0;
    min-width: 0;
  }
  figcaption {
    color: var(--layer-muted);
    font-size: 10px;
    line-height: 1.7;
    margin-top: 22px;
  }
  .binary-addition {
    max-width: 470px;
    justify-self: stretch;
    padding: 10px 0;
  }
  .binary-row {
    display: grid;
    grid-template-columns: 25px minmax(0, 1fr) 35px;
    align-items: center;
    gap: 15px;
    padding: 11px 0;
    font-family: ui-monospace, SFMono-Regular, monospace;
  }
  .binary-digits {
    font-size: clamp(22px, 2.8vw, 39px);
    line-height: 1.2;
    letter-spacing: 0.07em;
    color: #84869f;
    white-space: nowrap;
  }
  .binary-operation {
    color: #bbb5f2;
    font-size: 22px;
  }
  .lit-bit {
    color: #e0dcff;
  }
  .decimal {
    color: #c1bddb;
    font-size: 13px;
    text-align: right;
  }
  .binary-result {
    border-top: 1px solid #6b668b;
    margin-top: 5px;
    padding-top: 16px;
  }
  .binary-result .lit-bit {
    color: #c4baff;
  }
  .memory-trace svg {
    display: block;
    width: 100%;
  }
  .trace-labels {
    fill: #e1e0ee;
    font:
      11px ui-monospace,
      SFMono-Regular,
      monospace;
  }
  .data-trace {
    stroke: #c4c4da;
    stroke-width: 2;
  }
  .clock-trace {
    stroke: #bdb4ff;
    stroke-width: 2;
  }
  .stored-trace {
    stroke: #f4edff;
    stroke-width: 2.5;
  }
  .sampling-edges {
    stroke: #d7cfff;
    stroke-width: 1;
    stroke-dasharray: 3 6;
    opacity: 0.35;
  }
  .sample-point {
    fill: #f4edff;
    stroke: #f4edff;
  }
  .instruction-cycle {
    padding: 17px 0 0;
  }
  .cycle-line {
    display: flex;
    align-items: center;
    gap: 17px;
  }
  .cycle-line > div {
    display: grid;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }
  .cycle-line > div > span {
    font:
      10px ui-monospace,
      SFMono-Regular,
      monospace;
    color: #56506d;
  }
  .cycle-line strong {
    font-size: 19px;
    line-height: 1.2;
    font-weight: 550;
    letter-spacing: -0.5px;
  }
  .cycle-line small {
    font-size: 9px;
    line-height: 1.5;
    color: #45455e;
  }
  .cycle-arrow {
    color: #5e557e;
    font-size: 18px;
  }
  .cycle-return {
    margin: 22px 12px 0 0;
    border: 1px solid #8c86a3;
    border-top: 0;
    height: 25px;
    position: relative;
  }
  .cycle-return > span {
    position: absolute;
    left: 50%;
    bottom: -9px;
    padding: 0 8px;
    color: #5c4d8a;
    background: #b8b8ca;
    line-height: 16px;
  }
  .code-abstraction {
    max-width: 470px;
    justify-self: stretch;
  }
  .source-line {
    padding-bottom: 15px;
    border-bottom: 1px solid #cfcddd;
    font:
      clamp(16px, 2vw, 26px)/1.6 ui-monospace,
      SFMono-Regular,
      monospace;
    letter-spacing: -0.7px;
    white-space: nowrap;
  }
  .code-keyword {
    color: #4f46e5;
  }
  .abstraction-axis {
    display: flex;
    align-items: center;
    gap: 15px;
    width: 100%;
    padding: 18px 0;
    color: #8c85ba;
  }
  .abstraction-axis > span {
    height: 1px;
    flex: 1;
    background: #dcd9e8;
  }
  .abstraction-axis i,
  .abstraction-layers i {
    font-style: normal;
    font-family: ui-monospace, monospace;
    color: #6b6298;
  }
  .abstraction-layers {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font:
      11px ui-monospace,
      SFMono-Regular,
      monospace;
    color: #5d5678;
  }
  .abstraction-layers i {
    transform: rotate(-90deg);
  }
  .abstraction-layers .signal-bits {
    color: #4f46e5;
    white-space: nowrap;
  }
  .start-from-bottom {
    display: inline-flex;
    align-items: center;
    gap: 32px;
    padding: 13px 0;
    margin-top: 17px;
    min-height: 44px;
    border-bottom: 1px solid #aba6cd;
    color: #4036ba;
    font-size: 12px;
    font-weight: 500;
  }
  .start-from-bottom > span {
    font-size: 18px;
  }
  .start-from-bottom:hover {
    border-color: #4f46e5;
    color: #211a82;
  }
  @media (min-width: 1500px) {
    .hero {
      padding-top: 70px;
      padding-bottom: 42px;
    }
    .hero-copy > p {
      max-width: 350px;
      font-size: 15px;
    }
    .layer-inner {
      padding-top: 42px;
      padding-bottom: 74px;
    }
    .layer-problem {
      min-height: 270px;
    }
  }
  @media (max-width: 1100px) {
    .hero {
      grid-template-columns: minmax(250px, 0.9fr) minmax(0, 1.25fr);
      gap: 24px 4%;
    }
    h1 {
      font-size: 48px;
    }
    .hero-copy > p {
      font-size: 13px;
    }
    .hero-actions {
      gap: 8px 15px;
    }
    .challenge-selector button {
      padding-inline: 10px;
      grid-template-columns: 1fr;
      gap: 7px;
    }
    .challenge-number {
      display: none;
    }
    .challenge-role {
      grid-column: 1;
    }
    .logic-problem,
    .layer-problem {
      gap: 6%;
    }
    .cycle-line {
      gap: 11px;
    }
    .cycle-line strong {
      font-size: 17px;
    }
  }
  @media (max-width: 760px) {
    .hero {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      padding-top: 36px;
      gap: 30px;
    }
    h1 {
      font-size: clamp(43px, 7.5vw, 62px);
    }
    .hero-copy > p {
      max-width: 400px;
      margin: 18px 0 22px;
    }
    .hero-actions {
      gap: 12px 22px;
    }
    .hero-motion {
      width: 100%;
    }
    .explore-link {
      margin-top: -12px;
    }
    .layer-inner {
      padding-top: 28px;
      padding-bottom: 44px;
    }
    .layer-header {
      padding-bottom: 22px;
    }
    .logic-problem,
    .layer-problem {
      grid-template-columns: 1fr;
      gap: 30px;
    }
    .logic-problem {
      padding-top: 30px;
    }
    .layer-problem {
      padding-top: 8px;
      min-height: auto;
    }
    .problem-copy h3 {
      font-size: 34px;
    }
    .problem-copy p {
      max-width: 450px;
      margin-top: 15px;
    }
    .specification,
    figure {
      width: 100%;
      max-width: 540px;
    }
    .binary-digits {
      font-size: 35px;
    }
    .specification-circuit {
      min-height: 140px;
    }
    .source-line {
      font-size: 24px;
    }
    .instruction-cycle {
      padding-top: 7px;
    }
    .cycle-line strong {
      font-size: 22px;
    }
    .cycle-line small {
      font-size: 10px;
    }
  }
  @media (max-width: 480px) {
    .hero {
      padding-inline: 5%;
      padding-top: 34px;
      gap: 25px;
    }
    .hero-copy > p {
      font-size: 13px;
      max-width: 300px;
    }
    .hero-actions {
      gap: 8px 17px;
    }
    .primary-button {
      min-height: 44px;
      padding: 10px 12px;
      gap: 18px;
      font-size: 11px;
    }
    .film-button {
      font-size: 10px;
      gap: 7px;
    }
    .play-icon {
      width: 22px;
      height: 22px;
      font-size: 14px;
    }
    .explore-link {
      font-size: 8px;
    }
    .layer-inner {
      padding-inline: 5%;
    }
    .layer-label {
      gap: 11px;
    }
    .layer-label h2 {
      font-size: 13px;
    }
    .layer-progress {
      font-size: 8px;
      letter-spacing: 0.2px;
    }
    .layer-header {
      gap: 12px;
    }
    .challenge-selector {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      border-bottom: 0;
    }
    .challenge-selector button {
      min-height: 68px;
      padding: 12px 8px;
      border-bottom: 1px solid #303346;
    }
    .challenge-selector button:nth-child(4) {
      border-right: 0;
    }
    .challenge-selector strong {
      font-size: 11px;
    }
    .challenge-role {
      font-size: 8px;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }
    .problem-copy h3 {
      font-size: 30px;
      line-height: 1.17;
      letter-spacing: -1.2px;
    }
    .problem-copy p {
      font-size: 12px;
    }
    .problem-actions {
      gap: 20px;
      margin-top: 22px;
    }
    .specification {
      padding: 16px;
    }
    .specification-heading {
      font-size: 7px;
      gap: 10px;
      letter-spacing: 0.5px;
    }
    .specification-inputs {
      padding-right: 18px;
    }
    .specification-outputs {
      padding-left: 18px;
    }
    .specification-inputs button::after,
    .specification-outputs > div::before {
      width: 18px;
    }
    .specification-inputs button::after {
      right: -18px;
    }
    .specification-outputs > div::before {
      left: -18px;
    }
    .specification-chip {
      width: 72px;
      min-height: 75px;
      font-size: 13px;
    }
    .specification-inputs strong,
    .specification-outputs strong {
      height: 26px;
      width: 26px;
      font-size: 13px;
    }
    .specification-inputs button,
    .specification-outputs > div {
      gap: 6px;
      font-size: 9px;
    }
    .binary-row {
      gap: 10px;
      grid-template-columns: 18px minmax(0, 1fr) 23px;
    }
    .binary-digits {
      font-size: clamp(21px, 7vw, 31px);
      letter-spacing: 0.03em;
    }
    .binary-operation {
      font-size: 18px;
    }
    .decimal {
      font-size: 11px;
    }
    .cycle-line {
      gap: 8px;
    }
    .cycle-line strong {
      font-size: 18px;
    }
    .cycle-line small {
      font-size: 8px;
    }
    .cycle-arrow {
      font-size: 15px;
    }
    .source-line {
      font-size: 20px;
      letter-spacing: -0.6px;
    }
    .abstraction-layers {
      gap: 7px;
      font-size: 9px;
    }
    figcaption {
      font-size: 9px;
      margin-top: 18px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      transition: none !important;
      scroll-behavior: auto !important;
    }
  }
</style>

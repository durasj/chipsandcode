<script lang="ts">
  import { onMount } from 'svelte';
  import { computerLayers, type ComputerLayerId } from './layers';

  export let autoplay = true;
  export let suspended = false;
  /** User selections only: automatic playback never moves the surrounding page. */
  export let onlayerselect: ((id: ComputerLayerId) => void) | undefined = undefined;

  const duration = 30_000;
  const chapterDuration = duration / computerLayers.length;
  const backgrounds = ['#070910', '#111526', '#303a57', '#a6afc7', '#f2f1f7'];
  const foregrounds = ['#eef0ff', '#eef0ff', '#f4f5ff', '#172039', '#171a2f'];
  const accents = ['#a79aff', '#aa9fff', '#d3caff', '#4f46e5', '#4f46e5'];
  const muted = ['#9ba1b7', '#a6acc1', '#d0d4e3', '#3f4a65', '#60657c'];
  const captions = [
    'A NAND gate outputs 0 only when both inputs are 1.',
    'Four one-bit adders turn 3 + 1 into the binary value 0100.',
    'A register keeps its value after the input signal changes.',
    'The CPU coordinates instructions, computation, and memory.',
    'Every line of code eventually becomes signals in hardware.',
  ];
  const names = ['Logic', 'Arithmetic', 'Memory', 'Architecture', 'Software'];
  let host: HTMLDivElement;
  let elapsed = 0;
  let playing = false;
  let visible = true;
  let tabVisible = true;
  let reducedMotion = false;
  let frame = 0;
  let previousTime = 0;
  let mounted = false;

  $: chapter = Math.min(computerLayers.length - 1, Math.floor(elapsed / chapterDuration));
  $: chapterProgress = elapsed >= duration ? 1 : (elapsed % chapterDuration) / chapterDuration;
  $: active = computerLayers[chapter];
  $: a = Math.floor(chapterProgress * 4) >= 2;
  $: b = Math.min(3, Math.floor(chapterProgress * 4)) % 2 === 1;
  $: output = !(a && b);
  $: bitStep = Math.min(3, Math.floor(chapterProgress * 4));
  $: captured = chapterProgress >= 0.381;
  $: moving = playing && visible && tabVisible && !suspended;
  $: {
    suspended;
    if (mounted) schedule();
  }

  function animate(now: number) {
    if (previousTime && playing && visible && tabVisible && !suspended) {
      elapsed = Math.min(duration, elapsed + Math.min(now - previousTime, 100));
      if (elapsed === duration) playing = false;
    }
    previousTime = now;
    if (playing && visible && tabVisible && !suspended) frame = requestAnimationFrame(animate);
    else frame = 0;
  }

  function schedule() {
    if (!mounted) return;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    if (playing && visible && tabVisible && !suspended) frame = requestAnimationFrame(animate);
  }

  function togglePlayback() {
    if (elapsed >= duration) elapsed = 0;
    playing = !playing;
    schedule();
  }

  function selectChapter(index: number) {
    playing = false;
    elapsed = (index + 0.8) * chapterDuration;
    schedule();
    onlayerselect?.(computerLayers[index].id);
  }

  onMount(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = preference.matches;
    tabVisible = document.visibilityState === 'visible';
    mounted = true;
    playing = autoplay && !reducedMotion;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        schedule();
      },
      { threshold: 0.15 },
    );
    observer.observe(host);
    const visibilityChanged = () => {
      tabVisible = document.visibilityState === 'visible';
      schedule();
    };
    const preferenceChanged = () => {
      reducedMotion = preference.matches;
      if (reducedMotion) playing = false;
      schedule();
    };
    document.addEventListener('visibilitychange', visibilityChanged);
    preference.addEventListener('change', preferenceChanged);
    schedule();
    return () => {
      mounted = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      preference.removeEventListener('change', preferenceChanged);
    };
  });
</script>

<div
  class="layer-journey"
  bind:this={host}
  class:moving
  class:reduced-motion={reducedMotion}
  style={`--journey-bg:${backgrounds[chapter]};--journey-fg:${foregrounds[chapter]};--journey-accent:${accents[chapter]};--journey-muted:${muted[chapter]}`}
>
  <div class="journey-frame" role="img" aria-label={`${active.title}. ${captions[chapter]}`}>
    <div class="frame-labels" aria-hidden="true">
      <span>{active.number} <i>/</i> {active.title}</span>
      <span class="preview-label">{chapter === 0 ? 'SIGNAL FOUNDATION' : 'LAYER PREVIEW'}</span>
    </div>
    <svg class="journey-art" viewBox="0 0 1200 700" fill="none" aria-hidden="true">
      <defs>
        <pattern id="journey-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".8" fill="currentColor" opacity=".14" />
        </pattern>
        <linearGradient id="journey-board" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="currentColor" stop-opacity=".09" />
          <stop offset="1" stop-color="currentColor" stop-opacity=".015" />
        </linearGradient>
        <radialGradient id="journey-halo">
          <stop stop-color="#7770ed" stop-opacity=".16" />
          <stop offset="1" stop-color="#7770ed" stop-opacity="0" />
        </radialGradient>
        <marker
          id="journey-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M1 1L6 4 1 7" fill="none" stroke="currentColor" stroke-width="1.5" />
        </marker>
      </defs>
      <rect width="1200" height="700" fill="url(#journey-grid)" />
      <ellipse cx="600" cy="365" rx="500" ry="300" fill="url(#journey-halo)" />
      <!-- The physical foundation remains visible as the abstraction level rises. -->
      <g
        class="foundation"
        style={`transform:translateY(${chapter * 8}px);opacity:${0.8 - chapter * 0.1}`}
      >
        <path
          d="M165 450L590 205 1035 450 610 695Z"
          fill="url(#journey-board)"
          stroke="currentColor"
          stroke-opacity=".18"
        />
        <path
          d="M165 450V466L610 711 1035 466V450M610 695V711"
          stroke="currentColor"
          stroke-opacity=".12"
        />
        <path d="M240 450L591 248 959 450 609 652Z" stroke="currentColor" stroke-opacity=".07" />
        <path d="M317 450L593 291 883 450 608 609Z" stroke="currentColor" stroke-opacity=".06" />
      </g>
      <g class="scene" class:active={chapter === 0}>
        <g class="trace" stroke-width="3">
          <path d="M195 260H365V300H480" class:energized={a} />
          <path d="M195 420H365V360H480" class:energized={b} />
          <path d="M718 330H1000" class:energized={output} />
        </g>
        <path class="component" d="M480 245H578C733 245 733 415 578 415H480Z" stroke-width="2" />
        <circle class="component" cx="706" cy="330" r="12" stroke-width="2" />
        <text class="component-title" x="571" y="338" text-anchor="middle">NAND</text>
        <g class="terminal" class:on={a}>
          <circle cx="195" cy="260" r="35" />
          <text x="195" y="269" text-anchor="middle">{Number(a)}</text>
        </g>
        <g class="terminal" class:on={b}>
          <circle cx="195" cy="420" r="35" />
          <text x="195" y="429" text-anchor="middle">{Number(b)}</text>
        </g>
        <g class="terminal output" class:on={output}>
          <circle cx="1000" cy="330" r="49" />
          <text x="1000" y="342" text-anchor="middle">{Number(output)}</text>
        </g>
        <text class="small-label" x="195" y="201" text-anchor="middle">INPUT a</text>
        <text class="small-label" x="195" y="480" text-anchor="middle">INPUT b</text>
        <text class="small-label" x="1000" y="255" text-anchor="middle">OUTPUT</text>
        <path class="flow trace" d="M195 260H365V300H480" class:energized={a} stroke-width="4" />
        <path class="flow trace" d="M718 330H1000" class:energized={output} stroke-width="4" />
        <text class="equation" x="600" y="535" text-anchor="middle">out = NOT(a AND b)</text>
      </g>
      <g class="scene" class:active={chapter === 1}>
        <text class="small-label" x="188" y="185">a</text>
        <text class="small-label" x="188" y="232">b</text>
        <text class="small-label" x="188" y="490">sum</text>
        {#each [0, 1, 2, 3] as bit}
          {@const x = 340 + bit * 175}
          <g class:bit-active={bit === 3 - bitStep}>
            <path
              class="trace"
              d={`M${x - 21} 203V310M${x + 21} 247V310M${x} 400V457`}
              stroke-width="2"
            />
            <text class="binary" x={x - 21} y="185" text-anchor="middle"
              >{bit >= 2 ? '1' : '0'}</text
            >
            <text class="binary" x={x + 21} y="232" text-anchor="middle"
              >{bit === 3 ? '1' : '0'}</text
            >
            <rect
              class="component adder"
              x={x - 52}
              y="310"
              width="104"
              height="90"
              rx="3"
              stroke-width="2"
            />
            <text class="component-title" {x} y="364" text-anchor="middle">FA</text>
            <text class="binary sum" {x} y="496" text-anchor="middle">{bit === 1 ? '1' : '0'}</text>
            <text class="tiny-label" {x} y="537" text-anchor="middle">BIT {3 - bit}</text>
            {#if bit < 3}
              <path
                class="trace carry"
                d={`M${x + 122} 356H${x + 53}`}
                stroke-width="2"
                marker-end="url(#journey-arrow)"
              />
              <text class="tiny-label" x={x + 87} y="338" text-anchor="middle"
                >{bit >= 1 ? '1' : '0'}</text
              >
            {/if}
          </g>
        {/each}
        <text class="small-label" x="1015" y="334" text-anchor="middle">carry</text>
        <path class="trace" d="M1000 356H918" stroke-width="2" marker-end="url(#journey-arrow)" />
        <text class="tiny-label" x="968" y="382" text-anchor="middle">0</text>
        <text class="equation" x="600" y="598" text-anchor="middle">0011 + 0001 = 0100</text>
      </g>
      <g class="scene" class:active={chapter === 2}>
        <text class="small-label" x="600" y="181" text-anchor="middle">8-BIT REGISTER</text>
        <path class="trace" d="M205 318H264M936 318H995" stroke-width="2" />
        {#each ['1', '0', '1', '1', '0', '1', '0', '0'] as bit, i}
          {@const x = 290 + i * 88}
          <rect
            class="component register-cell"
            class:captured
            x={x - 34}
            y="264"
            width="68"
            height="108"
            rx="3"
            stroke-width="1.5"
          />
          <text class="register-value" {x} y="329" text-anchor="middle">{captured ? bit : '0'}</text
          >
          <path class="trace" d={`M${x} 372V420`} stroke-width="1.5" />
          <text class="tiny-label" {x} y="248" text-anchor="middle">{7 - i}</text>
        {/each}
        <path class="trace" d="M235 420H940M235 420V475" stroke-width="2" />
        <path
          class="trace"
          d="M180 518H310V472H405V518H500V472H595V518H690V472H785V518H880V472H975V518H1020"
          stroke-width="2"
        />
        <circle
          class="clock-point"
          cx={180 + chapterProgress * 840}
          cy={chapterProgress < 0.15 ||
          (chapterProgress >= 0.27 && chapterProgress < 0.38) ||
          (chapterProgress >= 0.49 && chapterProgress < 0.61) ||
          (chapterProgress >= 0.72 && chapterProgress < 0.83) ||
          chapterProgress >= 0.95
            ? 518
            : 472}
          r="5"
        />
        <text class="tiny-label" x="180" y="561">CLOCK</text>
        <text class="tiny-label" x="1020" y="561" text-anchor="end"
          >{captured ? 'VALUE HELD' : 'WAITING FOR CLOCK EDGE'}</text
        >
        <text class="equation" x="600" y="619" text-anchor="middle"
          >input: {chapterProgress >= 0.68 ? '00000000' : '10110100'} · stored: {captured
            ? '10110100'
            : '00000000'}</text
        >
      </g>
      <g class="scene" class:active={chapter === 3}>
        <rect
          class="component cpu"
          x="396"
          y="183"
          width="440"
          height="350"
          rx="5"
          stroke-width="1.5"
        />
        <text class="small-label" x="420" y="216">CPU</text>
        <rect
          class="component"
          x="160"
          y="237"
          width="172"
          height="106"
          rx="3"
          stroke-width="1.5"
        />
        <text class="component-title" x="246" y="278" text-anchor="middle">ROM</text>
        <text class="tiny-label" x="246" y="314" text-anchor="middle">D = D + A</text>
        <path class="trace" d="M332 290H445" stroke-width="2" marker-end="url(#journey-arrow)" />
        <rect class="component" x="445" y="251" width="132" height="77" rx="2" stroke-width="1.5" />
        <text class="tiny-label" x="511" y="283" text-anchor="middle">CONTROL</text>
        <text class="tiny-label" x="511" y="309" text-anchor="middle">decode</text>
        <rect class="component" x="452" y="378" width="112" height="49" rx="2" stroke-width="1.5" />
        <rect class="component" x="452" y="455" width="112" height="49" rx="2" stroke-width="1.5" />
        <text class="register-label" x="508" y="409" text-anchor="middle">A = 1</text>
        <text class="register-label" x="508" y="486" text-anchor="middle"
          >D = {chapterProgress > 0.6 ? '4' : '3'}</text
        >
        <path
          class="component"
          d="M661 355L706 380 750 355V480L706 455 661 480Z"
          stroke-width="1.8"
        />
        <text class="component-title" x="706" y="425" text-anchor="middle">+</text>
        <path
          class="trace"
          d="M564 402H661M564 479H612V443H661M577 290H706V355M750 419H896"
          stroke-width="2"
          marker-end="url(#journey-arrow)"
        />
        <path
          class="trace"
          class:energized={chapterProgress > 0.6}
          d="M784 419V563H420V479H452"
          stroke-width="2"
          marker-end="url(#journey-arrow)"
        />
        <rect
          class="component"
          x="896"
          y="368"
          width="140"
          height="105"
          rx="3"
          stroke-width="1.5"
        />
        <text class="component-title" x="966" y="412" text-anchor="middle">RAM</text>
        <text class="tiny-label" x="966" y="445" text-anchor="middle">read / write</text>
        <text class="equation" x="600" y="620" text-anchor="middle">fetch → decode → execute</text>
      </g>
      <g class="scene" class:active={chapter === 4}>
        <rect
          class="source-window"
          x="190"
          y="158"
          width="605"
          height="370"
          rx="5"
          stroke-width="1.5"
        />
        <path d="M190 208H795" stroke="currentColor" stroke-opacity=".16" />
        <text class="tiny-label" x="217" y="189">main.js</text>
        <g class="source-lines">
          <text x="221" y="265" class="line-number">1</text><text x="258" y="265"
            ><tspan class="keyword">function</tspan> add(a, b) {'{'}</text
          >
          <g opacity={Math.min(1, chapterProgress * 6)}
            ><text x="221" y="305" class="line-number">2</text><text x="258" y="305">
              <tspan class="keyword">return</tspan> a + b;</text
            ></g
          >
          <g opacity={Math.min(1, Math.max(0, chapterProgress * 6 - 1))}
            ><text x="221" y="345" class="line-number">3</text><text x="258" y="345">{'}'}</text></g
          >
          <g opacity={Math.min(1, Math.max(0, chapterProgress * 6 - 2))}
            ><text x="221" y="425" class="line-number">5</text><text x="258" y="425"
              >add(<tspan class="keyword">3</tspan>, <tspan class="keyword">1</tspan>);</text
            ></g
          >
        </g>
        <path class="trace" d="M795 345H901" stroke-width="2" marker-end="url(#journey-arrow)" />
        <g opacity={Math.min(1, Math.max(0, chapterProgress * 6 - 3))}>
          <text class="result-value" x="961" y="360" text-anchor="middle">4</text>
          <text class="small-label" x="961" y="405" text-anchor="middle">RESULT</text>
        </g>
        <path class="trace" d="M490 528V574H961V443" stroke-width="1.5" stroke-dasharray="3 6" />
        <text class="tiny-label" x="485" y="612" text-anchor="end">code</text>
        <text class="tiny-label" x="600" y="612" text-anchor="middle">instructions</text>
        <text class="tiny-label" x="747" y="612">signals</text>
      </g>
    </svg>
    <div class="frame-caption" aria-hidden="true">{captions[chapter]}</div>
  </div>
  <div class="journey-controls">
    <button
      class="play-control"
      onclick={togglePlayback}
      aria-label={elapsed >= duration
        ? 'Replay layer journey'
        : playing
          ? 'Pause layer journey'
          : 'Play layer journey'}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        {#if elapsed >= duration}<path d="M4 7a7 7 0 1 1-1 6M4 2v5h5" />
        {:else if playing}<path d="M7 5v10M13 5v10" />
        {:else}<path d="M6 4l10 6-10 6Z" />{/if}
      </svg>
    </button>
    <nav class="chapter-controls" aria-label="Explore computer layers">
      {#each computerLayers as layer, index}
        <button
          class:current={index === chapter}
          aria-pressed={index === chapter}
          onclick={() => selectChapter(index)}
        >
          <span class="chapter-number">{layer.number}</span>
          <span class="chapter-name">{names[index]}</span>
          <span
            class="chapter-progress"
            style={`transform:scaleX(${index < chapter ? 1 : index === chapter ? chapterProgress : 0})`}
          ></span>
        </button>
      {/each}
    </nav>
    <span class="timecode" aria-hidden="true"
      >{String(Math.floor(elapsed / 1000)).padStart(2, '0')} / 30</span
    >
  </div>
</div>

<style>
  .layer-journey {
    --journey-bg: #070910;
    --journey-fg: #eef0ff;
    --journey-accent: #a79aff;
    --journey-muted: #9ba1b7;
    width: 100%;
    min-width: 0;
  }
  .journey-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 1.65;
    max-height: var(--journey-height, 480px);
    overflow: hidden;
    background: var(--journey-bg);
    color: var(--journey-fg);
    transition:
      background 1.2s,
      color 1.2s;
    border: 1px solid #5f5b7a44;
    border-radius: 5px;
  }
  .journey-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .frame-labels {
    position: absolute;
    z-index: 1;
    inset: 22px 24px auto;
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font:
      11px/1.5 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.06em;
  }
  .frame-labels i {
    font-style: normal;
    color: var(--journey-muted);
    margin: 0 8px;
  }
  .preview-label {
    color: var(--journey-muted);
    font-size: 9px;
    letter-spacing: 0.1em;
  }
  .frame-caption {
    position: absolute;
    bottom: 20px;
    left: 24px;
    right: 24px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--journey-muted);
    text-align: center;
  }
  .foundation {
    transform-origin: center;
    transition:
      transform 1.3s,
      opacity 1.3s;
  }
  .scene {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
    transform-origin: center;
    transition:
      opacity 0.8s,
      transform 1.1s;
    pointer-events: none;
  }
  .scene.active {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  .trace {
    stroke: var(--journey-muted);
    opacity: 0.5;
  }
  .trace.energized {
    stroke: var(--journey-accent);
    opacity: 1;
  }
  .component {
    fill: var(--journey-bg);
    stroke: var(--journey-accent);
    transition: fill 0.8s;
  }
  .component-title {
    fill: var(--journey-fg);
    font:
      24px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.03em;
  }
  .terminal circle {
    fill: var(--journey-bg);
    stroke: var(--journey-muted);
    stroke-width: 2;
  }
  .terminal text {
    fill: var(--journey-muted);
    font:
      26px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .terminal.on circle {
    stroke: var(--journey-accent);
  }
  .terminal.on text {
    fill: var(--journey-accent);
  }
  .terminal.output text {
    font-size: 38px;
  }
  .small-label {
    fill: var(--journey-muted);
    font:
      14px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.12em;
  }
  .tiny-label {
    fill: var(--journey-muted);
    font:
      12px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.06em;
  }
  .equation {
    fill: var(--journey-muted);
    font:
      18px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .flow {
    stroke-dasharray: 4 25;
    stroke-dashoffset: 0;
    animation: journey-flow 2s linear infinite;
    animation-play-state: paused;
    opacity: 0;
  }
  .moving .active .flow.energized {
    animation-play-state: running;
    opacity: 1;
  }
  .binary {
    fill: var(--journey-muted);
    font:
      27px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .sum {
    fill: var(--journey-accent);
  }
  .bit-active .adder {
    fill: var(--journey-accent);
    fill-opacity: 0.2;
    stroke-width: 3;
  }
  .bit-active .sum {
    font-weight: 700;
  }
  .register-value {
    fill: var(--journey-accent);
    font:
      32px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .register-cell {
    stroke-opacity: 0.4;
  }
  .register-cell.captured {
    stroke-opacity: 1;
  }
  .clock-point {
    fill: var(--journey-accent);
  }
  .register-label {
    fill: var(--journey-fg);
    font:
      18px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .source-window {
    fill: #fafaff;
    stroke: #827eaf;
  }
  .source-lines {
    fill: #282b43;
    font:
      25px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    white-space: pre;
  }
  .source-lines .line-number {
    fill: #89879d;
    font-size: 16px;
  }
  .keyword {
    fill: #4f46e5;
  }
  .result-value {
    fill: #4f46e5;
    font:
      82px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    font-weight: 500;
  }
  .journey-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 0;
    color: #b7b8cb;
  }
  .play-control {
    width: 44px;
    min-width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: 1px solid #353648;
    color: #d9d8eb;
    background: #12141e;
    border-radius: 3px;
    cursor: pointer;
  }
  .play-control svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.6;
  }
  .play-control:hover {
    border-color: #a59aeb;
    color: #fff;
  }
  .chapter-controls {
    flex: 1;
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 7px;
  }
  .chapter-controls button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 0;
    min-height: 44px;
    padding: 8px 3px;
    background: none;
    border: 0;
    border-bottom: 1px solid #353648;
    color: #9698ad;
    font:
      10px/1.4 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    cursor: pointer;
  }
  .chapter-controls button:hover,
  .chapter-controls button.current {
    color: #e4dfff;
  }
  .chapter-number {
    color: #8981bf;
    font-size: 9px;
  }
  .chapter-controls button.current .chapter-number {
    color: #c4b7ff;
  }
  .chapter-progress {
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #8e7fff;
    transform-origin: left;
  }
  .timecode {
    font:
      9px/1.5 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    color: #8f90a7;
    white-space: nowrap;
  }
  button:focus-visible {
    outline: 2px solid #c7baff !important;
    outline-offset: 3px;
  }
  @keyframes journey-flow {
    to {
      stroke-dashoffset: -58;
    }
  }
  @media (max-width: 720px) {
    .frame-labels {
      inset: 15px 16px auto;
      font-size: 10px;
    }
    .preview-label {
      font-size: 8px;
    }
    .frame-caption {
      left: 15px;
      right: 15px;
      bottom: 13px;
      font-size: 10px;
    }
    .chapter-name {
      font-size: 9px;
    }
    .chapter-controls button {
      gap: 4px;
    }
    .timecode {
      display: none;
    }
  }
  @media (max-width: 520px) {
    .journey-frame {
      aspect-ratio: 1.25;
    }
    .journey-art {
      width: 122%;
      max-width: none;
      left: -11%;
    }
    .frame-labels {
      font-size: 9px;
      gap: 8px;
    }
    .preview-label {
      display: none;
    }
    .frame-caption {
      font-size: 10px;
      max-width: 260px;
      margin: auto;
    }
    .journey-controls {
      gap: 8px;
    }
    .chapter-controls {
      gap: 4px;
    }
    .chapter-name {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
    }
    .chapter-number {
      font-size: 11px;
    }
  }
  .reduced-motion .scene,
  .reduced-motion .foundation,
  .reduced-motion .journey-frame,
  .reduced-motion .component {
    transition: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .flow {
      animation: none;
    }
  }
</style>

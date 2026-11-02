<script lang="ts">
  import { onMount } from 'svelte';
  import ComputerJourney from './ComputerJourney.svelte';

  export let onstart: () => void;
  export let onwatch: () => void;
  export let continuing = false;

  const chapters = [
    { id: 'computer', label: 'THE WHOLE MACHINE' },
    {
      id: 'components',
      label: 'LOOK CLOSER',
      title: 'Take it apart.',
      body: 'A screen. A board. Memory. A processor. Each piece has a job. None of it is magic.',
    },
    {
      id: 'chip',
      label: 'INSIDE THE PROCESSOR',
      title: 'Keep going.',
      body: 'Beneath the surface of a chip, tiny switches and connections do the work.',
    },
    {
      id: 'signals',
      label: 'THE FOUNDATION',
      title: 'We start with the very basics.',
      body: 'Off or on. Zero or one. Change a signal. See what happens. Build from there.',
    },
  ];
  let journey: HTMLElement;
  let progress = 0;
  let reducedMotion = false;
  $: activePhase = chapters[Math.min(3, Math.max(0, Math.round(progress)))].id;

  onMount(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = preference.matches;
    const sections = Array.from(journey.querySelectorAll<HTMLElement>('[data-journey-step]'));
    let frame = 0;
    function update() {
      frame = 0;
      const center = window.innerHeight * 0.5;
      const centers = sections.map((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top + rect.height * 0.5;
      });
      if (center <= centers[0]) progress = 0;
      else if (center >= centers[centers.length - 1]) progress = chapters.length - 1;
      else {
        const upper = centers.findIndex((position) => position > center);
        progress =
          upper - 1 + (center - centers[upper - 1]) / (centers[upper] - centers[upper - 1]);
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function preferenceChanged() {
      reducedMotion = preference.matches;
      schedule();
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    preference.addEventListener('change', preferenceChanged);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      preference.removeEventListener('change', preferenceChanged);
    };
  });
</script>

<div class="computer-journey" class:reduced-motion={reducedMotion}>
  <div class="journey-layout" bind:this={journey}>
    <div class="journey-copy">
      {#each chapters as chapter, index}
        <section
          id={`journey-${chapter.id}`}
          class="journey-chapter"
          class:opening={index === 0}
          data-journey-step={index}
          aria-labelledby={index === 0 ? 'journey-heading' : `heading-${chapter.id}`}
        >
          <div class="chapter-copy">
            {#if index === 0}
              <h1 id="journey-heading" tabindex="-1">
                Break down the <em>magic</em> of computers.
              </h1>
              <p class="opening-promise">By building your own.</p>
              <button class="start-button" onclick={onstart}
                >{continuing ? 'Continue learning' : 'Start learning'}<span aria-hidden="true"
                  >↗</span
                ></button
              >
              <p class="opening-note">No prerequisites. Free in your browser.</p>
            {:else}
              <p class="chapter-label"><span aria-hidden="true">0{index}</span>{chapter.label}</p>
              <h2 id={`heading-${chapter.id}`}>{chapter.title}</h2>
              <p class="chapter-description">{chapter.body}</p>
            {/if}
          </div>
          <div class="inline-scene">
            <ComputerJourney progress={index} instance={`inline-computer-${index}`} />
          </div>
          {#if index === 0}<p class="scroll-note">
              <span aria-hidden="true">↓</span> Scroll to look inside
            </p>{/if}
        </section>
      {/each}
    </div>
    <div class="visual-column" aria-hidden="true">
      <div class="computer-stage" data-phase={activePhase} data-progress={progress.toFixed(3)}>
        <ComputerJourney {progress} instance="scroll-computer" />
        <div class="scene-caption" aria-hidden="true">
          <span>CHIPS AND CODE</span>
          <span>{String(Math.min(3, Math.max(0, Math.round(progress)))).padStart(2, '0')} / 03</span
          >
        </div>
      </div>
    </div>
  </div>

  <section class="journey-start" aria-labelledby="start-heading">
    <div class="closing-copy">
      <p class="chapter-label">FROM SIGNALS TO SOFTWARE</p>
      <h2 id="start-heading">Then build it{' '}<br />back up.</h2>
      <p>
        Combine signals with gates. Build working circuits. Understand what your code is
        built on.
      </p>
      <button class="start-button" onclick={onstart}
        >{continuing ? 'Continue learning' : 'Start learning'}<span aria-hidden="true">↗</span
        ></button
      >
      <p class="availability-note">
        Start with signals and logic. Higher computer layers are still being built.
      </p>
      <button class="intro-link" onclick={onwatch}
        >Watch the introduction <span aria-hidden="true">↗</span></button
      >
    </div>
    <div
      class="build-up"
      aria-label="Gates process signals, circuits combine gates, and computers use circuits to run code"
      role="img"
    >
      <div class="build-layer code-layer">
        <span class="layer-symbol" aria-hidden="true">&lt;/&gt;</span><span>Code</span>
      </div>
      <div class="build-layer computer-layer">
        <span class="layer-symbol" aria-hidden="true"
          ><svg viewBox="0 0 32 28"
            ><rect x="3" y="2" width="26" height="18" rx="2" /><path d="M16 20v6m-7 0h14" /></svg
          ></span
        ><span>Computer</span>
      </div>
      <div class="build-layer circuit-layer">
        <span class="layer-symbol" aria-hidden="true"
          ><svg viewBox="0 0 32 28"
            ><rect x="10" y="7" width="12" height="14" rx="1" /><path
              d="M2 4h4v7h4M2 24h4v-7h4m12-6h5V4h3m-8 13h5v7h3"
            /></svg
          ></span
        ><span>Circuits</span>
      </div>
      <div class="build-layer gates-layer">
        <span class="layer-symbol" aria-hidden="true"
          ><svg viewBox="0 0 32 28"
            ><path d="M8 4h5a10 10 0 0 1 0 20H8ZM1 9h7m-7 10h7m19-5h5" /><circle
              cx="25"
              cy="14"
              r="2"
            /></svg
          ></span
        ><span>Gates</span>
      </div>
      <div class="build-layer signal-layer">
        <span class="layer-symbol" aria-hidden="true">0 1</span><span>Signals</span><span
          class="you-start">You start here</span
        >
      </div>
    </div>
  </section>
</div>

<style>
  .computer-journey {
    background: #080b15;
    color: #f4f2fc;
  }
  .computer-journey *,
  .computer-journey *::before,
  .computer-journey *::after {
    box-sizing: border-box;
  }
  button {
    font: inherit;
    cursor: pointer;
    touch-action: manipulation;
  }
  button:focus-visible {
    outline: 3px solid currentColor !important;
    outline-offset: 5px;
  }
  .journey-layout {
    display: grid;
    grid-template-columns: 0.88fr 1.3fr;
    gap: 0;
    max-width: 1600px;
    margin: auto;
    padding: 0 4.5%;
  }
  .journey-copy {
    min-width: 0;
  }
  .journey-chapter {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    padding: 100px 0;
  }
  .journey-chapter.opening {
    min-height: calc(100svh - 84px);
    padding: 64px 0 115px;
  }
  .chapter-copy {
    max-width: 450px;
    position: relative;
    z-index: 1;
  }
  h1 {
    font-size: clamp(46px, 5.1vw, 79px);
    line-height: 1.015;
    font-weight: 500;
    letter-spacing: -0.065em;
    margin: 0;
  }
  h1 em {
    font-style: normal;
    color: #c3b2ff;
  }
  .opening-promise {
    margin: 27px 0 32px;
    font-size: clamp(20px, 1.85vw, 28px);
    line-height: 1.4;
    letter-spacing: -0.02em;
    color: #c4c5d6;
  }
  .start-button {
    display: inline-flex;
    align-items: center;
    gap: 35px;
    min-height: 49px;
    padding: 14px 20px;
    background: #6350e9;
    border: 1px solid #a395ff;
    border-radius: 3px;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }
  .start-button:hover {
    background: #705be8;
  }
  .start-button > span {
    font-size: 20px;
    line-height: 0.9;
  }
  .opening-note {
    color: #b6b8cd;
    font-size: 12px;
    line-height: 1.6;
    margin: 18px 0 0;
  }
  .scroll-note {
    position: absolute;
    bottom: 32px;
    left: 0;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11px;
    color: #b6b8cd;
  }
  .scroll-note span {
    color: #cabaff;
    font-size: 19px;
  }
  .chapter-label {
    display: flex;
    gap: 20px;
    align-items: center;
    font:
      11px/1.5 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.07em;
    color: #b6b8cd;
    margin: 0 0 26px;
  }
  .chapter-label > span {
    color: #d3c7ff;
  }
  .chapter-copy h2 {
    margin: 0;
    font-size: clamp(38px, 4.25vw, 64px);
    font-weight: 500;
    line-height: 1.06;
    letter-spacing: -0.055em;
  }
  .chapter-description {
    font-size: clamp(16px, 1.4vw, 19px);
    color: #c4c5d6;
    line-height: 1.7;
    max-width: 335px;
    margin: 27px 0 0;
  }
  .visual-column {
    min-width: 0;
  }
  .computer-stage {
    position: sticky;
    top: max(34px, calc(50svh - 335px));
    display: flex;
    justify-content: center;
    flex-direction: column;
    width: calc(100% + 5%);
    margin-left: -1%;
    height: min(690px, 92svh);
  }
  .computer-stage :global(svg) {
    width: 100%;
    max-height: calc(100% - 30px);
  }
  .scene-caption {
    display: flex;
    justify-content: space-between;
    margin: 8px 9% 0;
    color: #9697b0;
    font:
      9px/1.5 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    letter-spacing: 0.12em;
  }
  .inline-scene {
    display: none;
  }
  .journey-start {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 10%;
    color: #181629;
    background: #f1eff8;
    border-top: 1px solid #d7d2e6;
    padding: 110px max(6%, calc((100vw - 1320px) / 2));
  }
  .journey-start .chapter-label {
    color: #4e4766;
  }
  .journey-start h2 {
    font-size: clamp(44px, 5.6vw, 78px);
    line-height: 1.02;
    font-weight: 500;
    letter-spacing: -0.06em;
    margin: 0;
  }
  .closing-copy > p:not(.chapter-label):not(.availability-note) {
    color: #4b465d;
    font-size: 17px;
    line-height: 1.7;
    max-width: 375px;
    margin: 29px 0 30px;
  }
  .journey-start .start-button {
    background: #4f3dd1;
    border-color: #4f3dd1;
  }
  .journey-start .start-button:focus-visible {
    outline-color: #4432b0 !important;
  }
  .journey-start .start-button:hover {
    background: #3e2db8;
  }
  .availability-note {
    font-size: 12px;
    line-height: 1.6;
    color: #565068;
    max-width: 320px;
    margin: 25px 0 10px;
  }
  .intro-link {
    padding: 12px 0;
    color: #4432b0;
    font-size: 12px;
    text-decoration: underline;
    text-underline-offset: 5px;
    text-decoration-color: #ada5cf;
  }
  .intro-link span {
    margin-left: 6px;
  }
  .build-up {
    display: flex;
    flex-direction: column;
    gap: 13px;
    padding: 15px 0;
  }
  .build-layer {
    display: flex;
    align-items: center;
    gap: 28px;
    min-height: 68px;
    border-top: 1px solid #bbb5ce;
    border-bottom: 1px solid #d4cee3;
    padding: 13px 24px;
    color: #49415c;
    background: #e9e6f2;
    transform: skewY(-6deg);
  }
  .build-layer > * {
    transform: skewY(6deg);
  }
  .layer-symbol {
    width: 43px;
    color: #655c7c;
    font:
      21px/1 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .layer-symbol svg {
    width: 30px;
    height: 27px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.2;
  }
  .build-layer > span:nth-child(2) {
    font-size: 15px;
  }
  .computer-layer {
    margin-left: 11px;
    margin-right: -11px;
    background: #ded9ed;
  }
  .circuit-layer {
    margin-left: 22px;
    margin-right: -22px;
    background: #d2cce5;
  }
  .gates-layer {
    margin-left: 33px;
    margin-right: -33px;
    background: #c3bbda;
    color: #302742;
  }
  .signal-layer {
    margin-left: 44px;
    margin-right: -44px;
    background: #19162d;
    border-color: #5c507e;
    color: #f2edff;
  }
  .signal-layer .layer-symbol {
    color: #cfbdff;
  }
  .you-start {
    margin-left: auto;
    font:
      10px/1.5 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    color: #d2c8e7;
  }
  .reduced-motion .visual-column {
    display: none;
  }
  .reduced-motion .journey-layout {
    display: block;
  }
  .reduced-motion .journey-chapter {
    display: grid;
    grid-template-columns: 0.88fr 1.3fr;
    gap: 0;
    min-height: 660px;
    padding: 55px 0;
  }
  .reduced-motion .inline-scene {
    display: block;
  }
  .reduced-motion .scroll-note {
    display: none;
  }
  @media (min-width: 1600px) {
    .journey-chapter {
      min-height: 950px;
    }
  }
  @media (max-width: 1040px) {
    .journey-layout {
      grid-template-columns: 1fr 1.1fr;
      padding: 0 4%;
    }
    h1 {
      font-size: clamp(44px, 5.8vw, 61px);
    }
    .computer-stage {
      width: 114%;
      margin-left: -6%;
    }
    .journey-start {
      gap: 6%;
      padding: 85px 6%;
    }
    .build-layer {
      padding: 12px 16px;
      gap: 15px;
    }
    .build-up {
      margin-right: 35px;
    }
    .you-start {
      font-size: 9px;
    }
  }
  @media (max-width: 720px) {
    .journey-layout,
    .reduced-motion .journey-layout {
      display: block;
      padding: 0;
    }
    .visual-column {
      display: none;
    }
    .journey-chapter,
    .journey-chapter.opening,
    .reduced-motion .journey-chapter {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      min-height: 0;
      padding: 65px 7% 20px;
    }
    .journey-chapter.opening {
      padding-top: 46px;
    }
    .chapter-copy {
      max-width: 520px;
    }
    h1 {
      max-width: 520px;
      font-size: clamp(46px, 9.3vw, 66px);
    }
    .opening-promise {
      font-size: 22px;
      margin: 23px 0 26px;
    }
    .opening-note {
      font-size: 11px;
    }
    .scroll-note {
      position: static;
      margin: -4px 0 22px;
      font-size: 10px;
    }
    .inline-scene {
      display: block;
      width: calc(100% + 10%);
      margin: 12px -5% 0;
    }
    .chapter-label {
      margin-bottom: 20px;
      font-size: 10px;
    }
    .chapter-copy h2 {
      font-size: clamp(36px, 7.7vw, 52px);
      max-width: 420px;
    }
    .chapter-description {
      font-size: 16px;
      max-width: 390px;
      margin-top: 22px;
    }
    .journey-chapter + .journey-chapter {
      border-top: 1px solid #24283b;
    }
    .journey-start {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 45px;
      padding: 70px 7%;
    }
    .journey-start h2 {
      font-size: clamp(45px, 9.5vw, 68px);
    }
    .closing-copy > p:not(.chapter-label):not(.availability-note) {
      font-size: 16px;
    }
    .build-up {
      margin: 0 30px 12px 0;
      gap: 10px;
    }
    .build-layer {
      min-height: 55px;
      gap: 13px;
      padding: 10px 14px;
    }
    .build-layer > span:nth-child(2) {
      font-size: 13px;
    }
    .layer-symbol {
      font-size: 19px;
      width: 35px;
    }
    .computer-layer {
      margin-left: 7px;
      margin-right: -7px;
    }
    .circuit-layer {
      margin-left: 14px;
      margin-right: -14px;
    }
    .gates-layer {
      margin-left: 21px;
      margin-right: -21px;
    }
    .signal-layer {
      margin-left: 28px;
      margin-right: -28px;
    }
    .you-start {
      font-size: 8px;
    }
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import LayerScene from './LayerScene.svelte';

  export let onstart: () => void;
  export let onwatch: () => void;
  export let continuing = false;

  const chapters = [
    {
      id: 'logic',
      name: 'Signals & logic',
      title: 'Start with a signal.',
      body: 'Off or on. Zero or one. Begin with a single bit, then connect simple gates.',
      color: '#080a11',
      ink: '#ffffff',
      accent: '#b3aaff',
    },
    {
      id: 'arithmetic',
      name: 'Arithmetic',
      title: 'Make it add.',
      body: 'The gates you build become the parts of a calculator.',
      color: '#191d31',
      ink: '#ffffff',
      accent: '#b3aaff',
    },
    {
      id: 'memory',
      name: 'Memory',
      title: 'Give it a memory.',
      body: 'Hold on to a value. Use it again when the next signal arrives.',
      color: '#424963',
      ink: '#ffffff',
      accent: '#e2dcff',
    },
    {
      id: 'architecture',
      name: 'Architecture',
      title: 'Bring it together.',
      body: 'Connect calculation, memory, and control. A computer begins to take shape.',
      color: '#b5b9ca',
      ink: '#10121d',
      accent: '#4338ca',
    },
    {
      id: 'software',
      name: 'Software',
      title: 'Tell it what to do.',
      body: 'Write a program for the machine you understand, from the signals up.',
      color: '#f2f1f7',
      ink: '#10121d',
      accent: '#4f46e5',
    },
  ];

  let story: HTMLElement;
  let reducedMotion = false;
  let activeLayer = 0;
  let travel = 0;
  let heroTravel = 0;
  let background = chapters[0].color;
  let foreground = chapters[0].ink;
  let accent = chapters[0].accent;
  let localTravel = [0, 0, 0, 0, 0];

  const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const channels = (hex: string) =>
    [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  function blend(from: string, to: string, amount: number) {
    const a = channels(from);
    const b = channels(to);
    const values = a.map((value, index) => Math.round(value + (b[index] - value) * amount));
    const linear = values.map((value) => {
      const v = value / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    return {
      color: `rgb(${values.join(',')})`,
      ink: luminance > 0.18 ? '#000000' : '#ffffff',
      light: luminance > 0.18,
    };
  }

  onMount(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = preference.matches;
    const sections = Array.from(story.querySelectorAll<HTMLElement>('[data-layer]'));
    let frame = 0;

    function update() {
      frame = 0;
      const height = window.innerHeight;
      const center = height * 0.5;
      const centers = sections.map((section) => {
        const box = section.getBoundingClientRect();
        return box.top + box.height * 0.5;
      });
      localTravel = centers.map((position) => clamp((center - position) / height, -1, 1));
      const closest = centers.reduce(
        (best, position, index) =>
          Math.abs(position - center) < Math.abs(centers[best] - center) ? index : best,
        0,
      );
      activeLayer = closest;
      travel = reducedMotion ? 0 : localTravel[closest];
      heroTravel = reducedMotion ? 0 : clamp(window.scrollY / height, 0, 1);
      const lower = Math.max(0, centers.findIndex((position) => position >= center) - 1);
      let progress = 0;
      if (center >= centers[centers.length - 1]) progress = chapters.length - 1;
      else if (center > centers[0])
        progress = lower + clamp((center - centers[lower]) / (centers[lower + 1] - centers[lower]));
      const index = Math.floor(progress);
      const next = Math.min(chapters.length - 1, index + 1);
      const palette = blend(chapters[index].color, chapters[next].color, progress - index);
      background = palette.color;
      foreground = palette.ink;
      // Keep schematic accents distinct while text always has full contrast.
      accent = palette.light ? '#4338ca' : '#c0b5ff';
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

<div class="quiet-landing" class:reduced-motion={reducedMotion}>
  <section class="opening" aria-labelledby="journey-heading">
    <div class="opening-copy">
      <h1 id="journey-heading" tabindex="-1">Wondering how{' '}<br />computers <em>work?</em></h1>
      <p>Build your own computer from scratch,<br class="desktop-break" /> from chips to code.</p>
      <button class="start-button" onclick={onstart}
        >{continuing ? 'Continue learning' : 'Start learning'}<span aria-hidden="true">↗</span
        ></button
      >
      <span class="opening-note">No prerequisites. Free in your browser.</span>
    </div>
    <div class="opening-art" aria-hidden="true">
      <svg viewBox="0 0 720 650" fill="none">
        <path d="M356 100V552" class="stack-axis" />
        {#each [0, 1, 2, 3, 4] as index}
          <g transform={`translate(0,${index * -57 + heroTravel * (index + 1) * -13})`}>
            <path
              d="M73 447 318 302 658 437 413 582Z"
              class="stack-plane"
              class:foundation={index === 0}
              style={`--plane-opacity:${0.4 + index * 0.1}`}
            />
            {#if index === 0}
              <path d="M162 450 272 385 407 438 483 393 567 426" class="stack-trace" />
              <circle cx="162" cy="450" r="4" class="stack-node" /><circle
                cx="567"
                cy="426"
                r="4"
                class="stack-node"
              />
            {:else if index === 1}
              <path d="M232 445 320 393 464 449 376 501Z" class="stack-detail" />
              <path d="M274 424 418 480M290 410 434 466M306 400 450 456" class="stack-detail" />
            {:else if index === 2}
              <path
                d="M251 422 317 383 460 440 394 479ZM280 433 346 394M309 445 375 406M338 456 404 418M367 467 433 429"
                class="stack-detail"
              />
            {:else if index === 3}
              <path
                d="M250 425 330 378 466 432 386 479ZM278 420 334 387 438 428 382 461Z"
                class="stack-detail"
              />
            {:else}
              <path d="m303 403-30 18 27 11m77-38 26 11-30 18m-18-36-31 49" class="stack-code" />
            {/if}
          </g>
        {/each}
      </svg>
    </div>
    <p class="scroll-note"><span aria-hidden="true">↓</span> A computer, one layer at a time</p>
  </section>

  <div
    class="layer-story"
    bind:this={story}
    style={`--story-bg:${background};--story-ink:${foreground};--story-accent:${accent}`}
  >
    <div class="story-layout">
      <div class="story-copy">
        {#each chapters as chapter, index}
          <section
            id={`layer-${chapter.id}`}
            class="story-chapter"
            data-layer={index}
            aria-labelledby={`title-${chapter.id}`}
            style={`--chapter-bg:${chapter.color};--chapter-ink:${chapter.ink};--chapter-accent:${chapter.accent}`}
          >
            <div class="chapter-copy">
              <p class="chapter-name">
                <span aria-hidden="true">{String(index).padStart(2, '0')}</span>{chapter.name}
              </p>
              <h2 id={`title-${chapter.id}`}>{chapter.title}</h2>
              <p class="chapter-description">{chapter.body}</p>
            </div>
            <div class="inline-scene">
              <LayerScene layer={index} travel={localTravel[index]} {reducedMotion} />
            </div>
          </section>
        {/each}
      </div>
      <div class="visual-column" aria-hidden={reducedMotion ? 'true' : undefined}>
        <div class="parallax-stage" data-active-layer={chapters[activeLayer].id}>
          <LayerScene layer={activeLayer} {travel} {reducedMotion} />
        </div>
      </div>
    </div>
  </div>

  <section class="journey-start" aria-labelledby="start-heading">
    <p class="closing-label">Start at the beginning</p>
    <h2 id="start-heading">One signal.{' '}<br />Then the next.</h2>
    <p>We’ll introduce each idea and tool as you need it.</p>
    <button class="start-button" onclick={onstart}
      >{continuing ? 'Continue learning' : 'Start learning'}<span aria-hidden="true">↗</span
      ></button
    >
    <p class="availability-note">
      Begin with logic today. The higher layers are the journey ahead.
    </p>
    <button class="intro-link" onclick={onwatch}
      >Watch the introduction <span aria-hidden="true">↗</span></button
    >
  </section>
</div>

<style>
  .quiet-landing {
    background: #080a11;
    color: #f5f4fc;
  }
  .quiet-landing *,
  .quiet-landing *::before,
  .quiet-landing *::after {
    box-sizing: border-box;
  }
  button {
    font-family: inherit;
    cursor: pointer;
    touch-action: manipulation;
  }
  button:focus-visible {
    outline: 2px solid currentColor !important;
    outline-offset: 6px;
  }
  .opening {
    position: relative;
    max-width: 1480px;
    margin: auto;
    min-height: min(790px, calc(100svh - 80px));
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    align-items: center;
    gap: 2%;
    padding: 65px 5% 104px;
    overflow: hidden;
  }
  .opening-copy {
    position: relative;
    z-index: 1;
  }
  h1 {
    font-size: clamp(42px, 4.6vw, 70px);
    line-height: 1.06;
    font-weight: 500;
    letter-spacing: -0.055em;
    margin: 0;
  }
  h1 em {
    color: #b3aaff;
    font-style: normal;
  }
  .opening-copy > p {
    font-size: clamp(15px, 1.3vw, 18px);
    line-height: 1.7;
    margin: 26px 0 30px;
    color: #b7b9ca;
  }
  .start-button {
    min-height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 35px;
    border: 1px solid #746bf6;
    border-radius: 3px;
    background: #4f46e5;
    color: #fff;
    padding: 13px 19px;
    font-size: 14px;
    font-weight: 550;
  }
  .start-button:hover {
    background: #5b50ec;
  }
  .start-button > span {
    font-size: 19px;
    line-height: 1;
  }
  .opening-note {
    display: block;
    margin-top: 17px;
    font-size: 12px;
    color: #aeb0c2;
  }
  .opening-art {
    width: 100%;
    max-width: 690px;
    justify-self: end;
  }
  .opening-art svg {
    width: 100%;
    display: block;
    overflow: visible;
  }
  .stack-axis {
    stroke: #55516f;
    stroke-dasharray: 2 6;
    stroke-opacity: 0.3;
  }
  .stack-plane {
    fill: #0f1020;
    fill-opacity: 0.82;
    stroke: #8880b6;
    stroke-width: 1;
    stroke-opacity: var(--plane-opacity);
  }
  .stack-plane.foundation {
    stroke: #a79aff;
    stroke-opacity: 0.9;
  }
  .stack-trace {
    stroke: #b3aaff;
    stroke-width: 1.8;
  }
  .stack-node {
    fill: #b3aaff;
  }
  .stack-detail {
    stroke: #9189b9;
    stroke-opacity: 0.65;
    stroke-width: 1;
  }
  .stack-code {
    stroke: #c8c0ff;
    stroke-width: 2;
  }
  .scroll-note {
    position: absolute;
    bottom: 34px;
    left: 5%;
    margin: 0;
    display: flex;
    gap: 14px;
    align-items: center;
    font-size: 11px;
    color: #aeb0c2;
  }
  .scroll-note > span {
    color: #b3aaff;
    font-size: 16px;
  }
  .layer-story {
    background: var(--story-bg);
    color: var(--story-ink);
  }
  .story-layout {
    max-width: 1480px;
    margin: auto;
    display: grid;
    grid-template-columns: 0.85fr 1.15fr;
    gap: 5%;
    padding: 0 5%;
  }
  .story-chapter {
    min-height: 74svh;
    min-height: max(470px, 74svh);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 70px 0;
    scroll-margin-top: 0;
  }
  .chapter-copy {
    max-width: 385px;
  }
  .chapter-name {
    font:
      12px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    display: flex;
    align-items: center;
    gap: 19px;
    margin: 0 0 30px;
  }
  .chapter-name > span {
    font-size: 10px;
  }
  .chapter-copy h2 {
    font-size: clamp(34px, 3.6vw, 55px);
    line-height: 1.09;
    letter-spacing: -0.045em;
    font-weight: 500;
    margin: 0;
  }
  .chapter-description {
    font-size: 16px;
    line-height: 1.7;
    margin: 24px 0 0;
    max-width: 340px;
  }
  .visual-column {
    min-width: 0;
  }
  .parallax-stage {
    position: sticky;
    top: max(20px, calc(50svh - 250px));
    display: flex;
    align-items: center;
    height: min(500px, 80svh);
    width: 100%;
  }
  .inline-scene {
    display: none;
  }
  .journey-start {
    background: #f2f1f7;
    color: #10121d;
    text-align: center;
    padding: 100px 24px 90px;
    border-top: 1px solid #dcdbe6;
  }
  .closing-label {
    font:
      12px ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    color: #525269;
    margin: 0 0 28px;
  }
  .journey-start h2 {
    font-size: clamp(40px, 5vw, 64px);
    line-height: 1.06;
    letter-spacing: -0.055em;
    font-weight: 500;
    margin: 0;
  }
  .journey-start > p:not(.closing-label):not(.availability-note) {
    font-size: 16px;
    line-height: 1.7;
    margin: 24px auto 29px;
    max-width: 350px;
    color: #505166;
  }
  .availability-note {
    font-size: 12px;
    line-height: 1.7;
    max-width: 320px;
    margin: 26px auto 12px;
    color: #57596f;
  }
  .intro-link {
    color: #4338ca;
    font-size: 12px;
    padding: 12px 3px;
    text-decoration: underline;
    text-decoration-color: #b8b3de;
    text-underline-offset: 5px;
  }
  .intro-link span {
    margin-left: 7px;
  }
  .reduced-motion .visual-column {
    display: none;
  }
  .reduced-motion .story-layout {
    display: block;
    max-width: none;
    padding: 0;
  }
  .reduced-motion .story-chapter {
    display: grid;
    grid-template-columns: 0.85fr 1.15fr;
    align-items: center;
    gap: 5%;
    padding: 45px max(5%, calc((100vw - 1332px) / 2));
    min-height: 580px;
    background: var(--chapter-bg);
    color: var(--chapter-ink);
  }
  .reduced-motion .inline-scene {
    display: block;
    --story-bg: var(--chapter-bg);
    --story-ink: var(--chapter-ink);
    --story-accent: var(--chapter-accent);
  }
  @media (min-width: 1600px) {
    .story-chapter {
      min-height: 670px;
    }
  }
  @media (max-width: 900px) {
    .opening {
      min-height: 650px;
      padding-top: 35px;
      padding-bottom: 100px;
    }
    .opening-art {
      margin-right: -50px;
      width: calc(100% + 70px);
    }
    .chapter-copy h2 {
      font-size: 39px;
    }
    .chapter-description {
      font-size: 15px;
    }
    .story-layout {
      gap: 2%;
      grid-template-columns: 0.9fr 1.1fr;
    }
  }
  @media (max-width: 680px) {
    .opening {
      grid-template-columns: 1fr;
      min-height: auto;
      padding: 57px 7% 74px;
      gap: 25px;
    }
    h1 {
      font-size: clamp(40px, 8.3vw, 57px);
    }
    .opening-copy > p {
      font-size: 15px;
      margin: 24px 0;
    }
    .opening-note {
      font-size: 11px;
    }
    .opening-art {
      width: min(100%, 440px);
      margin: -8px auto -3px;
      justify-self: center;
    }
    .opening-art svg {
      max-height: 310px;
    }
    .scroll-note {
      left: 7%;
      bottom: 29px;
      font-size: 10px;
      gap: 10px;
    }
    .story-layout,
    .reduced-motion .story-layout {
      display: block;
      padding: 0;
    }
    .visual-column {
      display: none;
    }
    .story-chapter,
    .reduced-motion .story-chapter {
      display: flex;
      min-height: 0;
      padding: 59px 7% 24px;
      gap: 0;
      background: var(--chapter-bg);
      color: var(--chapter-ink);
    }
    .chapter-copy {
      max-width: 410px;
    }
    .chapter-name {
      font-size: 11px;
      margin-bottom: 23px;
    }
    .chapter-copy h2 {
      font-size: clamp(34px, 7vw, 44px);
    }
    .chapter-description {
      font-size: 15px;
      margin-top: 21px;
      max-width: 340px;
    }
    .inline-scene {
      display: block;
      width: calc(100% + 12%);
      max-width: 520px;
      margin: 12px -6% -4px;
      align-self: center;
      --story-bg: var(--chapter-bg);
      --story-ink: var(--chapter-ink);
      --story-accent: var(--chapter-accent);
    }
    .journey-start {
      padding: 75px 7% 65px;
    }
    .journey-start > p:not(.closing-label):not(.availability-note) {
      font-size: 15px;
    }
  }
</style>

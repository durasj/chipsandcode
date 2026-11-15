<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { resolve } from '$app/paths';
  import Scene from './Scene.svelte';
  import Runtime from './Runtime.svelte';
  import { readJourneyEvidence, journeyBypassed } from './progress';
  import { draftParts, getJourneyStep, journeyStatus, journeySteps, layers } from './data';
  export let currentId = 'intro/signal';
  export let completed: string[] = [];
  export let verified = false;
  export let source = '';
  export let live: Record<string, number | boolean> = {};
  export let actualParts: string[] | undefined = undefined;
  export let overview = false;
  let stored: string[] = [];
  let bypassed: string[] = [];
  let inspectedId = currentId;
  let outside = overview;
  let mounted = false;
  let reducedMotion = false;
  let animating = false;
  let replay = 0;
  let signature = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let sceneHeading: HTMLHeadingElement;
  $: evidence = [...new Set([...stored, ...completed, ...(verified ? [currentId] : [])])];
  $: active = getJourneyStep(currentId);
  $: inspected = getJourneyStep(inspectedId);
  $: done = evidence.includes(currentId);
  $: status = journeyStatus(inspected, currentId, evidence, bypassed);
  $: parts = actualParts ?? draftParts(source);
  $: countedParts = [...new Set(parts)].map(
    (part) => `${part} × ${parts.filter((value) => value === part).length}`,
  );
  $: if (mounted && signature !== `${currentId}:${done}`) {
    signature = `${currentId}:${done}`;
    inspectedId = currentId;
    outside = overview || (done && !currentId.startsWith('intro/'));
    reveal();
  }
  onMount(() => {
    const refreshEvidence = () => {
      try {
        const snapshot = readJourneyEvidence(localStorage);
        stored = snapshot.completed;
        bypassed = snapshot.bypassed;
      } catch {
        // Some privacy modes deny access to the storage object itself.
        stored = [];
        bypassed = [];
      }
    };
    const updateChoices = (event: Event) => {
      if (event instanceof CustomEvent) bypassed = journeyBypassed(event.detail);
      else refreshEvidence();
    };
    refreshEvidence();
    window.addEventListener('storage', refreshEvidence);
    window.addEventListener('chipsandcode:learning-choices-changed', updateChoices);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      reducedMotion = media.matches;
      if (reducedMotion) skip();
    };
    update();
    media.addEventListener('change', update);
    mounted = true;
    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('storage', refreshEvidence);
      window.removeEventListener('chipsandcode:learning-choices-changed', updateChoices);
      clearTimeout(timer);
    };
  });
  function reveal() {
    clearTimeout(timer);
    replay++;
    animating = !reducedMotion;
    if (animating)
      timer = setTimeout(() => {
        animating = false;
      }, 650);
  }
  function skip() {
    clearTimeout(timer);
    animating = false;
  }
  function view(mode: boolean) {
    outside = mode;
    reveal();
  }
  async function inspect(id: string) {
    inspectedId = id;
    outside = false;
    reveal();
    await tick();
    sceneHeading?.focus({ preventScroll: true });
  }
</script>

<section
  class="learning-journey"
  data-journey-step={inspected.id}
  data-journey-view={outside ? 'system' : 'inside'}
  data-journey-status={status}
  aria-label="Your growing computer"
>
  <div class="journey-topline">
    <span class="journey-eyebrow"
      >{overview ? 'EXPLORE THE MACHINE' : 'ONE PIECE OF THE WHOLE'}</span
    >
    <span class="journey-status" class:verified={evidence.includes(inspected.id)}>{status}</span>
  </div>
  <div class="journey-heading">
    <div>
      <h2 bind:this={sceneHeading} tabindex="-1">
        {inspected.label}<span>{outside ? 'in the bigger picture.' : 'takes shape.'}</span>
      </h2>
      <p>{inspected.change}</p>
    </div>
    <div class="view-controls" aria-label="Diagram view">
      <button aria-pressed={!outside} on:click={() => view(false)}>Inside this piece</button>
      <button aria-pressed={outside} on:click={() => view(true)}
        >Zoom out <span aria-hidden="true">↗</span></button
      >
    </div>
  </div>
  <div
    class="scene-stage"
    class:revealing={animating}
    class:zooming={outside}
    data-motion={reducedMotion ? 'reduced' : 'full'}
  >
    {#key `${inspected.id}:${outside}:${replay}`}<Scene
        step={inspected}
        {outside}
        verified={evidence.includes(inspected.id)}
        completed={evidence}
        live={inspected.id === currentId ? live : {}}
      />{/key}
    <div class="scene-caption">
      <span
        >{outside
          ? 'Functional relationships · not physical scale'
          : 'Conceptual composition · valid designs can differ'}</span
      >
      {#if !reducedMotion}<button on:click={animating ? skip : reveal}
          >{animating ? 'Skip animation' : 'Replay reveal'}</button
        >{/if}
    </div>
  </div>
  {#if inspected.inputs.length || inspected.outputs.length}<p class="interface-note">
      <span>Interface</span>
      {inspected.inputs.join(' · ') || 'program / reset'} → {inspected.outputs.join(' · ') ||
        'internal memory + devices'}
    </p>{/if}
  {#if inspected.id === currentId && Object.keys(live).length}<p class="interface-note">
      <span>Live signals</span>
      {Object.entries(live)
        .map(([pin, value]) => `${pin} = ${Number(value)}`)
        .join(' · ')}
    </p>{/if}
  {#if done && !verified && inspected.id === currentId}<p class="supplied-note">
      Previously verified. Check the current draft again to verify any edits.
    </p>{/if}
  <div class="journey-meaning">
    <p><span>BUILDS ON</span>{inspected.prior}</p>
    <p><span>MAKES POSSIBLE</span>{inspected.next}</p>
  </div>
  {#if inspected.id === currentId && parts.length}
    <p class="draft-identity">
      <span>Your current design</span>
      {countedParts.join(' · ')}. {verified
        ? 'This draft passed its checks.'
        : 'Shown from your draft; check it to verify the connections.'}
    </p>
  {/if}
  {#if inspected.supplied}<p class="supplied-note">
      {inspected.id === 'missions/nand'
        ? 'NAND is a supplied primitive. You characterize its behavior before building with it.'
        : 'This gate is supplied for observation here. You will construct its behavior in the gate missions.'}
    </p>{/if}
  <nav class="layer-browser" aria-label="Explore the learning layers">
    {#each layers as layer (layer.id)}
      <button
        aria-pressed={inspected.layer === layer.id}
        on:click={() => inspect(journeySteps.find((step) => step.layer === layer.id)!.id)}
        ><span>{layer.label}</span></button
      >
    {/each}
  </nav>
  <div class="journey-browser">
    <label
      >Explore a step<select
        aria-label="Explore a visual learning step"
        value={inspectedId}
        on:change={(event) => inspect(event.currentTarget.value)}
      >
        {#each layers as layer (layer.id)}<optgroup label={layer.label}
            >{#each journeySteps.filter((step) => step.layer === layer.id) as step (step.id)}<option
                value={step.id}
                >{step.label} · {journeyStatus(step, currentId, evidence, bypassed)}</option
              >{/each}</optgroup
          >{/each}
      </select></label
    >
    {#if inspected.id !== currentId}<button
        class="return-button"
        on:click={() => inspect(currentId)}>Return to {active.label}</button
      >{/if}
    {#if overview || inspected.id !== currentId}<a href={resolve(inspected.href as '/learn')}
        >Open this lesson →</a
      >{/if}
  </div>
  {#if ['machine-language/fill', 'architecture/computer', 'assembler/assembler'].includes(inspected.id)}
    <Runtime
      {source}
      allowStudent={currentId === 'machine-language/fill' && inspected.id === currentId}
    />
  {/if}
</section>

<style>
  .learning-journey {
    --j-border: #343a51;
    color: #f1eefb;
    text-align: left;
    border: 1px solid var(--j-border);
    border-radius: 9px;
    background: linear-gradient(145deg, #141626, #0c101a 75%);
    margin: 28px 0 34px;
    padding: clamp(18px, 3vw, 30px);
    box-sizing: border-box;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }
  .learning-journey * {
    box-sizing: border-box;
  }
  .journey-topline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 22px;
  }
  .journey-eyebrow {
    color: #bcb0ed;
    font:
      10px/1.5 ui-monospace,
      monospace;
    letter-spacing: 0.12em;
  }
  .journey-status {
    font:
      10px/1.5 ui-monospace,
      monospace;
    color: #b7bfd1;
    border: 1px solid #4c5168;
    border-radius: 3px;
    padding: 3px 7px;
  }
  .journey-status.verified {
    color: #d6caff;
    border-color: #9280bf;
  }
  .journey-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 25px;
  }
  .journey-heading h2 {
    color: #f0edf8;
    margin: 0;
    font-size: clamp(23px, 3vw, 33px);
    font-weight: 500;
    line-height: 1.15;
    letter-spacing: -0.035em;
  }
  h2 span {
    display: block;
    color: #aea3ce;
  }
  h2:focus {
    outline: none !important;
  }
  .journey-heading p {
    color: #c0c4d5;
    max-width: 570px;
    font-size: 13px;
    line-height: 1.6;
    margin: 14px 0 18px;
  }
  .view-controls {
    flex-shrink: 0;
    display: flex;
    border: 1px solid #50516c;
    border-radius: 4px;
    overflow: hidden;
  }
  button,
  a,
  select {
    font: 12px/1.5 inherit;
  }
  button {
    cursor: pointer;
    color: #c1bed3;
    background: transparent;
    border: 0;
    min-height: 38px;
  }
  .view-controls button {
    padding: 8px 12px;
    font-size: 11px;
  }
  .view-controls button[aria-pressed='true'] {
    background: #322844;
    color: #eaddff;
  }
  .view-controls button:hover {
    background: #2a263c;
  }
  .scene-stage {
    overflow: hidden;
    border-radius: 6px;
    background: radial-gradient(ellipse at 50% 50%, #25203944, transparent 70%);
  }
  .scene-stage.revealing :global(.schematic) {
    animation: reveal-piece 0.65s cubic-bezier(0.2, 0.7, 0.3, 1) both;
  }
  .scene-stage.revealing.zooming :global(.schematic) {
    animation: reveal-system 0.65s cubic-bezier(0.2, 0.7, 0.3, 1) both;
  }
  @keyframes reveal-piece {
    from {
      opacity: 0.35;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes reveal-system {
    from {
      opacity: 0.35;
      transform: scale(1.07);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .scene-caption {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    min-height: 35px;
    color: #aab2c7;
    font:
      9px/1.5 ui-monospace,
      monospace;
    padding: 0 10px;
  }
  .scene-caption button {
    color: #c9bdf0;
    font-size: 10px;
    text-decoration: underline;
    text-underline-offset: 3px;
    flex-shrink: 0;
  }
  .journey-meaning {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 26px;
    padding: 20px 0;
    border-top: 1px solid var(--j-border);
    margin-top: 12px;
  }
  .journey-meaning p {
    color: #c2c5d5;
    font-size: 12px;
    line-height: 1.65;
    margin: 0;
  }
  .journey-meaning span {
    display: block;
    color: #aa9ed2;
    font:
      9px/1.5 ui-monospace,
      monospace;
    letter-spacing: 0.09em;
    margin-bottom: 7px;
  }
  .interface-note {
    color: #b8bdd2;
    font:
      10px/1.7 ui-monospace,
      monospace;
    overflow-wrap: anywhere;
    margin: 10px 0;
  }
  .interface-note span {
    color: #c8b9f5;
    margin-right: 8px;
  }
  .draft-identity,
  .supplied-note {
    font-size: 11px;
    color: #aeb7ce;
    line-height: 1.7;
    margin: 0 0 18px;
  }
  .draft-identity span {
    color: #d1c5f4;
  }
  .layer-browser {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    border-top: 1px solid var(--j-border);
    padding: 13px 0;
  }
  .layer-browser button {
    min-height: 33px;
    padding: 5px 9px;
    border-radius: 3px;
    font-size: 10px;
    color: #aeb7cb;
  }
  .layer-browser button[aria-pressed='true'] {
    background: #302741;
    color: #e1d5ff;
  }
  .layer-browser button:hover {
    background: #1e2032;
  }
  .journey-browser {
    display: flex;
    gap: 13px;
    flex-wrap: wrap;
    align-items: end;
  }
  label {
    font-size: 10px;
    color: #aeb7cb;
    min-width: 0;
    flex: 1;
    max-width: 390px;
  }
  select {
    display: block;
    margin-top: 6px;
    width: 100%;
    min-height: 38px;
    background: #111625;
    border: 1px solid #555770;
    border-radius: 3px;
    color: #e3def2;
    padding: 8px;
    font-size: 11px;
  }
  .return-button,
  a {
    color: #d6c9ff;
    font-size: 11px;
    text-decoration: underline;
    text-underline-offset: 4px;
    padding: 8px 0;
  }
  button:focus-visible,
  a:focus-visible,
  select:focus-visible {
    outline: 2px solid #d0c2ff;
    outline-offset: 3px;
  }
  @media (max-width: 760px) {
    .journey-heading {
      display: block;
    }
    .view-controls {
      display: inline-flex;
      margin-bottom: 12px;
    }
  }
  @media (max-width: 520px) {
    .journey-meaning {
      grid-template-columns: 1fr;
      gap: 18px;
    }
    .journey-browser {
      align-items: start;
      flex-direction: column;
    }
    label {
      width: 100%;
    }
    .scene-caption {
      padding: 0;
      font-size: 8px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .scene-stage.revealing :global(.schematic) {
      animation: none;
    }
  }
</style>

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import ComputerStack from './ComputerStack.svelte';
  import { computerLayers } from './layers';
  import MissionWorkbench from './MissionWorkbench.svelte';
  import FieldGuide from './FieldGuide.svelte';
  import { missions, getMission, type MissionId } from './missions';

  let view: 'world' | 'workbench' | 'guide' | 'collection' = 'world';
  let selected: MissionId = 'nand';
  let selectedLayer = 'logic';
  $: activeLayer = computerLayers.find((layer) => layer.id === selectedLayer) ?? computerLayers[0];
  let completed: string[] = [];
  let sound = false;
  let notice = '';
  let restored: MissionId | null = null;
  let ready = false;
  let audioContext: AudioContext | undefined;
  let startButton: HTMLButtonElement;
  let mainHeading: HTMLHeadingElement;
  $: activeMission = getMission(selected);
  $: nextMission = missions.find((mission) => !completed.includes(mission.id));
  $: restoredMission = restored ? getMission(restored) : null;

  onMount(() => {
    try {
      const saved = JSON.parse(
        (localStorage.getItem('chipsandcode.progress.v1') ??
          localStorage.getItem('chipsandcode.signal-isles.progress.v1')) ||
          '[]',
      );
      if (Array.isArray(saved))
        completed = [
          ...new Set(
            saved.filter(
              (id): id is MissionId => typeof id === 'string' && missions.some((m) => m.id === id),
            ),
          ),
        ];
      sound =
        (localStorage.getItem('chipsandcode.sound') ??
          localStorage.getItem('chipsandcode.signal-isles.sound')) === 'on';
    } catch {
      notice = 'Storage is unavailable. You can still build in this session.';
    }
    selected = missions.find((mission) => !completed.includes(mission.id))?.id || 'nand';
    ready = true;
    return () => {
      void audioContext?.close();
    };
  });

  function playTone(celebrate = false) {
    if (!sound) return;
    try {
      audioContext ||= new AudioContext();
      void audioContext.resume();
      const now = audioContext.currentTime;
      (celebrate ? [392, 494, 587, 784] : [440]).forEach((frequency, index) => {
        const oscillator = audioContext!.createOscillator();
        const gain = audioContext!.createGain();
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, now + index * 0.09);
        gain.gain.linearRampToValueAtTime(0.035, now + index * 0.09 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.09 + 0.22);
        oscillator.connect(gain);
        gain.connect(audioContext!.destination);
        oscillator.start(now + index * 0.09);
        oscillator.stop(now + index * 0.09 + 0.23);
      });
    } catch {
      /* Sound is optional. */
    }
  }

  function selectMission(id: string) {
    const found = missions.find((mission) => mission.id === id);
    if (!found) return;
    selected = found.id;
    selectedLayer = 'logic';
    restored = null;
    playTone();
  }

  async function setView(next: typeof view) {
    view = next;
    restored = null;
    await tick();
    mainHeading?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  async function returnToWorld() {
    view = 'world';
    await tick();
    startButton?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  async function completeMission(id: string) {
    const mission = missions.find((item) => item.id === id);
    if (!mission) return;
    if (!completed.includes(id)) completed = [...completed, id];
    try {
      localStorage.setItem('chipsandcode.progress.v1', JSON.stringify(completed));
    } catch {
      notice = 'Your circuit worked. Progress could not be saved in this browser.';
    }
    restored = mission.id;
    selectedLayer = 'logic';
    view = 'world';
    playTone(true);
    await tick();
    startButton?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function toggleSound() {
    sound = !sound;
    try {
      localStorage.setItem('chipsandcode.sound', sound ? 'on' : 'off');
    } catch {
      /* Optional preference. */
    }
    playTone();
  }
</script>

<div class="computer-game">
  <a class="skip-game" href="#game-content">Skip to workspace</a>
  <header class="game-header">
    <button class="wordmark" onclick={() => setView('world')}>
      <img src="/logo.svg" alt="" width="40" height="40" />
      <span>Chips <span class="brand-and">and</span> Code</span>
    </button>
    <nav class="game-nav" aria-label="Workspace navigation">
      <button
        class:current={view === 'world'}
        aria-current={view === 'world' ? 'page' : undefined}
        onclick={() => setView('world')}>The computer</button
      >
      <button
        class:current={view === 'workbench'}
        aria-current={view === 'workbench' ? 'page' : undefined}
        onclick={() => setView('workbench')}>Workbench</button
      >
      <button
        class:current={view === 'guide'}
        aria-current={view === 'guide' ? 'page' : undefined}
        onclick={() => setView('guide')}>Reference</button
      >
      <button
        class:current={view === 'collection'}
        aria-current={view === 'collection' ? 'page' : undefined}
        onclick={() => setView('collection')}
        >Your chips <span class="chip-count">{completed.length}</span></button
      >
    </nav>
    <button class="sound-button" aria-pressed={sound} onclick={toggleSound}
      ><span aria-hidden="true">◌</span> Sound {sound ? 'on' : 'off'}</button
    >
  </header>

  <main id="game-content">
    {#if view === 'world'}
      <section class="computer-section" aria-label="Computer layers">
        <div class="system-bar">
          <span><i></i> FROM SIGNAL TO SOFTWARE</span><span
            >INTERACTIVE COMPUTER ENGINEERING <b>/</b> 01</span
          >
        </div>
        <div class="computer-layout">
          <div class="mission-brief">
            {#if restoredMission}
              <span class="eyebrow">VERIFICATION COMPLETE</span>
              <h1 bind:this={mainHeading} tabindex="-1">
                One more piece.<br /><em>A step closer.</em>
              </h1>
              <p class="intro-copy">{restoredMission.reward}</p>
              <p class="verification-note" role="status">
                ✓ {restoredMission.chip} verified. Added to your chips.
              </p>
            {:else}
              <span class="eyebrow">BUILD YOUR UNDERSTANDING</span>
              <h1 bind:this={mainHeading} tabindex="-1">
                Understand<br />the machine.<br /><em>From the inside out.</em>
              </h1>
              <p class="intro-copy">
                Start with a signal. Build the logic. Work your way up to the software. Every layer
                is built on the one below.
              </p>
            {/if}
            {#if selectedLayer === 'logic'}
              <div class="selected-mission">
                <div class="mission-meta">
                  <span>LAYER 00 / LOGIC</span><span class:done={completed.includes(selected)}
                    >{completed.includes(selected)
                      ? '✓ VERIFIED'
                      : `CHALLENGE ${String(activeMission.number).padStart(2, '0')} / 07`}</span
                  >
                </div>
                <div class="mission-title">
                  <span class="chip-symbol" aria-hidden="true">{activeMission.chip}</span>
                  <h2>{activeMission.title}</h2>
                </div>
                <p>{activeMission.brief}</p>
                {#if restored && nextMission}
                  <button
                    bind:this={startButton}
                    class="primary-action"
                    onclick={() => {
                      selected = nextMission!.id;
                      void setView('workbench');
                    }}>Build the next chip <span aria-hidden="true">↗</span></button
                  >
                {:else}
                  <button
                    bind:this={startButton}
                    class="primary-action"
                    onclick={() => setView('workbench')}
                    >{completed.includes(selected)
                      ? 'Reopen workbench'
                      : selected === 'nand'
                        ? 'Enter the signal layer'
                        : 'Build this chip'} <span aria-hidden="true">↗</span></button
                  >
                {/if}
                <div class="editor-note">
                  <span>VISUAL</span><i>↔</i><span>HDL CODE</span><span class="editor-note-detail"
                    >One circuit. Two ways in.</span
                  >
                </div>
              </div>
            {:else}
              <div class="selected-mission layer-preview">
                <div class="mission-meta">
                  <span>LAYER {activeLayer.number} / {activeLayer.title.toUpperCase()}</span><span
                    >PLANNED</span
                  >
                </div>
                <h2>{activeLayer.subtitle}</h2>
                <p>{activeLayer.description}</p>
                <p class="planned-note">
                  This layer is the next part of the build. The seven logic challenges are ready
                  now.
                </p>
                <button
                  bind:this={startButton}
                  class="primary-action"
                  onclick={() => {
                    selectedLayer = 'logic';
                  }}>Back to the signal layer <span aria-hidden="true">↓</span></button
                >
              </div>
            {/if}
          </div>
          <div class="stack-zone">
            <ComputerStack
              {completed}
              {selected}
              {selectedLayer}
              onselect={selectMission}
              onlayerselect={(id) => {
                selectedLayer = id;
                restored = null;
              }}
            />
          </div>
        </div>
        <div class="layer-status">
          <div>
            <span class="status-light"></span><strong
              >{completed.length} / {missions.length} CHIPS VERIFIED</strong
            ><span class="status-description">Layer 00 · Boolean logic</span>
          </div>
          <button class="quiet-link" onclick={() => setView('guide')}
            >Open the reference <span aria-hidden="true">↗</span></button
          >
        </div>
        <div class="principles">
          <p>
            <span>01</span><strong>Build, don't just read.</strong> Trace a live signal through every
            connection.
          </p>
          <p>
            <span>02</span><strong>Wire it. Or write it.</strong> Visual and HDL views of the same circuit.
          </p>
          <p>
            <span>03</span><strong>Prove that it works.</strong> Test every input. Inspect every output.
          </p>
        </div>
      </section>
    {:else if view === 'workbench'}
      {#key selected}<MissionWorkbench
          missionId={selected}
          {completed}
          oncomplete={completeMission}
          onclose={returnToWorld}
        />{/key}
    {:else if view === 'guide'}
      <FieldGuide onclose={returnToWorld} />
    {:else}
      <section class="collection-view">
        <div class="collection-intro">
          <span class="eyebrow">YOUR COMPONENT LIBRARY</span>
          <h1 bind:this={mainHeading} tabindex="-1">
            Small primitives.<br /><em>Complex systems.</em>
          </h1>
          <p>
            Every verified chip is another abstraction you understand. Reopen a design, trace its
            signals, or rebuild it in code.
          </p>
        </div>
        <div class="collection-grid">
          {#each missions as mission}
            <article class="collection-card" class:collected={completed.includes(mission.id)}>
              <div class="collection-top">
                <span class="collection-number">{String(mission.number).padStart(2, '0')}</span
                ><span class="collection-status"
                  >{completed.includes(mission.id) ? '✓ VERIFIED' : 'NOT YET VERIFIED'}</span
                >
              </div>
              <div class="collectible-chip" aria-hidden="true"><span>{mission.chip}</span></div>
              <h2>{mission.title}</h2>
              <p>{mission.goal}</p>
              <button
                class="collection-action"
                onclick={() => {
                  selected = mission.id;
                  void setView('workbench');
                }}
                >{completed.includes(mission.id) ? 'Open design' : 'Build chip'}
                <span aria-hidden="true">↗</span></button
              >
            </article>
          {/each}
        </div>
        <div class="future-note">
          <span class="eyebrow">THE NEXT ABSTRACTION</span>
          <h2>From gates to a computer.</h2>
          <p>
            Arithmetic, memory, architecture, and software are the layers ahead. The current
            workbench covers single-bit combinational logic. Buses and multi-way selectors are
            introduced in the reference.
          </p>
          <button class="quiet-link" onclick={returnToWorld}>Explore the computer layers ↗</button>
        </div>
      </section>
    {/if}
  </main>
  <footer class="game-footer">
    <span class="footer-brand">Chips and Code <span>/</span> From the ground up.</span>
    <div>
      <a href="/experiment/hardware-ide">Open hardware IDE ↗</a><a
        href="/learn/hardware/boolean-logic">Original reading</a
      ><a href="/about">About</a><a href="/accessibility-statement">Accessibility Statement</a><a
        href="/signin"
        aria-label="User account">Account</a
      >
    </div>
    <span class="save-status"
      >{ready
        ? notice
          ? 'Progress: this session only'
          : 'Progress saved on this device'
        : 'Initializing workspace'}</span
    >
  </footer>
  {#if notice}<p class="storage-notice" role="status">{notice}</p>{/if}
</div>

<style>
  .computer-game {
    --sea: #090b11;
    --sea-deep: #07080d;
    --panel: #12151f;
    --paper: #12151f;
    --ink: #f0f0f7;
    --muted: #a1a5b6;
    --line: #303446;
    --copper: #a49cff;
    --action: #4f46e5;
    --signal: #a49cff;
    min-height: 100vh;
    background: #090b11;
    color: var(--ink);
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
    line-height: 1.5;
    color-scheme: dark;
  }
  .computer-game :global(button) {
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .computer-game :global(button:focus-visible),
  .computer-game :global(a:focus-visible),
  .computer-game :global(select:focus-visible),
  .computer-game :global(textarea:focus-visible) {
    outline: 2px solid #aaa4ff !important;
    outline-offset: 4px;
  }
  .computer-game :global(h1:focus) {
    outline: none !important;
  }
  button {
    cursor: pointer;
  }
  a {
    text-decoration: none;
  }
  .skip-game {
    position: absolute;
    left: 20px;
    top: -100px;
    z-index: 100;
    background: #e9e8ff;
    color: #131320;
    padding: 12px;
  }
  .skip-game:focus {
    top: 8px;
  }
  .game-header {
    min-height: 84px;
    padding: 12px 4%;
    border-bottom: 1px solid #252735;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .wordmark {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 19px;
    letter-spacing: -0.7px;
    font-weight: 700;
    text-align: left;
    white-space: nowrap;
  }
  .wordmark img {
    width: 34px;
    height: 34px;
  }
  .brand-and {
    font-weight: 400;
    color: #a1a5b6;
  }
  .game-nav {
    display: flex;
    align-items: center;
    gap: 3px;
  }
  .game-nav button {
    font-size: 12px;
    font-weight: 500;
    padding: 11px 14px;
    border-radius: 4px;
    color: #a1a5b6;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .game-nav button:hover {
    color: white;
    background: #191b29;
  }
  .game-nav button.current {
    background: #202031;
    color: #eeecff;
  }
  .chip-count {
    font-family: ui-monospace, monospace;
    background: #ffffff0b;
    font-size: 10px;
    padding: 1px 5px;
    margin-left: 4px;
    border-radius: 2px;
  }
  .sound-button {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: ui-monospace, monospace;
    font-size: 11px;
    color: #a1a5b6;
    white-space: nowrap;
    min-height: 44px;
  }
  .sound-button > span {
    font-size: 20px;
    color: #a49cff;
  }
  .computer-section {
    max-width: 1600px;
    margin: auto;
    padding: 26px 4% 0;
  }
  .system-bar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-family: ui-monospace, monospace;
    font-size: 9px;
    letter-spacing: 1.5px;
    color: #b1b3c3;
  }
  .system-bar > span:first-child {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .system-bar i,
  .status-light {
    display: inline-block;
    width: 5px;
    height: 5px;
    background: #aaa4ff;
    border-radius: 50%;
    box-shadow: 0 0 12px #756aff77;
  }
  .system-bar > span:last-child {
    color: #959aac;
  }
  .system-bar b {
    margin: 0 10px;
    font-weight: 400;
    color: #aaa4ff;
  }
  .computer-layout {
    display: grid;
    grid-template-columns: minmax(300px, 0.86fr) minmax(0, 1.55fr);
    align-items: center;
    gap: 3%;
    padding: 24px 0 20px;
  }
  .mission-brief {
    min-width: 0;
    padding: 12px 0;
  }
  .eyebrow {
    font-family: ui-monospace, monospace;
    display: block;
    color: #aaa4ff;
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 1.5px;
  }
  h1 {
    font-size: clamp(38px, 3.5vw, 55px);
    line-height: 1.08;
    font-weight: 500;
    letter-spacing: -2.5px;
    margin: 17px 0;
  }
  h1 em {
    font-style: normal;
    color: #aaa4ff;
    font-size: 0.72em;
    letter-spacing: -1.2px;
  }
  .intro-copy {
    font-size: 13px;
    color: #a1a5b6;
    line-height: 1.8;
    max-width: 330px;
  }
  .verification-note {
    font-size: 12px;
    color: #a49cff;
    margin-top: 12px;
  }
  .selected-mission {
    border-top: 1px solid #303446;
    padding-top: 18px;
    margin-top: 26px;
    max-width: 360px;
  }
  .mission-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: #a1a5b6;
    font:
      9px ui-monospace,
      monospace;
    letter-spacing: 0.7px;
  }
  .mission-meta .done {
    color: #c0baff;
  }
  .mission-title {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 16px 0 10px;
  }
  .chip-symbol {
    font:
      12px ui-monospace,
      monospace;
    border: 1px solid #57516d;
    color: #c6c1ff;
    padding: 10px 8px;
    min-width: 53px;
    text-align: center;
    background: #1a1929;
  }
  .selected-mission h2 {
    font-size: 19px;
    font-weight: 550;
    letter-spacing: -0.5px;
    line-height: 1.3;
  }
  .selected-mission > p {
    font-size: 12px;
    line-height: 1.75;
    color: #a1a5b6;
  }
  .primary-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: 47px;
    padding: 12px 17px;
    margin-top: 17px;
    background: #4f46e5;
    color: white;
    border: 1px solid #7068ff;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 600;
    transition: background 0.15s;
  }
  .primary-action:hover {
    background: #6258f1;
  }
  .primary-action > span {
    font-size: 19px;
  }
  .editor-note {
    display: flex;
    align-items: center;
    gap: 8px;
    font:
      8px ui-monospace,
      monospace;
    color: #b4afef;
    margin-top: 13px;
    letter-spacing: 0.4px;
  }
  .editor-note i {
    font-style: normal;
    color: #878a9e;
  }
  .editor-note-detail {
    margin-left: auto;
    font:
      10px Inter,
      ui-sans-serif,
      sans-serif;
    letter-spacing: 0;
    color: #9b9fb2;
  }
  .layer-preview h2 {
    margin: 18px 0 12px;
    font-size: 24px;
  }
  .layer-preview .planned-note {
    font-size: 11px;
    margin-top: 14px;
    color: #b4afef;
  }
  .stack-zone {
    min-width: 0;
  }
  .quiet-link {
    color: #bbb7e8;
    font-size: 11px;
    min-height: 44px;
    text-align: left;
  }
  .quiet-link:hover {
    color: white;
  }
  .layer-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border-top: 1px solid #303446;
    border-bottom: 1px solid #242735;
    padding: 8px 0;
    font:
      10px ui-monospace,
      monospace;
  }
  .layer-status > div {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .layer-status strong {
    font-weight: 400;
    letter-spacing: 0.6px;
  }
  .status-description {
    color: #a1a5b6;
    padding-left: 16px;
    border-left: 1px solid #303446;
  }
  .principles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
    padding: 25px 0;
  }
  .principles p {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 3px 12px;
    font-size: 11px;
    color: #a1a5b6;
  }
  .principles p > span {
    grid-row: span 2;
    font:
      10px ui-monospace,
      monospace;
    color: #a49cff;
    padding-top: 3px;
  }
  .principles strong {
    color: #d4d5df;
    font-weight: 500;
    font-size: 12px;
  }
  .collection-view {
    max-width: 1400px;
    margin: auto;
    padding: 48px 4%;
  }
  .collection-intro > p {
    color: #a1a5b6;
    max-width: 500px;
    font-size: 14px;
    line-height: 1.8;
  }
  .collection-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-top: 36px;
  }
  .collection-card {
    padding: 22px;
    border: 1px solid #303446;
    background: #0f111b;
    border-radius: 4px;
  }
  .collection-card.collected {
    border-color: #6c63cf;
    background: #161426;
  }
  .collection-top {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
  }
  .collection-number {
    font:
      11px ui-monospace,
      monospace;
    color: #aaa4ff;
  }
  .collection-status {
    color: #a1a5b6;
    font:
      8px ui-monospace,
      monospace;
    letter-spacing: 0.6px;
  }
  .collected .collection-status {
    color: #c5bfff;
  }
  .collectible-chip {
    width: 85px;
    height: 65px;
    display: grid;
    place-items: center;
    margin: 34px auto;
    background: #171925;
    border: 1px solid #484b65;
    box-shadow:
      inset 0 0 0 5px #0f111b,
      inset 0 0 0 6px #303446;
    font:
      16px ui-monospace,
      monospace;
    color: #b4afef;
    position: relative;
  }
  .collectible-chip::before,
  .collectible-chip::after {
    content: '';
    position: absolute;
    top: 8px;
    bottom: 8px;
    width: 8px;
    background: repeating-linear-gradient(to bottom, #5f5a89 0 3px, transparent 3px 10px);
  }
  .collectible-chip::before {
    left: -9px;
  }
  .collectible-chip::after {
    right: -9px;
  }
  .collection-card h2 {
    font-size: 17px;
    letter-spacing: -0.5px;
  }
  .collection-card p {
    color: #a1a5b6;
    font-size: 12px;
    line-height: 1.7;
    margin: 10px 0 18px;
    min-height: 41px;
  }
  .collection-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: 44px;
    font-size: 11px;
    color: #c5bfff;
    border-top: 1px solid #303446;
    padding-top: 12px;
  }
  .future-note {
    border-top: 1px solid #303446;
    margin-top: 40px;
    padding-top: 28px;
  }
  .future-note h2 {
    font-size: 27px;
    margin: 10px 0;
  }
  .future-note p {
    font-size: 13px;
    color: #a1a5b6;
    max-width: 670px;
    line-height: 1.8;
  }
  .game-footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 16px;
    padding: 25px 4%;
    border-top: 1px solid #242735;
    color: #959aac;
    font-size: 10px;
  }
  .footer-brand {
    font-size: 11px;
    color: #b6b8c6;
  }
  .footer-brand span {
    margin: 0 7px;
    color: #aaa4ff;
  }
  .game-footer > div {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .game-footer a:hover {
    color: white;
  }
  .save-status {
    font:
      9px ui-monospace,
      monospace;
  }
  .storage-notice {
    padding: 12px 4%;
    color: #e0c98c;
    font-size: 12px;
  }
  @media (min-width: 1500px) {
    .computer-layout {
      grid-template-columns: minmax(330px, 1fr) minmax(0, 1.7fr);
    }
  }
  @media (max-width: 1000px) {
    .game-header {
      gap: 12px;
    }
    .wordmark {
      font-size: 17px;
      gap: 8px;
    }
    .game-nav button {
      padding: 10px;
      font-size: 11px;
    }
    .sound-button {
      font-size: 10px;
    }
    .computer-layout {
      grid-template-columns: minmax(270px, 0.9fr) minmax(0, 1.2fr);
      gap: 20px;
    }
    .collection-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .editor-note-detail {
      display: none;
    }
  }
  @media (max-width: 760px) {
    .game-header {
      flex-wrap: wrap;
      padding-top: 16px;
    }
    .wordmark {
      flex: 1;
    }
    .game-nav {
      order: 3;
      width: 100%;
      justify-content: space-between;
      border-top: 1px solid #242735;
      padding-top: 9px;
    }
    .game-nav button {
      padding: 10px 12px;
    }
    .system-bar > span:last-child {
      display: none;
    }
    .computer-layout {
      grid-template-columns: 1fr;
      padding-top: 16px;
      gap: 14px;
    }
    .mission-brief {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-content: start;
      gap: 0 20px;
    }
    .mission-brief > .eyebrow {
      grid-column: 1 / -1;
    }
    .mission-brief h1 {
      font-size: 35px;
      grid-column: 1;
    }
    .mission-brief > p {
      grid-column: 1;
    }
    .selected-mission {
      grid-column: 2;
      grid-row: 2 / span 3;
      margin-top: 18px;
      padding-top: 12px;
    }
    .mission-meta {
      flex-wrap: wrap;
      gap: 7px;
      font-size: 8px;
    }
    .selected-mission h2 {
      font-size: 17px;
    }
    .mission-title {
      gap: 9px;
    }
    .chip-symbol {
      min-width: 45px;
      font-size: 10px;
    }
    .status-description {
      display: none;
    }
    .collection-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .principles {
      gap: 20px;
    }
    .principles p {
      display: block;
      line-height: 1.7;
    }
    .principles strong {
      display: block;
      margin: 5px 0;
    }
    .principles p > span {
      display: block;
    }
  }
  @media (max-width: 480px) {
    .game-header {
      padding-inline: 5%;
    }
    .game-nav button {
      padding: 9px 7px;
      font-size: 10px;
    }
    .wordmark {
      font-size: 17px;
    }
    .computer-section {
      padding-inline: 5%;
    }
    .mission-brief {
      display: block;
    }
    .mission-brief h1 {
      font-size: 42px;
    }
    .intro-copy {
      max-width: 100%;
    }
    .selected-mission {
      max-width: none;
      margin-top: 22px;
    }
    .editor-note-detail {
      display: inline;
    }
    .mission-meta {
      font-size: 9px;
    }
    .layer-status {
      align-items: flex-start;
      gap: 8px;
    }
    .layer-status > div {
      gap: 7px;
      padding-top: 16px;
      font-size: 8px;
    }
    .quiet-link {
      font-size: 10px;
    }
    .principles {
      grid-template-columns: 1fr;
      gap: 17px;
      padding: 22px 0;
    }
    .principles p {
      display: grid;
      grid-template-columns: 22px 1fr;
      gap: 1px 10px;
    }
    .principles strong {
      margin: 0;
    }
    .collection-grid {
      grid-template-columns: 1fr;
    }
    .collection-card p {
      min-height: 0;
    }
    .game-footer {
      padding-inline: 5%;
    }
    .game-footer > div {
      gap: 12px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .computer-game :global(*) {
      transition: none !important;
      animation: none !important;
      scroll-behavior: auto !important;
    }
  }
</style>

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Landing from './Landing.svelte';
  import IntroVideo from './IntroVideo.svelte';
  import MissionWorkbench from './MissionWorkbench.svelte';
  import FieldGuide from './FieldGuide.svelte';
  import { missions, getMission, type MissionId } from './missions';

  let view: 'world' | 'workbench' | 'guide' | 'collection' = 'world';
  let selected: MissionId = 'nand';
  let introOpen = false;
  let content: HTMLElement;
  let completed: string[] = [];
  let sound = false;
  let notice = '';
  let restored: MissionId | null = null;
  let ready = false;
  let audioContext: AudioContext | undefined;
  let mainHeading: HTMLHeadingElement;
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
    restored = null;
    playTone();
  }

  async function setView(next: typeof view) {
    introOpen = false;
    view = next;
    restored = null;
    await tick();
    content?.querySelector<HTMLHeadingElement>('h1')?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function startMission(id: string) {
    selectMission(id);
    void setView('workbench');
  }

  async function returnToWorld() {
    view = 'world';
    await tick();
    const section = document.getElementById('layer-logic');
    section?.scrollIntoView({ block: 'start', behavior: 'instant' });
    section
      ?.querySelector<HTMLButtonElement>(`[data-mission="${selected}"]`)
      ?.focus({ preventScroll: true });
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
    view = 'world';
    playTone(true);
    await tick();
    const section = document.getElementById('layer-logic');
    section?.scrollIntoView({ block: 'start', behavior: 'instant' });
    section
      ?.querySelector<HTMLButtonElement>(`[data-mission="${selected}"]`)
      ?.focus({ preventScroll: true });
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

  <main id="game-content" bind:this={content}>
    {#if view === 'world'}
      <Landing
        {completed}
        {selected}
        {introOpen}
        verified={restoredMission?.chip ?? null}
        onselect={selectMission}
        onstart={startMission}
        onreference={() => setView('guide')}
        onwatch={() => (introOpen = true)}
      />
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
          <h1 bind:this={mainHeading} tabindex="-1">Your chips.</h1>
          <p>Reopen a verified circuit or build the next chip.</p>
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
      </section>
    {/if}
  </main>
  <footer class="game-footer" class:light-footer={view === 'world'}>
    <span class="footer-brand">Chips and Code</span>
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
  {#if introOpen}<IntroVideo onclose={() => (introOpen = false)} />{/if}
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
    font-size: 11px;
    color: #a1a5b6;
    white-space: nowrap;
    min-height: 44px;
  }
  .sound-button > span {
    font-size: 20px;
    color: #a49cff;
  }
  .eyebrow {
    display: block;
    color: #aaa4ff;
    font:
      11px ui-monospace,
      monospace;
    letter-spacing: 1.2px;
  }
  h1 {
    font-size: clamp(36px, 3.5vw, 55px);
    line-height: 1.12;
    font-weight: 500;
    letter-spacing: -2px;
    margin: 17px 0;
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
      10px ui-monospace,
      monospace;
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
    font-size: 13px;
    line-height: 1.7;
    margin: 10px 0 18px;
    min-height: 44px;
  }
  .collection-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: 44px;
    font-size: 13px;
    color: #c5bfff;
    border-top: 1px solid #303446;
    padding-top: 12px;
  }
  .game-footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 16px;
    padding: 25px 4%;
    border-top: 1px solid #242735;
    color: #a1a5b6;
    font-size: 11px;
  }
  .footer-brand {
    font-size: 12px;
    color: #b6b8c6;
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
      10px ui-monospace,
      monospace;
  }
  .light-footer {
    background: #f1f1f7;
    color: #55576b;
    border-color: #d7d7e1;
    color-scheme: light;
  }
  .light-footer .footer-brand {
    color: #292a3c;
  }
  .light-footer a:hover {
    color: #4f46e5;
  }
  .light-footer :global(a:focus-visible) {
    outline-color: #4f46e5 !important;
  }
  .storage-notice {
    padding: 12px 4%;
    color: #e0c98c;
    font-size: 12px;
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
    .collection-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
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
    .collection-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 480px) {
    .game-header {
      padding-inline: 5%;
    }
    .game-nav button {
      padding: 9px 7px;
      font-size: 11px;
    }
    .wordmark {
      font-size: 17px;
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

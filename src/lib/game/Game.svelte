<script lang="ts">
  import { onMount, tick } from 'svelte';
  import WorldMap from './WorldMap.svelte';
  import MissionWorkbench from './MissionWorkbench.svelte';
  import FieldGuide from './FieldGuide.svelte';
  import { missions, getMission, type MissionId } from './missions';

  let view: 'world' | 'workbench' | 'guide' | 'collection' = 'world';
  let selected: MissionId = 'nand';
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
        localStorage.getItem('chipsandcode.signal-isles.progress.v1') || '[]',
      );
      if (Array.isArray(saved))
        completed = [
          ...new Set(
            saved.filter(
              (id): id is MissionId => typeof id === 'string' && missions.some((m) => m.id === id),
            ),
          ),
        ];
      sound = localStorage.getItem('chipsandcode.signal-isles.sound') === 'on';
    } catch {
      notice = 'Saving is unavailable. You can still play this session.';
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
      localStorage.setItem('chipsandcode.signal-isles.progress.v1', JSON.stringify(completed));
    } catch {
      notice = 'Your circuit worked. Progress could not be saved in this browser.';
    }
    restored = mission.id;
    view = 'world';
    playTone(true);
    await tick();
    startButton?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function toggleSound() {
    sound = !sound;
    try {
      localStorage.setItem('chipsandcode.signal-isles.sound', sound ? 'on' : 'off');
    } catch {
      /* Optional preference. */
    }
    playTone();
  }
</script>

<div class="signal-game">
  <a class="skip-game" href="#game-content">Skip to game</a>
  <header class="game-header">
    <button class="wordmark" onclick={() => setView('world')}>
      <span class="brand-chip" aria-hidden="true">c+c</span>
      <span
        >chips<span class="brand-and">&</span>code<span class="brand-sub"
          >A SMALL WORLD. A BIG IDEA.</span
        ></span
      >
    </button>
    <nav class="game-nav" aria-label="Game navigation">
      <button
        class:current={view === 'world'}
        aria-current={view === 'world' ? 'page' : undefined}
        onclick={() => setView('world')}>World</button
      >
      <button
        class:current={view === 'workbench'}
        aria-current={view === 'workbench' ? 'page' : undefined}
        onclick={() => setView('workbench')}>Workbench</button
      >
      <button
        class:current={view === 'guide'}
        aria-current={view === 'guide' ? 'page' : undefined}
        onclick={() => setView('guide')}>Field guide</button
      >
      <button
        class:current={view === 'collection'}
        aria-current={view === 'collection' ? 'page' : undefined}
        onclick={() => setView('collection')}
        >Your chips <span class="chip-count">{completed.length}</span></button
      >
    </nav>
    <button class="sound-button" aria-pressed={sound} onclick={toggleSound}
      ><span aria-hidden="true">♪</span> Sound {sound ? 'on' : 'off'}</button
    >
  </header>

  <main id="game-content">
    {#if view === 'world'}
      <section class="world-section" aria-label="Signal Isles world">
        <div class="world-topline">
          <span><i></i> THE SIGNAL ISLES</span><span>CHAPTER 01 <b>/</b> THE FIRST SPARK</span>
        </div>
        <div class="world-layout">
          <div class="mission-brief">
            {#if restoredMission}
              <span class="eyebrow signal-text">SYSTEM RESTORED</span>
              <h1 bind:this={mainHeading} tabindex="-1">You made<br />a little magic.</h1>
              <p class="intro-copy">{restoredMission.reward}</p>
              <p class="restoration-note" role="status">
                ✓ {restoredMission.chip} verified. Your world remembers.
              </p>
            {:else}
              <span class="eyebrow">BUILD SOMETHING THAT MATTERS</span>
              <h1 bind:this={mainHeading} tabindex="-1">
                A little logic.<br /><em>A living world.</em>
              </h1>
              <p class="intro-copy">
                The islands have gone quiet. Bring them back to life, one invention at a time.
              </p>
            {/if}
            <div class="selected-mission">
              <div class="mission-meta">
                <span>STATION {String(activeMission.number).padStart(2, '0')}</span><span
                  class:done={completed.includes(selected)}
                  >{completed.includes(selected)
                    ? '✓ RESTORED'
                    : selected === nextMission?.id
                      ? 'YOUR NEXT STOP'
                      : 'OPEN TO EXPLORE'}</span
                >
              </div>
              <h2>{activeMission.title}</h2>
              <p>{activeMission.brief}</p>
              <div class="mission-skill">
                <span class="tiny-chip">{activeMission.chip}</span><span
                  >{selected === 'nand'
                    ? 'Discover your first building block'
                    : 'Build it. Test it. Make it yours.'}</span
                >
              </div>
              {#if restored && nextMission}
                <button
                  bind:this={startButton}
                  class="primary-action"
                  onclick={() => {
                    selected = nextMission!.id;
                    void setView('workbench');
                  }}>Next invention <span aria-hidden="true">↗</span></button
                >
              {:else}
                <button
                  bind:this={startButton}
                  class="primary-action"
                  onclick={() => setView('workbench')}
                  >{completed.includes(selected)
                    ? 'Revisit workshop'
                    : completed.length === 0 && selected === 'nand'
                      ? 'Bring it to life'
                      : 'Enter workshop'} <span aria-hidden="true">↗</span></button
                >
              {/if}
              <span class="below-button"
                >{selected === 'nand'
                  ? 'No code. No setup. Just curiosity.'
                  : 'Experiment freely. Every attempt teaches you something.'}</span
              >
            </div>
            <button class="quiet-link" onclick={() => setView('guide')}
              >▤ Curious how it works? Open the field guide ↗</button
            >
          </div>
          <div class="map-zone">
            <div class="map-caption">
              <span>SIGNAL ARCHIPELAGO <b>01—07</b></span><span>EXPLORE · INVENT · RESTORE</span>
            </div>
            <WorldMap {completed} {selected} onselect={selectMission} />
            <div class="map-footer">
              <span
                ><i class="legend-active"></i> Restored <i class="legend-next"></i> Selected
                <i class="legend-off"></i> Waiting for a spark</span
              ><span>Choose an island to explore</span>
            </div>
          </div>
        </div>
        <section class="expedition" aria-label="Stations, list view">
          <div class="expedition-heading">
            <span>YOUR EXPEDITION</span><span
              >{completed.length} OF {missions.length} SYSTEMS RESTORED</span
            >
          </div>
          <div class="station-list">
            {#each missions as mission}
              <button
                class="station-stop"
                class:active={selected === mission.id}
                class:restored={completed.includes(mission.id)}
                aria-pressed={selected === mission.id}
                onclick={() => selectMission(mission.id)}
              >
                <span class="stop-number"
                  >{completed.includes(mission.id)
                    ? '✓'
                    : String(mission.number).padStart(2, '0')}</span
                >
                <span><strong>{mission.chip}</strong><small>{mission.location}</small></span><span
                  class="stop-arrow"
                  aria-hidden="true">↗</span
                >
              </button>
            {/each}
          </div>
        </section>
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
        <button class="quiet-link" onclick={returnToWorld}>← Back to the islands</button>
        <span class="eyebrow">THE THINGS YOU CAN MAKE</span>
        <h1 bind:this={mainHeading} tabindex="-1">
          Small chips.<br /><em>Endless possibilities.</em>
        </h1>
        <p class="collection-intro">
          Every verified invention earns a place here. Later workshops use the same logic as
          building blocks for bigger ideas.
        </p>
        <div class="collection-grid">
          {#each missions as mission}
            <article class="collection-card" class:collected={completed.includes(mission.id)}>
              <span class="collection-status"
                >{completed.includes(mission.id)
                  ? '✓ VERIFIED IN YOUR WORKSHOP'
                  : 'AWAITING YOUR INVENTION'}</span
              >
              <div class="collectible-chip" aria-hidden="true"><span>{mission.chip}</span></div>
              <h2>{mission.title}</h2>
              <p>{mission.goal}</p>
              <button
                class="collection-action"
                onclick={() => {
                  selected = mission.id;
                  void setView('workbench');
                }}
                >{completed.includes(mission.id) ? 'Rebuild & experiment' : 'Visit workshop'}
                <span aria-hidden="true">↗</span></button
              >
            </article>
          {/each}
        </div>
        <div class="future-note">
          <span class="eyebrow">BEYOND THE HORIZON</span>
          <h2>A computer of your own.</h2>
          <p>
            Buses, arithmetic, memory, and a CPU are the bigger adventure ahead. The field guide
            introduces buses and selectors; this playable chapter focuses on single-bit Boolean
            logic.
          </p>
          <button class="quiet-link" onclick={() => setView('guide')}
            >Explore the ideas in your field guide ↗</button
          >
        </div>
      </section>
    {/if}
  </main>
  <footer class="game-footer">
    <span><span class="footer-symbol">✳</span> Built from curiosity. Powered by you.</span>
    <div>
      <a href="/experiment/hardware-ide">Open hardware IDE ↗</a><a
        href="/learn/hardware/boolean-logic">Original reading</a
      ><a href="/about">About</a><a href="/accessibility-statement">Accessibility Statement</a><a
        href="/signin"
        aria-label="User account">Account</a
      ><span class="save-status"
        >{ready
          ? notice
            ? 'Progress: this session only'
            : 'Progress saved on this device'
          : 'Getting your workshop ready'}</span
      >
    </div>
  </footer>
  {#if notice}<p class="storage-notice" role="status">{notice}</p>{/if}
</div>

<style>
  .signal-game {
    --sea: #101e2b;
    --sea-deep: #0b141e;
    --panel: #f4eedf;
    --ink: #172839;
    --copper: #ee9255;
    --action: #e97445;
    --signal: #7bd9b5;
    min-height: 100vh;
    background: #101e2b;
    color: #f4eedf;
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
  .signal-game :global(button) {
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .signal-game :global(button:focus-visible),
  .signal-game :global(a:focus-visible),
  .signal-game :global(select:focus-visible) {
    outline: 3px solid #ee9255 !important;
    outline-offset: 5px;
  }
  .signal-game :global(h1:focus) {
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
    background: #f4eedf;
    color: #172839;
    padding: 12px;
  }
  .skip-game:focus {
    top: 8px;
  }
  .game-header {
    min-height: 102px;
    margin: 0 4%;
    border-bottom: 1px solid #ffffff18;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
  }
  .wordmark {
    display: flex;
    align-items: center;
    gap: 13px;
    font-size: 23px;
    letter-spacing: -1.2px;
    font-weight: 750;
    text-align: left;
  }
  .brand-and {
    color: #ee9255;
    font-weight: 450;
    margin: 0 2px;
  }
  .brand-sub {
    display: block;
    font-size: 8px;
    letter-spacing: 2px;
    font-weight: 600;
    color: #a5b5ba;
    margin-top: 2px;
  }
  .brand-chip {
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    border: 1px solid #ee9255;
    border-radius: 10px;
    box-shadow:
      inset 0 0 0 4px #101e2b,
      inset 0 0 0 5px #ee9255;
    transform: rotate(-8deg);
    color: #ee9255;
    font-family: ui-monospace, monospace;
    font-size: 16px;
    letter-spacing: -2px;
  }
  .game-nav {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px;
    border: 1px solid #ffffff12;
    border-radius: 10px;
    background: #0d1925;
  }
  .game-nav button {
    font-size: 13px;
    font-weight: 600;
    padding: 9px 16px;
    border-radius: 6px;
    color: #a5b5ba;
    transition:
      background 0.15s,
      color 0.15s;
  }
  .game-nav button:hover {
    color: #f4eedf;
  }
  .game-nav button.current {
    background: #293947;
    color: #fff7e6;
    box-shadow: 0 1px 3px #0003;
  }
  .chip-count {
    font-family: ui-monospace, monospace;
    background: #ffffff12;
    font-size: 10px;
    padding: 1px 5px;
    margin-left: 3px;
    border-radius: 3px;
  }
  .sound-button {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #a5b5ba;
    white-space: nowrap;
    min-height: 44px;
  }
  .sound-button > span {
    font-size: 21px;
    color: #ee9255;
  }
  .world-section {
    max-width: 1640px;
    margin: auto;
    padding: 28px 4% 36px;
  }
  .world-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    letter-spacing: 1.5px;
    color: #b3c1c6;
  }
  .world-topline > span:first-child {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .world-topline i {
    width: 6px;
    height: 6px;
    background: #ee9255;
    border-radius: 50%;
  }
  .world-topline b {
    color: #ee9255;
    margin: 0 8px;
    font-weight: 400;
  }
  .world-topline > span:last-child {
    font-size: 9px;
    color: #8f9da7;
  }
  .world-layout {
    display: grid;
    grid-template-columns: minmax(260px, 310px) minmax(0, 1fr);
    align-items: center;
    gap: 2%;
    padding: 25px 0 24px;
  }
  .mission-brief {
    position: relative;
    z-index: 1;
    padding: 22px 0;
  }
  .eyebrow {
    font-family: ui-monospace, monospace;
    display: block;
    color: #ee9255;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1.7px;
  }
  .signal-text {
    color: #7bd9b5;
  }
  h1 {
    font-size: clamp(36px, 3vw, 48px);
    line-height: 1.12;
    font-weight: 650;
    letter-spacing: -2.5px;
    margin: 16px 0;
  }
  h1 em {
    font-style: normal;
    color: #ee9255;
  }
  .intro-copy {
    font-size: 14px;
    color: #b1c0c5;
    line-height: 1.75;
    max-width: 275px;
  }
  .restoration-note {
    font-size: 11px;
    color: #7bd9b5;
    margin-top: 12px;
  }
  .selected-mission {
    border-top: 1px solid #ffffff1c;
    padding-top: 18px;
    margin-top: 18px;
  }
  .mission-meta {
    display: flex;
    gap: 8px;
    justify-content: space-between;
    font-family: ui-monospace, monospace;
    font-size: 8px;
    letter-spacing: 1px;
    color: #98aab2;
  }
  .mission-meta > span:last-child {
    color: #ee9255;
  }
  .mission-meta > span.done {
    color: #7bd9b5;
  }
  .selected-mission h2 {
    font-size: 23px;
    font-weight: 600;
    letter-spacing: -0.6px;
    margin: 13px 0 9px;
  }
  .selected-mission p {
    font-size: 13px;
    line-height: 1.75;
    color: #b1c0c5;
  }
  .mission-skill {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 17px 0 24px;
    font-size: 10px;
    color: #a9b9bf;
  }
  .tiny-chip {
    font-family: ui-monospace, monospace;
    font-size: 10px;
    color: #f1b38b;
    border: 1px solid #75513d;
    border-radius: 4px;
    padding: 3px 7px;
    background: #e974450c;
  }
  .primary-action {
    width: 100%;
    min-height: 50px;
    padding: 13px 18px;
    background: #ee9255;
    border: 1px solid #f3b38a;
    color: #18242d;
    font-size: 13px;
    font-weight: 750;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 3px 0 #aa5c32;
    transition:
      background 0.15s,
      transform 0.15s;
  }
  .primary-action:hover {
    background: #f7aa76;
    transform: translateY(-1px);
  }
  .primary-action > span {
    font-size: 21px;
    font-weight: 400;
    line-height: 1;
  }
  .below-button {
    display: block;
    font-size: 9px;
    color: #a2b2ba;
    text-align: center;
    margin-top: 12px;
    line-height: 1.5;
  }
  .quiet-link {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    font-size: 10px;
    color: #c1cbca;
    line-height: 1.65;
    text-align: left;
  }
  .mission-brief > .quiet-link {
    margin-top: 15px;
  }
  .quiet-link:hover {
    color: #ee9255;
  }
  .map-zone {
    position: relative;
    min-width: 0;
    align-self: stretch;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: radial-gradient(ellipse at 53% 49%, #29404c50 0%, #101e2b00 67%);
  }
  .map-caption {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin: 0 3% 4px;
    font-family: ui-monospace, monospace;
    font-size: 8px;
    letter-spacing: 1.3px;
    color: #8ea3ad;
  }
  .map-caption b {
    color: #ee9255;
    margin-left: 12px;
    font-weight: 400;
  }
  .map-caption > span:last-child {
    font-size: 7px;
    color: #8197a1;
  }
  .map-footer {
    margin: 12px 3% 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    color: #92a6af;
    font-size: 9px;
  }
  .map-footer > span:first-child {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .map-footer i {
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    margin-left: 8px;
  }
  .map-footer i:first-child {
    margin-left: 0;
  }
  .legend-active {
    background: #7bd9b5;
  }
  .legend-next {
    background: #ee9255;
  }
  .legend-off {
    background: #697e87;
  }
  .expedition {
    border-top: 1px solid #ffffff1c;
    padding-top: 20px;
  }
  .expedition-heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-family: ui-monospace, monospace;
    font-size: 8px;
    letter-spacing: 1.4px;
    color: #b6c3c7;
  }
  .expedition-heading > span:last-child {
    color: #8fa4ad;
  }
  .station-list {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 6px;
    margin-top: 16px;
  }
  .station-stop {
    display: flex;
    gap: 10px;
    align-items: center;
    text-align: left;
    padding: 12px 9px;
    border: 1px solid #ffffff10;
    border-radius: 6px;
    min-width: 0;
    transition:
      background 0.15s,
      border-color 0.15s;
  }
  .station-stop:hover {
    background: #ffffff06;
    border-color: #ffffff38;
  }
  .station-stop.active {
    border-color: #ee92556b;
    background: #ee92550b;
  }
  .stop-number {
    font-family: ui-monospace, monospace;
    font-size: 10px;
    color: #849aa4;
  }
  .station-stop.active .stop-number {
    color: #ee9255;
  }
  .station-stop.restored .stop-number {
    color: #7bd9b5;
  }
  .station-stop strong {
    display: block;
    font-family: ui-monospace, monospace;
    font-weight: 500;
    font-size: 12px;
    color: #efebdf;
  }
  .station-stop small {
    font-size: 8px;
    color: #91a7b0;
    display: block;
    margin-top: 3px;
  }
  .stop-arrow {
    color: #ee9255;
    font-size: 13px;
    margin-left: auto;
    opacity: 0;
  }
  .station-stop.active .stop-arrow,
  .station-stop:hover .stop-arrow {
    opacity: 1;
  }
  .game-footer {
    padding: 20px 4% 24px;
    border-top: 1px solid #ffffff12;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;
    font-size: 9px;
    color: #8fa4ad;
  }
  .footer-symbol {
    color: #ee9255;
    font-size: 16px;
    vertical-align: middle;
    margin-right: 6px;
  }
  .game-footer > div {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }
  .game-footer a {
    color: #aebfc5;
    min-height: 30px;
    display: flex;
    align-items: center;
  }
  .game-footer a:hover {
    color: #ee9255;
  }
  .save-status {
    font-size: 8px;
    color: #8da3ac;
  }
  .storage-notice {
    font-size: 12px;
    padding: 12px 4%;
    background: #ee92551a;
    color: #ffd7ad;
  }
  .collection-view {
    max-width: 1240px;
    margin: auto;
    padding: 24px 5% 64px;
  }
  .collection-view > .eyebrow {
    margin-top: 25px;
  }
  .collection-intro {
    color: #b1c0c5;
    max-width: 580px;
    font-size: 14px;
    line-height: 1.8;
  }
  .collection-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-top: 36px;
  }
  .collection-card {
    padding: 25px;
    border: 1px solid #ffffff18;
    border-radius: 12px;
    background: #152633;
  }
  .collection-card.collected {
    border-color: #7bd9b550;
    background: #18312f;
  }
  .collection-status {
    font-family: ui-monospace, monospace;
    font-size: 8px;
    letter-spacing: 1px;
    color: #93a9b1;
  }
  .collected .collection-status {
    color: #7bd9b5;
  }
  .collectible-chip {
    position: relative;
    display: grid;
    place-items: center;
    width: 98px;
    height: 90px;
    background: #253944;
    box-shadow:
      0 8px 0 #09151e,
      0 11px 15px #0004;
    border: 1px solid #527078;
    border-radius: 7px;
    margin: 32px 6px;
    transform: rotate(-7deg);
    font-family: ui-monospace, monospace;
    font-size: 22px;
    color: #9fb6b8;
  }
  .collectible-chip:after {
    content: '';
    position: absolute;
    inset: 8px;
    border: 1px solid #ffffff12;
    border-radius: 4px;
  }
  .collectible-chip > span {
    transform: rotate(7deg);
  }
  .collected .collectible-chip {
    color: #7bd9b5;
  }
  .collection-card h2 {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }
  .collection-card p {
    color: #acbec4;
    font-size: 12px;
    line-height: 1.8;
    min-height: 66px;
  }
  .collection-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    border-top: 1px solid #ffffff18;
    margin-top: 17px;
    padding-top: 16px;
    min-height: 44px;
    font-size: 12px;
    color: #ee9255;
  }
  .future-note {
    margin-top: 35px;
    padding-top: 35px;
    border-top: 1px solid #ffffff1c;
    max-width: 650px;
  }
  .future-note h2 {
    font-size: 25px;
    margin: 12px 0;
    font-weight: 600;
  }
  .future-note p {
    font-size: 13px;
    line-height: 1.85;
    color: #acbec4;
  }
  @media (min-width: 1500px) {
    .world-layout {
      grid-template-columns: 330px minmax(0, 1fr);
      gap: 4%;
    }
    .game-header {
      min-height: 110px;
    }
    .world-section {
      padding-top: 36px;
    }
    .selected-mission {
      margin-top: 35px;
      padding-top: 27px;
    }
    .mission-brief {
      padding: 35px 0;
    }
    .intro-copy {
      font-size: 16px;
    }
    .world-layout h1 {
      font-size: 57px;
    }
  }
  @media (max-width: 1100px) {
    .game-nav button {
      padding: 9px 11px;
      font-size: 12px;
    }
    .world-layout {
      grid-template-columns: 255px minmax(0, 1fr);
      gap: 10px;
    }
    .world-layout h1 {
      font-size: 40px;
    }
    .world-section {
      padding-inline: 3%;
    }
    .game-header {
      margin-inline: 3%;
      gap: 18px;
    }
    .station-stop {
      gap: 7px;
      padding: 10px 6px;
    }
    .station-stop small {
      font-size: 7px;
    }
    .stop-arrow {
      display: none;
    }
    .map-caption > span:last-child {
      display: none;
    }
    .game-footer > div {
      gap: 15px;
    }
  }
  @media (max-width: 800px) {
    .game-header {
      flex-wrap: wrap;
      gap: 8px;
      padding: 18px 0 12px;
      min-height: auto;
    }
    .wordmark {
      font-size: 22px;
    }
    .game-nav {
      order: 3;
      width: 100%;
      justify-content: space-between;
      margin-top: 10px;
    }
    .game-nav button {
      flex: 1;
      padding: 10px 6px;
    }
    .world-topline {
      font-size: 8px;
      letter-spacing: 1px;
    }
    .world-topline > span:last-child {
      font-size: 7px;
      letter-spacing: 0.5px;
    }
    .world-layout {
      grid-template-columns: minmax(0, 1fr);
      padding-top: 17px;
      gap: 0;
    }
    .mission-brief {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      column-gap: 25px;
      padding: 8px 0 25px;
    }
    .mission-brief > .eyebrow {
      grid-column: 1;
      font-size: 7px;
      align-self: end;
    }
    .mission-brief h1 {
      grid-column: 1;
      font-size: 38px;
      margin: 12px 0;
    }
    .intro-copy {
      grid-column: 1;
      font-size: 12px;
    }
    .selected-mission {
      grid-column: 2;
      grid-row: 1 / span 4;
      border-top: none;
      border-left: 1px solid #ffffff1c;
      margin: 0;
      padding: 10px 0 0 24px;
    }
    .selected-mission h2 {
      font-size: 21px;
    }
    .selected-mission p {
      font-size: 12px;
    }
    .mission-meta {
      font-size: 7px;
    }
    .mission-meta > span:last-child {
      display: none;
    }
    .mission-skill {
      margin: 12px 0 15px;
      font-size: 9px;
    }
    .mission-brief > .quiet-link {
      grid-column: 1;
      margin-top: 8px;
      font-size: 9px;
      max-width: 200px;
    }
    .map-zone {
      margin-top: 0;
    }
    .station-list {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    .station-stop {
      padding: 12px;
    }
    .station-stop small {
      font-size: 9px;
    }
    .station-stop strong {
      font-size: 13px;
    }
    .collection-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .collection-view h1 {
      font-size: 44px;
    }
    .restoration-note {
      grid-column: 1;
    }
    .expedition {
      margin-top: 20px;
    }
  }
  @media (max-width: 480px) {
    .world-layout {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      padding-top: 28px;
    }
    .game-header {
      margin-inline: 5%;
    }
    .sound-button {
      font-size: 10px;
    }
    .game-nav button {
      font-size: 11px;
    }
    .chip-count {
      margin-left: 0;
    }
    .world-section {
      padding: 20px 5% 25px;
    }
    .world-topline > span:last-child {
      font-size: 6px;
    }
    .world-topline {
      font-size: 7px;
      letter-spacing: 1px;
    }
    .world-topline b {
      margin-inline: 3px;
    }
    .mission-brief {
      display: contents;
    }
    .mission-brief > .eyebrow {
      font-size: 7px;
      order: 1;
    }
    .mission-brief h1 {
      order: 2;
      font-size: 42px;
      margin: 16px 0;
      letter-spacing: -1.7px;
    }
    .intro-copy {
      order: 3;
      max-width: 300px;
      font-size: 13px;
    }
    .selected-mission {
      order: 5;
      border-left: 0;
      border-top: 1px solid #ffffff1c;
      padding: 18px 0 0;
      margin-top: 20px;
    }
    .mission-meta {
      font-size: 8px;
    }
    .mission-meta > span:last-child {
      display: block;
    }
    .selected-mission h2 {
      font-size: 22px;
    }
    .selected-mission p {
      font-size: 13px;
    }
    .mission-skill {
      margin: 12px 0 18px;
    }
    .mission-brief > .quiet-link {
      order: 6;
      max-width: none;
      margin-top: 14px;
    }
    .map-caption {
      font-size: 6px;
      letter-spacing: 1px;
      margin-inline: 0;
    }
    .map-zone {
      order: 4;
      margin-top: 24px;
    }
    .restoration-note {
      order: 3;
    }
    .map-footer {
      margin-inline: 0;
      font-size: 8px;
    }
    .map-footer > span:last-child {
      display: none;
    }
    .station-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .station-stop {
      padding: 12px;
    }
    .expedition-heading {
      font-size: 7px;
      letter-spacing: 0.8px;
    }
    .collection-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .collection-view h1 {
      font-size: 39px;
    }
    .game-footer > div {
      column-gap: 18px;
      row-gap: 2px;
    }
    .save-status {
      flex-basis: 100%;
      margin-top: 8px;
    }
    .collection-card p {
      min-height: auto;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .signal-game :global(*),
    .signal-game :global(*:before),
    .signal-game :global(*:after) {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
  }
</style>

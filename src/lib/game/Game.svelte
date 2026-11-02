<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Landing from './Landing.svelte';
  import SignalIntro from './SignalIntro.svelte';
  import IntroVideo from './IntroVideo.svelte';
  import MissionWorkbench from './MissionWorkbench.svelte';
  import FieldGuide from './FieldGuide.svelte';
  import { missions, getMission, type MissionId } from './missions';

  type View = 'world' | 'signal' | 'workbench' | 'guide' | 'collection' | 'milestone';
  const introKey = 'chipsandcode.signal-intro.v1';
  let view: View = 'world';
  let referenceReturn: View = 'world';
  let selected: MissionId = 'nand';
  let introOpen = false;
  let introSeen = false;
  let content: HTMLElement;
  let menu: HTMLDetailsElement;
  let menuOpen = false;
  let completed: MissionId[] = [];
  let lastCompleted: MissionId = 'nand';
  let notice = '';
  let ready = false;

  $: nextMission = missions.find((mission) => !completed.includes(mission.id));
  $: verifiedMissions = missions.filter((mission) => completed.includes(mission.id));
  $: lastMission = getMission(lastCompleted);
  $: continuing = introSeen || completed.includes('nand');

  onMount(() => {
    try {
      const saved = JSON.parse(
        (localStorage.getItem('chipsandcode.progress.v1') ??
          localStorage.getItem('chipsandcode.signal-isles.progress.v1')) ||
          '[]',
      );
      if (Array.isArray(saved)) {
        completed = [
          ...new Set(
            saved.filter(
              (id): id is MissionId =>
                typeof id === 'string' && missions.some((mission) => mission.id === id),
            ),
          ),
        ];
      }
      introSeen = localStorage.getItem(introKey) === 'complete' || completed.includes('nand');
    } catch {
      notice = 'Your progress can only be kept for this session.';
    }
    selected = missions.find((mission) => !completed.includes(mission.id))?.id ?? 'nand';
    ready = true;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        menuOpen = false;
        menu?.querySelector('summary')?.focus();
      }
    };
    const closeOnOutside = (event: PointerEvent) => {
      if (menuOpen && event.target instanceof Node && !menu?.contains(event.target))
        menuOpen = false;
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutside);
    };
  });

  async function setView(next: View) {
    menuOpen = false;
    introOpen = false;
    view = next;
    await tick();
    window.scrollTo({ top: 0, behavior: 'instant' });
    Array.from(content?.querySelectorAll<HTMLHeadingElement>('h1') ?? [])
      .find((heading) => heading.getClientRects().length > 0)
      ?.focus({ preventScroll: true });
  }

  function startLearning() {
    if (!continuing) {
      void setView('signal');
    } else if (nextMission) {
      selected = nextMission.id;
      void setView('workbench');
    } else {
      void setView('collection');
    }
  }

  function finishSignalIntro() {
    introSeen = true;
    try {
      localStorage.setItem(introKey, 'complete');
    } catch {
      notice = 'Your progress can only be kept for this session.';
    }
    selected = 'nand';
    void setView('workbench');
  }

  function completeMission(id: string) {
    const mission = missions.find((item) => item.id === id);
    if (!mission) return;
    if (!completed.includes(mission.id)) completed = [...completed, mission.id];
    lastCompleted = mission.id;
    try {
      localStorage.setItem('chipsandcode.progress.v1', JSON.stringify(completed));
    } catch {
      notice = 'Your circuit worked. Progress can only be kept for this session.';
    }
    void setView('milestone');
  }

  function reopenMission(id: MissionId) {
    if (!completed.includes(id)) return;
    selected = id;
    void setView('workbench');
  }

  function openReference() {
    if (view === 'guide') {
      void setView('guide');
      return;
    }
    referenceReturn = view;
    void setView('guide');
  }
</script>

<div class="computer-game" data-ready={ready}>
  <a class="skip-game" href="#game-content">Skip to content</a>
  <header class="game-header">
    <button class="wordmark" onclick={() => setView('world')} aria-label="Chips and Code home">
      <img src="/logo.svg" alt="" width="34" height="34" />
      <span>Chips <span class="brand-and">and</span> Code</span>
    </button>
    <details class="workspace-menu" bind:this={menu} bind:open={menuOpen}>
      <summary>Menu <span aria-hidden="true">+</span></summary>
      <nav aria-label="Workspace menu">
        <button onclick={() => setView('world')}>The computer</button>
        <button onclick={startLearning}
          >{continuing ? 'Continue learning' : 'Start learning'}</button
        >
        {#if completed.length}<button onclick={() => setView('collection')}>Your chips</button>{/if}
        <button onclick={openReference}>Reference</button>
        <div class="menu-resources">
          <a href="/experiment/hardware-ide">Hardware IDE ↗</a>
          <a href="/learn/hardware/boolean-logic">Original reading</a>
        </div>
      </nav>
    </details>
  </header>

  <main id="game-content" bind:this={content}>
    {#if view === 'signal' || (view === 'guide' && referenceReturn === 'signal')}
      <div class="learning-session" hidden={view !== 'signal'}>
        <SignalIntro oncomplete={finishSignalIntro} onclose={() => setView('world')} />
      </div>
    {/if}
    {#if view === 'workbench' || (view === 'guide' && referenceReturn === 'workbench')}
      <div class="learning-session" hidden={view !== 'workbench'}>
        {#key selected}<MissionWorkbench
            missionId={selected}
            {completed}
            oncomplete={completeMission}
            onclose={() => setView('world')}
          />{/key}
      </div>
    {/if}
    {#if view === 'world'}
      <Landing {continuing} onstart={startLearning} onwatch={() => (introOpen = true)} />
    {:else if view === 'guide'}
      <FieldGuide onclose={() => setView(referenceReturn)} />
    {:else if view === 'milestone'}
      <section class="learning-milestone" aria-labelledby="milestone-title">
        <span class="milestone-mark" aria-hidden="true">✓</span>
        <h1 id="milestone-title" tabindex="-1">
          {lastCompleted === 'nand'
            ? 'NAND, explored.'
            : `${lastMission.chip.toUpperCase()} works.`}
        </h1>
        <p>
          {lastCompleted === 'nand'
            ? 'Its output is 0 only when both inputs are 1.'
            : lastMission.goal}
        </p>
        {#if nextMission}
          <div class="next-concept">
            <span>Next</span>
            <h2>{nextMission.title}</h2>
            <p>{nextMission.brief}</p>
          </div>
          <button class="learning-action" onclick={startLearning}
            >Continue <span aria-hidden="true">→</span></button
          >
        {:else}
          <div class="next-concept">
            <h2>The logic layer is yours.</h2>
            <p>
              Six circuits, built from one primitive. Arithmetic is the next layer; it is still
              being built.
            </p>
          </div>
          <button class="learning-action" onclick={() => setView('collection')}
            >Review your chips <span aria-hidden="true">→</span></button
          >
        {/if}
      </section>
    {:else if view === 'collection'}
      <section class="collection-view">
        <h1 tabindex="-1">Your chips.</h1>
        <p>Each one is a building block for what comes next.</p>
        <div class="verified-chips">
          {#each verifiedMissions as mission}
            <button
              class="verified-chip"
              onclick={() => reopenMission(mission.id)}
              aria-label={`Reopen ${mission.chip} ${mission.title}`}
            >
              <span class="chip-name">{mission.chip}</span>
              <span class="chip-purpose">{mission.title}</span>
              <span aria-hidden="true">↗</span>
            </button>
          {/each}
        </div>
        {#if nextMission}<button class="learning-action" onclick={startLearning}
            >Continue learning <span aria-hidden="true">→</span></button
          >{/if}
      </section>
    {/if}
  </main>

  <footer class="game-footer" class:light-footer={view === 'world'}>
    <span>Chips and Code</span>
    <div>
      <a href="/about">About</a>
      <a href="/accessibility-statement">Accessibility Statement</a>
      <a href="/signin" aria-label="User account">Account</a>
    </div>
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
    color-scheme: dark;
    font-family:
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
    line-height: 1.5;
  }
  .computer-game :global(button) {
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .computer-game :global(button:focus-visible),
  .computer-game :global(a:focus-visible),
  .computer-game :global(summary:focus-visible),
  .computer-game :global(select:focus-visible),
  .computer-game :global(textarea:focus-visible) {
    outline: 2px solid #aaa4ff !important;
    outline-offset: 4px;
  }
  .computer-game :global(h1:focus) {
    outline: none !important;
  }
  main {
    min-height: calc(100svh - 84px);
  }
  .learning-session[hidden] {
    display: none;
  }
  button,
  summary {
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .wordmark {
    display: flex;
    align-items: center;
    gap: 11px;
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
  .workspace-menu {
    position: relative;
    z-index: 30;
  }
  .workspace-menu summary {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 12px 0 12px 16px;
    min-height: 44px;
    font-size: 13px;
    color: #c4c6d3;
    list-style: none;
  }
  .workspace-menu summary::-webkit-details-marker {
    display: none;
  }
  .workspace-menu summary > span {
    font-size: 20px;
    transition: transform 0.15s;
  }
  .workspace-menu[open] summary > span {
    transform: rotate(45deg);
  }
  .workspace-menu nav {
    position: absolute;
    right: 0;
    top: calc(100% + 9px);
    width: 228px;
    max-width: calc(100vw - 32px);
    padding: 10px;
    border: 1px solid #353747;
    border-radius: 5px;
    background: #12151f;
    box-shadow: 0 16px 48px #0006;
  }
  .workspace-menu nav button,
  .workspace-menu nav a {
    display: block;
    width: 100%;
    padding: 11px 12px;
    color: #d3d4e0;
    font-size: 13px;
    text-align: left;
    border-radius: 3px;
  }
  .workspace-menu nav button:hover,
  .workspace-menu nav a:hover {
    background: #252338;
    color: white;
  }
  .menu-resources {
    border-top: 1px solid #303446;
    margin-top: 8px;
    padding-top: 8px;
  }
  .menu-resources a {
    color: #b1b5c6;
  }
  .learning-milestone {
    width: min(620px, 100%);
    margin: auto;
    padding: clamp(52px, 10vh, 96px) 28px 100px;
    min-height: calc(100svh - 164px);
  }
  .milestone-mark {
    color: #b3aaff;
    font-size: 26px;
  }
  h1 {
    margin: 20px 0 16px;
    font-size: clamp(34px, 4vw, 50px);
    line-height: 1.1;
    font-weight: 500;
    letter-spacing: -1.8px;
  }
  .learning-milestone > p,
  .collection-view > p {
    color: #b0b4c5;
    font-size: 16px;
    line-height: 1.7;
    margin: 0;
  }
  .next-concept {
    border-top: 1px solid #303446;
    margin: 40px 0 26px;
    padding-top: 26px;
  }
  .next-concept > span {
    color: #a49cff;
    font-size: 12px;
  }
  .next-concept h2 {
    margin: 8px 0;
    font-size: 22px;
    line-height: 1.3;
    font-weight: 500;
    letter-spacing: -0.5px;
  }
  .next-concept p {
    margin: 0;
    color: #a1a5b6;
    font-size: 14px;
    line-height: 1.7;
    max-width: 460px;
  }
  .learning-action {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 42px;
    min-height: 48px;
    border: 1px solid #746bff;
    border-radius: 3px;
    padding: 12px 19px;
    background: #4f46e5;
    color: #fff;
    font-size: 14px;
  }
  .learning-action:hover {
    background: #5c53e8;
  }
  .collection-view {
    max-width: 850px;
    margin: auto;
    padding: 48px 28px 100px;
    min-height: calc(100svh - 164px);
  }
  .verified-chips {
    margin: 36px 0;
    border-top: 1px solid #303446;
  }
  .verified-chip {
    width: 100%;
    display: grid;
    grid-template-columns: 85px 1fr auto;
    gap: 18px;
    align-items: center;
    text-align: left;
    padding: 23px 0;
    border-bottom: 1px solid #303446;
  }
  .verified-chip:hover {
    background: #ffffff04;
  }
  .chip-name {
    color: #c1baff;
    font:
      16px ui-monospace,
      monospace;
  }
  .chip-purpose {
    font-size: 14px;
    color: #c9cbd7;
  }
  .verified-chip > :last-child {
    color: #a49cff;
  }
  .game-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 18px;
    padding: 27px 4%;
    border-top: 1px solid #242735;
    color: #a1a5b6;
    font-size: 12px;
  }
  .game-footer > div {
    display: flex;
    flex-wrap: wrap;
    gap: 22px;
  }
  .game-footer a:hover {
    color: white;
  }
  .light-footer {
    background: #f2f1f7;
    color: #55576b;
    border-color: #d7d7e1;
    color-scheme: light;
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
  @media (max-width: 520px) {
    main {
      min-height: calc(100svh - 72px);
    }
    .game-header {
      min-height: 72px;
      padding: 12px 20px;
      gap: 15px;
    }
    .wordmark {
      gap: 7px;
      font-size: 16px;
    }
    .wordmark img {
      width: 28px;
      height: 28px;
    }
    .workspace-menu summary {
      gap: 10px;
      font-size: 12px;
    }
    .learning-milestone,
    .collection-view {
      padding-left: 24px;
      padding-right: 24px;
    }
    .verified-chip {
      grid-template-columns: 60px 1fr auto;
      gap: 12px;
    }
    .chip-purpose {
      font-size: 13px;
    }
    .game-footer {
      padding: 24px;
      font-size: 11px;
      gap: 15px;
    }
    .game-footer > div {
      gap: 15px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .workspace-menu summary > span {
      transition: none;
    }
  }
</style>

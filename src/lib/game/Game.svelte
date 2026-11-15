<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { afterNavigate, goto, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import SignalIntro from './SignalIntro.svelte';
  import MissionWorkbench from './MissionWorkbench.svelte';
  import FieldGuide from './FieldGuide.svelte';
  import { missions, getMission, type MissionId } from './missions';
  import TopicNavigator from '#lib/learning/adaptive/TopicNavigator.svelte';
  import TopicCoach from '#lib/learning/adaptive/TopicCoach.svelte';
  import { topicForMission } from '#lib/learning/adaptive/topics.js';
  import {
    learningChoices,
    learningStorage,
    loadLearningChoices,
    readLearningEvidence,
  } from '#lib/learning/adaptive/storage.js';

  type View = 'signal' | 'workbench' | 'guide' | 'collection' | 'milestone';
  const introKey = 'chipsandcode.signal-intro.v1';
  let view: View = 'signal';
  let referenceReturn: View = 'signal';
  let selected: MissionId = 'nand';
  let introSeen = false;
  let content: HTMLElement;
  let completed: MissionId[] = [];
  let lastCompleted: MissionId = 'nand';
  let notice = '';
  let ready = false;
  $: adaptiveCompleted = completed.map((id) => `missions/${id}`);
  afterNavigate(({ to }) => {
    if (ready && to) {
      openChosenEntry(to.url.searchParams);
    }
  });

  $: nextMission = missions
    .slice(
      view === 'milestone' ? missions.findIndex((mission) => mission.id === lastCompleted) + 1 : 0,
    )
    .find(
      (mission) =>
        !completed.includes(mission.id) &&
        !$learningChoices.topics[topicForMission(mission.id)]?.skipped,
    );
  $: verifiedMissions = missions.filter((mission) => completed.includes(mission.id));
  $: lastMission = getMission(lastCompleted);
  $: continuing = introSeen || completed.length > 0 || $learningChoices.topics.signals?.skipped;

  onMount(() => {
    loadLearningChoices();
    const evidence = readLearningEvidence();
    completed = evidence.verifiedTasks
      .filter((id) => id.startsWith('missions/'))
      .map((id) => id.slice('missions/'.length) as MissionId);
    introSeen = evidence.exploredSignals;
    openChosenEntry(page.url.searchParams);
    ready = true;
  });

  function openDefaultEntry() {
    const pending = missions.find(
      (mission) =>
        !completed.includes(mission.id) &&
        !$learningChoices.topics[topicForMission(mission.id)]?.skipped,
    );
    selected = pending?.id ?? 'nand';
    void setView(
      !introSeen && !completed.length && !$learningChoices.topics.signals?.skipped
        ? 'signal'
        : pending
          ? 'workbench'
          : 'collection',
    );
  }

  function openChosenEntry(params: Pick<URLSearchParams, 'get'>) {
    const mission = missions.find((item) => item.id === params.get('mission'));
    if (mission) {
      selected = mission.id;
      void setView('workbench');
    } else if (params.get('topic') === 'signals') {
      void setView('signal');
    } else {
      openDefaultEntry();
    }
  }

  function updateChosenEntry(id: MissionId) {
    if (!page.url.searchParams.has('mission') && !page.url.searchParams.has('topic')) return;
    const url = new URL(page.url.href);
    url.searchParams.delete('topic');
    url.searchParams.set('mission', id);
    // eslint-disable-next-line svelte/no-navigation-without-resolve -- Preserve the already-resolved current URL; only its query changes.
    replaceState(url, page.state);
  }

  async function setView(next: View) {
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
      updateChosenEntry(selected);
      void setView('workbench');
    } else {
      void setView('collection');
    }
  }

  function finishSignalIntro() {
    introSeen = true;
    try {
      learningStorage.setItem(introKey, 'complete');
    } catch {
      notice = 'Your progress can only be kept for this session.';
    }
    selected = 'nand';
    updateChosenEntry(selected);
    void setView('workbench');
  }

  function completeMission(id: string) {
    const mission = missions.find((item) => item.id === id);
    if (!mission) return;
    if (!completed.includes(mission.id)) completed = [...completed, mission.id];
    lastCompleted = mission.id;
    const upcoming = missions
      .slice(missions.indexOf(mission) + 1)
      .find(
        (item) =>
          !completed.includes(item.id) &&
          !$learningChoices.topics[topicForMission(item.id)]?.skipped,
      );
    if (upcoming) updateChosenEntry(upcoming.id);
    if (mission.id === 'nand' && !introSeen) {
      // Preserve the legacy NAND fallback only for old progress. Direct entry
      // must not turn unobserved introductory activities into explored ones.
      try {
        learningStorage.setItem(introKey, 'not-observed');
      } catch {
        notice = 'Your progress can only be kept for this session.';
      }
    }
    try {
      learningStorage.setItem('chipsandcode.progress.v1', JSON.stringify(completed));
    } catch {
      notice = 'Your circuit worked. Progress can only be kept for this session.';
    }
    void setView('milestone');
  }

  function reopenMission(id: MissionId) {
    if (!completed.includes(id)) return;
    selected = id;
    updateChosenEntry(id);
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
  <nav class="learning-links" aria-label="Learning resources">
    {#if view !== 'collection' && completed.length}<button onclick={() => setView('collection')}
        >Your chips</button
      >{/if}
    <button onclick={openReference}>Reference</button>
  </nav>

  <main id="game-content" bind:this={content}>
    <TopicNavigator completed={adaptiveCompleted} exploredSignals={introSeen} />
    {#if view === 'signal' || (view === 'guide' && referenceReturn === 'signal')}
      <div class="learning-session" hidden={view !== 'signal'}>
        <SignalIntro oncomplete={finishSignalIntro} onclose={() => goto('/')} />
        <TopicCoach
          topicId="signals"
          currentTask="signals"
          completed={adaptiveCompleted}
          exploredSignals={introSeen}
          hint="Start with the switch: 0 and 1 are two states. NOT flips the state; AND needs both inputs to be 1."
        />
      </div>
    {/if}
    {#if view === 'workbench' || (view === 'guide' && referenceReturn === 'workbench')}
      <div class="learning-session" hidden={view !== 'workbench'}>
        {#key selected}<MissionWorkbench
            missionId={selected}
            {completed}
            oncomplete={completeMission}
            onclose={() => goto('/')}
          />{/key}
        <TopicCoach
          topicId={topicForMission(selected)}
          currentTask={`missions/${selected}`}
          completed={adaptiveCompleted}
          exploredSignals={introSeen}
          hint={getMission(selected).hints[0]}
        />
      </div>
    {/if}
    {#if view === 'guide'}
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
        <TopicCoach
          topicId={topicForMission(lastCompleted)}
          currentTask={`missions/${lastCompleted}`}
          completed={adaptiveCompleted}
          exploredSignals={introSeen}
          hint={lastMission.hints[0]}
        />
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
            <h2>Take logic further.</h2>
            <p>
              {completed.length === missions.length
                ? 'Six circuits, built from one primitive. Next, use the same ideas with whole words of bits and multi-way routing.'
                : 'Take these ideas into whole words of bits and multi-way routing. Any unchecked gates remain available in Choose a topic.'}
            </p>
            <a class="next-reading" href="/learn/path/buses">Continue with buses and selectors →</a>
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
        {#if !nextMission}<a class="learning-action" href="/learn/path"
            >Continue through the computer →</a
          >{/if}
        {#if nextMission}<button class="learning-action" onclick={startLearning}
            >Continue learning <span aria-hidden="true">→</span></button
          >{/if}
      </section>
    {/if}
  </main>

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
    min-height: calc(100svh - 84px);
    background: #080b13;
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
  button {
    cursor: pointer;
  }
  a {
    text-decoration: none;
  }
  .learning-links {
    display: flex;
    justify-content: flex-end;
    gap: 24px;
    padding: 5px 4% 0;
  }
  .learning-links button {
    min-height: 40px;
    color: #bac2d7;
    font-size: 12px;
  }
  .learning-links button:hover {
    color: #fff;
    text-decoration: underline;
    text-underline-offset: 5px;
  }
  .computer-game[data-ready='false'] main {
    visibility: hidden;
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
  .next-reading {
    display: inline-block;
    color: #c0b7ff;
    text-decoration: underline;
    text-underline-offset: 5px;
    padding: 14px 0;
    font-size: 14px;
  }
  .storage-notice {
    padding: 12px 4%;
    color: #e0c98c;
    font-size: 12px;
  }
  @media (max-width: 520px) {
    main {
      min-height: calc(100svh - 148px);
    }
    .learning-links {
      padding: 4px 20px 0;
    }
    .learning-milestone,
    .collection-view {
      padding-left: 20px;
      padding-right: 20px;
    }
    .verified-chip {
      grid-template-columns: 60px 1fr auto;
      gap: 12px;
    }
    .chip-purpose {
      font-size: 13px;
    }
  }
</style>

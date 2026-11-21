<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount, tick } from 'svelte';
  import { compileHDL, type HDLCircuit } from '#lib/computer/hdl.js';
  import { assemble, createMachine } from '#lib/computer/hack.js';
  import {
    courseChapters,
    courseProgressKey,
    symbolProgram,
    taskKey,
    type CourseChapter,
  } from './data.js';
  import { verifyHardware, verifyAssembly, type CheckResult } from './verify.js';
  import { verifyStudentAssembler } from './sandbox.js';
  import ChipEditor from './ChipEditor.svelte';
  import './course.css';
  export let chapter: CourseChapter;
  let taskIndex = 0;
  let completed: string[] = [];
  let source = '';
  let mode: 'visual' | 'code' | 'split' = 'visual';
  let ready = false;
  let verifying = false;
  let result: CheckResult | null = null;
  let notice = '';
  let title: HTMLHeadingElement;
  let circuit: HDLCircuit | undefined;
  let inspectedSource = '';
  let values: Record<string, number> = {};
  let outputs: Record<string, number> = {};
  let error = '';
  let phase = 'Ready';
  let preview = null as ReturnType<typeof createMachine> | null;
  $: referenceParts = chapter.reference.replace('/learn/reference/', '').split('#');
  $: referenceRoute = (
    referenceParts[1]
      ? `/learn/reference/[...path]#${referenceParts[1]}`
      : '/learn/reference/[...path]'
  ) as '/learn/reference/[...path]' | `/learn/reference/[...path]#${string}`;
  $: task = chapter.tasks[taskIndex];
  $: key = taskKey(chapter, task);
  $: done = completed.includes(key);
  $: nextChapter = courseChapters[courseChapters.findIndex((item) => item.id === chapter.id) + 1];
  $: if (ready && source !== undefined) {
    try {
      localStorage.setItem(`chipsandcode.part-one.draft.${key}`, source);
    } catch {
      notice = 'Drafts are available for this session only.';
    }
  }
  $: if (source !== inspectedSource) {
    circuit = undefined;
    outputs = {};
    preview = null;
    error = '';
    result = null;
  }
  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(courseProgressKey) ?? '[]');
      if (Array.isArray(saved))
        completed = saved.filter((value: unknown): value is string => typeof value === 'string');
    } catch {
      notice = 'Progress is available for this session only.';
    }
    taskIndex = Math.max(
      0,
      chapter.tasks.findIndex((item) => !completed.includes(taskKey(chapter, item))),
    );
    loadTask();
    ready = true;
  });
  function loadTask() {
    const selectedTask = chapter.tasks[taskIndex];
    try {
      source =
        localStorage.getItem(`chipsandcode.part-one.draft.${taskKey(chapter, selectedTask)}`) ??
        selectedTask.starter;
    } catch {
      source = selectedTask.starter;
    }
    result = null;
    circuit = undefined;
    outputs = {};
    values = Object.fromEntries(Object.keys(selectedTask.inputs ?? {}).map((pin) => [pin, 0]));
    mode = selectedTask.kind === 'hdl' ? 'visual' : 'code';
    preview = null;
    error = '';
    phase = 'Ready';
    inspectedSource = source;
  }
  async function choose(index: number) {
    taskIndex = index;
    loadTask();
    await tick();
    title?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function inspect() {
    try {
      error = '';
      inspectedSource = source;
      if (task.kind === 'hdl') {
        circuit = compileHDL(source);
        outputs = circuit.evaluate(values);
        phase = 'Inputs applied';
      } else if (task.kind === 'assembly') {
        preview = createMachine(assemble(source).words);
        phase = 'Program loaded';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'The design could not load.';
      circuit = undefined;
      preview = null;
      outputs = {};
    }
  }
  function applyInput(pin: string, value: string) {
    const number = Number(value);
    values = { ...values, [pin]: number };
    if (circuit) {
      try {
        outputs = circuit.evaluate(values);
        error = '';
      } catch (e) {
        error = e instanceof Error ? e.message : 'Invalid input';
        outputs = {};
      }
    }
  }
  function clock(action: 'tick' | 'tock' | 'reset') {
    if (!circuit) return;
    try {
      if (action === 'reset') {
        circuit.reset();
        outputs = circuit.evaluate(values);
        phase = 'State reset';
      } else {
        outputs = circuit[action]();
        phase = action === 'tick' ? 'Tick · next state captured' : 'Tock · state published';
      }
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Clock failed';
    }
  }
  function stepProgram() {
    if (!preview) return;
    preview.step();
    preview = preview;
    phase = `Instruction ${preview.cycles}`;
  }
  async function verify() {
    if (verifying) return;
    const checkedTask = task,
      checkedKey = key,
      snapshot = source;
    verifying = true;
    error = '';
    result = null;
    inspectedSource = source;
    await tick();
    const answer =
      checkedTask.kind === 'hdl'
        ? verifyHardware(checkedTask, snapshot)
        : checkedTask.kind === 'assembler'
          ? await verifyStudentAssembler(snapshot)
          : verifyAssembly(checkedTask, snapshot);
    verifying = false;
    if (snapshot !== source || checkedKey !== key || checkedTask !== task) return;
    result = answer;
    if (answer.passed && !completed.includes(checkedKey)) {
      completed = [...completed, checkedKey];
      try {
        localStorage.setItem(courseProgressKey, JSON.stringify(completed));
      } catch {
        notice = 'Your work passed. Progress is available for this session only.';
      }
    }
  }
</script>

<svelte:head
  ><title>{chapter.title} — Chips and Code</title><meta
    name="description"
    content={chapter.description}
  /></svelte:head
>
<main class="course-page" data-ready={ready} data-chapter={chapter.id} data-task={task.id}>
  <div class="course-topline">
    <a class="back-link" href={resolve('/learn/path')}>← Computer path</a><a
      href={resolve(referenceRoute, { path: referenceParts[0] })}>Full explanation ↗</a
    >
  </div>
  <header class="course-heading">
    <p class="eyebrow">PROJECT 0{chapter.project} · {chapter.title}</p>
    <h1 bind:this={title} tabindex="-1">{task.title}</h1>
    <p>{task.goal}</p>
  </header>
  <div class="task-position">
    <span>{taskIndex + 1} / {chapter.tasks.length}</span>
    <details>
      <summary>Steps in this layer</summary>
      <ol>
        {#each chapter.tasks as item, index (item.id)}<li>
            <button
              aria-current={index === taskIndex ? 'step' : undefined}
              on:click={() => choose(index)}
              >{item.title}<span
                >{completed.includes(taskKey(chapter, item))
                  ? 'Complete'
                  : index === taskIndex
                    ? 'Current'
                    : ''}</span
              ></button
            >
          </li>{/each}
      </ol>
    </details>
  </div>
  <p class="concept-copy">{task.explanation}</p>
  {#if task.kind === 'symbols'}<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <pre class="program-example" tabindex="0" aria-label="Program for symbol resolution"><code
        >{symbolProgram}</code
      ></pre>{/if}
  {#if task.kind === 'hdl'}
    <div class="workspace-toolbar">
      <label
        >View<select aria-label="Construction view" bind:value={mode}
          ><option value="visual">Visual</option><option value="code">Code</option><option
            value="split">Split</option
          ></select
        ></label
      ><span>{task.chip}.hdl</span>
    </div>
    <ChipEditor {task} bind:source {mode} />
  {:else}<label class="source-editor"
      >{task.kind === 'assembler'
        ? 'Assembler source'
        : task.kind === 'assembly'
          ? 'Assembly source'
          : task.kind === 'symbols'
            ? 'Symbol addresses'
            : 'Machine code answer'}<textarea
        aria-label={task.kind === 'assembler'
          ? 'Assembler source'
          : task.kind === 'assembly'
            ? 'Assembly source'
            : task.kind === 'symbols'
              ? 'Symbol addresses'
              : 'Machine code answer'}
        bind:value={source}
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
      ></textarea></label
    >{/if}
  <div class="verification-bar">
    <button class="primary" on:click={verify} disabled={verifying}
      >{verifying ? 'Checking…' : 'Check my work'}</button
    ><span class="muted">Draft saved on this device</span>
  </div>
  {#if result}<div class:passed={result.passed} class="check-result" role="status">
      <strong>{result.passed ? 'It works.' : 'Keep building.'}</strong>
      <p>{result.message}</p>
      {#if result.passed}{#if taskIndex < chapter.tasks.length - 1}<button
            class="primary"
            on:click={() => choose(taskIndex + 1)}>Continue →</button
          >{:else if nextChapter}<a
            class="primary"
            href={resolve('/learn/path/[chapter]', { chapter: nextChapter.id })}
            >Continue to {nextChapter.title.toLowerCase()} →</a
          >{:else}<p>
            You have reached the assembler. Your hardware and software now meet in machine code.
          </p>
          <a href={resolve('/tools/computer')}>Open the computer tool →</a>{/if}{/if}
    </div>{:else if done}<p class="saved-completion">
      Previously completed. Edit and check again to verify this draft.
    </p>{/if}
  <div class="course-extras">
    <details>
      <summary>Need a hint?</summary>
      <p>{task.hint}</p>
      <a href={resolve(referenceRoute, { path: referenceParts[0] })}>Read the full explanation</a>
    </details>
    {#if task.kind === 'hdl' || task.kind === 'assembly'}<details>
        <summary
          >{task.kind === 'hdl' ? 'Inspect signals and clock' : 'Step through the program'}</summary
        ><button class="secondary" on:click={inspect}
          >{task.kind === 'hdl' ? 'Load this design' : 'Load this program'}</button
        >
        {#if circuit}<div class="signal-values">
            {#each Object.entries(task.inputs ?? {}) as [pin, width] (pin)}<label
                >{pin} <span class="muted">{width} bit{width === 1 ? '' : 's'}</span><input
                  type="number"
                  min="0"
                  max={2 ** width - 1}
                  aria-label={`Input ${pin} ${width} bit${width === 1 ? '' : 's'}`}
                  value={values[pin]}
                  on:input={(event) => applyInput(pin, event.currentTarget.value)}
                /></label
              >{/each}
          </div>
          <div class="clock-controls">
            <button class="secondary" on:click={() => clock('tick')}>Tick</button><button
              class="secondary"
              on:click={() => clock('tock')}>Tock</button
            ><button class="text-action" on:click={() => clock('reset')}>Reset state</button><span
              role="status">{phase}</span
            >
          </div>
          <dl class="live-outputs">
            {#each Object.entries(outputs) as [pin, value] (pin)}<div>
                <dt>{pin}</dt>
                <dd>
                  {value}<small>0b{value.toString(2).padStart(task.outputs?.[pin] ?? 1, '0')}</small
                  >
                </dd>
              </div>{/each}
          </dl>{/if}
        {#if preview}<button class="secondary" on:click={stepProgram}>Step instruction</button>
          <dl class="live-outputs">
            <div>
              <dt>A</dt>
              <dd>{preview.a}</dd>
            </div>
            <div>
              <dt>D</dt>
              <dd>{preview.d}</dd>
            </div>
            <div>
              <dt>PC</dt>
              <dd>{preview.pc}</dd>
            </div>
            <div>
              <dt>RAM[2]</dt>
              <dd>{preview.ram[2]}</dd>
            </div>
          </dl>{/if}
        {#if error}<p class="course-warning" role="alert">{error}</p>{/if}
      </details>{/if}
  </div>
  {#if notice}<p role="status" class="muted">{notice}</p>{/if}
  <footer class="course-footnote">
    Adapted from <a
      href={`https://www.nand2tetris.org/project0${chapter.project}`}
      target="_blank"
      rel="noopener">Nand2Tetris Project {chapter.project}</a
    >. Test results describe the modeled circuit, not physical timing or fabrication.
  </footer>
</main>

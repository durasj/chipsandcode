<script lang="ts">
  import Screen from '#lib/computer/Screen.svelte';
  import { binary16 } from '#lib/computer/hack.js';
  import {
    journeyFillExample,
    loadJourneyProgram,
    runJourneyProgram,
    type RunEvidence,
  } from './runtime';
  export let source = '';
  export let allowStudent = false;
  let program = loadJourneyProgram();
  let origin = 'Supplied example';
  let pressed = false;
  let evidence: RunEvidence | null = null;
  let error = '';
  let loadedSource = '';
  $: draftChanged = origin === 'Your Fill draft · loaded snapshot' && source !== loadedSource;
  $: words = program.machine.screen.slice();
  $: darkWords = words.filter((word) => word !== 0).length;
  function load(student: boolean) {
    try {
      program = loadJourneyProgram(student ? source : journeyFillExample);
      origin = student ? 'Your Fill draft · loaded snapshot' : 'Supplied example';
      loadedSource = student ? source : '';
      evidence = null;
      pressed = false;
      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : 'The program could not be loaded.';
    }
  }
  function toggleKey() {
    pressed = !pressed;
    evidence = null;
    program.machine.setKeyboard(pressed ? 65 : 0);
    program = program;
  }
  function run() {
    evidence = runJourneyProgram(program.machine, pressed ? 65 : 0);
    program = program;
  }
</script>

<section class="runtime" aria-label="Keyboard, program, and screen demonstration">
  <div class="runtime-copy">
    <span class="runtime-kicker">WATCH THE MACHINE DO THE WORK</span>
    <h3>A key becomes pixels.</h3>
    <p class="runtime-status">Reference computer · supplied Screen and Keyboard</p>
    <p>
      The keyboard changes a memory value. Only the running program can turn it into a screen write.
    </p>
    <div class="runtime-controls">
      <button class:pressed aria-pressed={pressed} on:click={toggleKey}
        >{pressed ? 'Release A key' : 'Press A key'}</button
      >
      <button on:click={run} disabled={!!error}>Run program</button>
    </div>
    <p class="runtime-status">
      {origin} · KBD = {pressed ? 65 : 0}<br />CPU cycles: {program.machine.cycles.toLocaleString(
        'en-US',
      )}
    </p>
    {#if draftChanged}<p class="runtime-status">
        Your draft has changed. Reload it to run the latest version.
      </p>{/if}
    <div class="runtime-load">
      {#if allowStudent}<button on:click={() => load(true)}>Load my Fill draft</button>{/if}
      <button on:click={() => load(false)}>Reset example</button>
    </div>
  </div>
  <div class="runtime-screen">
    <Screen {words} />
    <p data-runtime-pixels>
      {darkWords.toLocaleString('en-US')} / 8,192 screen words contain dark pixels.
    </p>
  </div>
  <div class="execution-evidence" aria-live="polite" aria-atomic="true">
    {#if evidence}
      <ol>
        <li>
          <strong>Keyboard</strong><span
            >{pressed ? '65 (A)' : '0 (released)'} at address 24576</span
          >
        </li>
        <li>
          <strong>CPU read</strong><span
            >{evidence.read
              ? `${evidence.read.inM} at instruction ${evidence.read.before.pc}`
              : 'No keyboard read observed in this run'}</span
          >
        </li>
        <li>
          <strong>Memory write</strong><span
            >{evidence.write
              ? `${evidence.write.outM} → address ${evidence.write.addressM}`
              : 'No screen write observed in this run'}</span
          >
        </li>
        <li><strong>Pixels</strong><span>Drawn from the actual 8,192 screen words</span></li>
      </ol>
      {#if evidence.read}<p class="encoded">
          Executed word: {binary16(evidence.read.instruction)} · PC {evidence.read.before.pc}
        </p>{/if}
      {#if program.machine.halted}<p>
          The program reached the end of its loaded instructions.
        </p>{/if}
    {:else}<p>
        Change the key, then run. The display stays unchanged until instructions execute.
      </p>{/if}
  </div>
  {#if error}<p class="runtime-error" role="alert">
      {error} Fix the source and load it again, or reset the example.
    </p>{/if}
  <details>
    <summary>Inspect the supplied program and encoded instructions</summary>
    <p>
      This example demonstrates the runtime. Loading it does not change your answer or completion.
    </p>
    <div class="translation">
      <pre aria-label="Supplied assembly source">{journeyFillExample}</pre>
      <pre aria-label="Example machine instructions">{loadJourneyProgram().assembly.binary}</pre>
    </div>
  </details>
</section>

<style>
  .runtime {
    border-top: 1px solid #3c4059;
    padding: 28px 0 0;
    margin-top: 24px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
    color: #e7e6f3;
  }
  .runtime-kicker {
    color: #c2b6ff;
    font:
      10px/1.5 ui-monospace,
      monospace;
    letter-spacing: 0.1em;
  }
  h3 {
    font-size: 24px;
    font-weight: 500;
    letter-spacing: -0.025em;
    margin: 8px 0 12px;
  }
  p {
    color: #b9c2d7;
    font-size: 13px;
    line-height: 1.65;
    margin: 8px 0;
  }
  .runtime-controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 18px;
  }
  button {
    font: 12px/1.5 inherit;
    min-height: 40px;
    padding: 9px 13px;
    border: 1px solid #77718f;
    color: #eee9ff;
    border-radius: 4px;
    cursor: pointer;
    background: #1c1d31;
  }
  button:hover,
  button.pressed {
    background: #403265;
    border-color: #c3b5ff;
  }
  .runtime-status {
    font:
      11px/1.8 ui-monospace,
      monospace;
    margin: 14px 0;
  }
  .runtime-load {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .runtime-load button {
    background: transparent;
    border: 0;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .runtime-screen {
    align-self: center;
    min-width: 0;
  }
  .runtime-screen p {
    font:
      10px/1.5 ui-monospace,
      monospace;
  }
  .execution-evidence,
  details,
  .runtime-error {
    grid-column: 1/-1;
  }
  .execution-evidence {
    background: #0e1320;
    padding: 14px;
    border-radius: 5px;
  }
  ol {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    padding: 0;
    list-style: none;
    margin: 0;
  }
  li {
    min-width: 0;
    font-size: 11px;
  }
  strong {
    display: block;
    font-weight: 500;
    color: #c8bcff;
    margin-bottom: 5px;
  }
  li span {
    color: #b9c2d7;
    line-height: 1.6;
  }
  .encoded {
    font:
      10px/1.6 ui-monospace,
      monospace;
    margin-top: 14px;
  }
  summary {
    cursor: pointer;
    color: #d3c9ff;
    font-size: 12px;
    min-height: 30px;
  }
  .translation {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  pre {
    background: #0a0e18;
    padding: 14px;
    color: #c0c8dd;
    font:
      11px/1.7 ui-monospace,
      monospace;
    overflow: auto;
  }
  .runtime-error {
    color: #f2b4b9;
  }
  @media (max-width: 650px) {
    .runtime {
      grid-template-columns: 1fr;
    }
    ol {
      grid-template-columns: 1fr 1fr;
    }
    .translation {
      grid-template-columns: 1fr;
    }
  }
</style>

<script lang="ts">
  import type { HDLCircuit } from './hdl.js';
  import { createHDLTest } from './testing.js';
  export let circuit: HDLCircuit | undefined;
  export let onupdate: () => void = () => {};
  let script = 'output-list time%S1.4.1;\ntick, output;\ntock, output;\n';
  let compare = '';
  let files: Record<string, string> = {};
  let session: ReturnType<typeof createHDLTest> | undefined;
  let error = '';
  let message = '';
  function edited() {
    session = undefined;
    error = '';
    message = '';
  }
  function execute(single: boolean) {
    error = '';
    if (!circuit) return;
    try {
      if (!session) {
        circuit.reset();
        session = createHDLTest(circuit, script, {
          compare: compare.trim() ? compare : undefined,
          files,
        });
      }
      if (single) session.step();
      else session.run(1000);
      session = session;
      onupdate();
      message = `${session.status} · ${session.rows.length} output rows${compare.trim() ? ` · ${session.passed} passed, ${session.failed} failed` : ''}`;
      if (session.error) error = session.error;
    } catch (problem) {
      error = problem instanceof Error ? problem.message : String(problem);
    }
  }
  async function upload(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    error = '';
    try {
      if (selected.reduce((size, file) => size + file.size, 0) > 2000000)
        throw new Error('Keep test files below 2 MB total.');
      const next = { ...files };
      for (const file of selected) next[file.name] = await file.text();
      files = next;
      edited();
    } catch (problem) {
      error = problem instanceof Error ? problem.message : String(problem);
    }
    input.value = '';
  }
</script>

<details>
  <summary>Test scripts</summary>
  <p>
    Run Nand2Tetris TST commands against this circuit. A new run resets stored state. Each batch
    runs at most 1,000 commands; continue a paused test when ready.
  </p>
  <div class="machine-grid">
    <label
      >TST script<textarea
        bind:value={script}
        on:input={edited}
        spellcheck="false"
        autocapitalize="off"
        aria-label="TST script"
      ></textarea></label
    ><label
      >Expected output<textarea
        bind:value={compare}
        on:input={edited}
        spellcheck="false"
        aria-label="Expected output"
        placeholder="Optional .cmp contents. Leave empty to inspect actual output."
      ></textarea></label
    >
  </div>
  <div class="field-row">
    <button
      class="action primary"
      on:click={() => execute(false)}
      disabled={!circuit || session?.done}
      >{session && !session.done ? 'Continue test' : 'Run tests'}</button
    ><button class="action" on:click={() => execute(true)} disabled={!circuit || session?.done}
      >Step test</button
    ><button class="action" on:click={edited} disabled={!session}>Restart test</button>
  </div>
  <p class="status" role="status">{message}</p>
  {#if error}<p class="error" role="alert">{error}</p>{/if}{#if session}<label
      >Actual test output<textarea
        readonly
        value={session.output}
        aria-label="Actual test output"
        spellcheck="false"
      ></textarea></label
    >{#if session.messages.length}<ul>
        {#each session.messages as text, index (index)}<li>{text}</li>{/each}
      </ul>{/if}{#each session.rows.filter((row) => row.pass === false) as row, index (index)}<p
        class="error"
      >
        {row.differences.join('; ')}
      </p>{/each}{/if}
  <details>
    <summary>ROM and test files</summary>
    <p>Supply files referenced by the script, such as a .hack program loaded into ROM32K.</p>
    <label
      >Test files<input
        type="file"
        multiple
        accept=".hack,.asm,.tst,.cmp,.out"
        on:change={upload}
      /></label
    >{#if Object.keys(files).length}<p class="small-note">{Object.keys(files).join(', ')}</p>
      <button
        class="text-button"
        on:click={() => {
          files = {};
          edited();
        }}>Clear test files</button
      >{/if}
  </details>
</details>

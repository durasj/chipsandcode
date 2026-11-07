<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import '#lib/tools/lab.css';
  import '#lib/computer/workspace.css';
  import { compileHDL } from '#lib/computer/hdl.js';
  import TestPanel from '#lib/computer/TestPanel.svelte';
  import { assemble, parseHack } from '#lib/computer/hack.js';

  const examples = {
    inverter: 'CHIP Probe {\n  IN in[16];\n  OUT out[16];\n  PARTS:\n  Not16(in=in, out=out);\n}',
    arithmetic:
      'CHIP Probe {\n  IN x[16], y[16], zx, nx, zy, ny, f, no;\n  OUT out[16], zr, ng;\n  PARTS:\n  ALU(x=x, y=y, zx=zx, nx=nx, zy=zy, ny=ny, f=f, no=no, out=out, zr=zr, ng=ng);\n}',
    register:
      'CHIP Probe {\n  IN in[16], load;\n  OUT out[16];\n  PARTS:\n  Register(in=in, load=load, out=out);\n}',
    computer: 'CHIP Probe {\n  IN reset;\n  PARTS:\n  Computer(reset=reset);\n}',
  };
  const draftKey = 'chipsandcode.chip-builder.v1';
  let source = examples.inverter;
  let dependencies: { id: number; source: string }[] = [];
  let nextId = 0;
  let mode = 'split';
  let ready = false;
  let circuit: ReturnType<typeof compileHDL> | undefined;
  let inputWidths: Record<string, number> = {};
  let outputWidths: Record<string, number> = {};
  let inputValues: Record<string, string> = {};
  let outputs: Record<string, number> = {};
  let phase = 'low';
  let cycles = 0;
  let error = '';
  let notice = '';
  let status = '';
  let romSource = '@7\nD=A\n@R0\nM=D\n';
  let romFormat = 'assembly';
  let keyboardValue = '0';
  let peripheralError = '';
  let inspectAddress = '0';
  let memoryValue: number | null = null;
  let memoryError = '';
  let inspectingMemory = false;

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (saved && typeof saved.source === 'string') {
        source = saved.source;
        if (Array.isArray(saved.dependencies))
          dependencies = saved.dependencies
            .filter(
              (item: unknown): item is { id: number; source: string } =>
                !!item &&
                typeof item === 'object' &&
                'source' in item &&
                typeof item.source === 'string',
            )
            .map((item: { source: string }, i: number) => ({ id: i, source: item.source }));
        nextId = dependencies.length;
      }
    } catch {
      notice = 'Your draft can only be kept for this session.';
    }
    ready = true;
    compile();
  });
  function remember() {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ source, dependencies }));
    } catch {
      notice = 'Your draft can only be kept for this session.';
    }
  }
  function edited() {
    inspectingMemory = false;
    memoryValue = null;
    circuit = undefined;
    inputWidths = {};
    outputWidths = {};
    outputs = {};
    error = '';
    phase = 'low';
    cycles = 0;
    status = 'Source changed. Compile to inspect the new circuit.';
    queueMicrotask(remember);
  }
  function compile() {
    inspectingMemory = false;
    memoryValue = null;
    memoryError = '';
    error = '';
    peripheralError = '';
    phase = 'low';
    cycles = 0;
    try {
      const chips: Record<string, string> = {};
      for (const dependency of dependencies) {
        const clean = dependency.source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
        const name = clean.match(/\bCHIP\s+([A-Za-z_][A-Za-z0-9_]*)/)?.[1];
        if (!name)
          throw new Error('Each custom chip needs a CHIP name and its own HDL definition.');
        if (chips[name])
          throw new Error(
            `Two custom chips are named ${name}. Give each definition a unique name.`,
          );
        chips[name] = dependency.source;
      }
      circuit = compileHDL(source, chips);
      inputWidths = circuit.inputWidths;
      outputWidths = circuit.outputWidths;
      inputValues = Object.fromEntries(Object.keys(inputWidths).map((name) => [name, '0']));
      outputs = circuit.evaluate();
      status = 'Circuit compiled. Change an input to follow its output.';
      remember();
    } catch (problem) {
      circuit = undefined;
      inputWidths = {};
      outputWidths = {};
      outputs = {};
      error = problem instanceof Error ? problem.message : String(problem);
      status = '';
    }
  }
  function parsedInputs() {
    return Object.fromEntries(
      Object.entries(inputWidths).map(([name, width]) => {
        const raw = inputValues[name]?.trim() ?? '';
        const value = raw ? Number(raw) : NaN;
        if (!Number.isInteger(value) || value < 0 || value > 2 ** width - 1)
          throw new Error(
            `Input ${name} must be an integer from 0 to ${2 ** width - 1}. Decimal, 0x hex, and 0b binary are accepted.`,
          );
        return [name, value];
      }),
    );
  }
  function evaluate() {
    error = '';
    try {
      if (circuit) outputs = circuit.evaluate(parsedInputs());
      if (inspectingMemory) inspectMemory();
    } catch (problem) {
      outputs = {};
      error = problem instanceof Error ? problem.message : String(problem);
    }
  }
  function advance() {
    if (!circuit) return;
    error = '';
    try {
      const values = parsedInputs();
      if (phase === 'low') {
        outputs = circuit.tick(values);
        phase = 'high';
        status = 'Tick: next state captured. Tock makes that state visible.';
      } else {
        outputs = circuit.tock();
        phase = 'low';
        cycles += 1;
        status = `Tock: state committed. ${cycles} complete ${cycles === 1 ? 'cycle' : 'cycles'}.`;
      }
      if (inspectingMemory) inspectMemory();
    } catch (problem) {
      outputs = {};
      error = problem instanceof Error ? problem.message : String(problem);
    }
  }
  function reset() {
    if (!circuit) return;
    circuit.reset();
    phase = 'low';
    cycles = 0;
    inputValues = Object.fromEntries(Object.keys(inputWidths).map((name) => [name, '0']));
    outputs = circuit.evaluate();
    error = '';
    keyboardValue = '0';
    circuit.setKeyboard(0);
    status = 'Circuit state reset. Inputs are 0.';
    if (inspectingMemory) inspectMemory();
  }
  function addDependency() {
    const id = nextId++;
    dependencies = [
      ...dependencies,
      {
        id,
        source: `CHIP Custom${id + 1} {\n  IN in;\n  OUT out;\n  PARTS:\n  // Add your parts here.\n}`,
      },
    ];
    edited();
  }
  function removeDependency(id: number) {
    dependencies = dependencies.filter((item) => item.id !== id);
    edited();
  }
  function loadExample(key: keyof typeof examples) {
    source = examples[key];
    compile();
  }
  function loadProgram() {
    if (!circuit) return;
    peripheralError = '';
    try {
      const words = romFormat === 'assembly' ? assemble(romSource).words : parseHack(romSource);
      if (!words.length) throw new Error('Add at least one program instruction.');
      circuit.loadROM(words);
      outputs = circuit.evaluate();
      status = `${words.length} instructions loaded into ROM. Advance the clock to execute them.`;
    } catch (problem) {
      peripheralError = problem instanceof Error ? problem.message : String(problem);
    }
  }
  function setKeyboard() {
    peripheralError = '';
    const value = Number(keyboardValue);
    if (!Number.isInteger(value) || value < 0 || value > 32767) {
      peripheralError = 'Keyboard code must be an integer from 0 to 32767.';
      return;
    }
    circuit?.setKeyboard(value);
    evaluate();
  }
  function inspectMemory() {
    memoryError = '';
    memoryValue = null;
    if (!circuit) return;
    try {
      const address = Number(inspectAddress);
      if (!inspectAddress.trim() || !Number.isInteger(address) || address < 0 || address > 24576)
        throw new Error('Choose a mapped memory address from 0 to 24576.');
      memoryValue = circuit.readMemory(address);
      inspectingMemory = true;
    } catch (problem) {
      inspectingMemory = false;
      memoryError = problem instanceof Error ? problem.message : String(problem);
    }
  }
</script>

<svelte:head
  ><title>Chip builder · Tools · Chips and Code</title><meta
    name="description"
    content="Build and test multi-bit and clocked HDL circuits, from logic gates to memory and a computer."
  /></svelte:head
>
<main class="logic-lab machine-lab" data-ready={ready} aria-labelledby="builder-title">
  <a class="back-link" href={resolve('/tools')}>← Tools</a>
  <header class="tool-heading">
    <p class="eyebrow">From gates to a computer</p>
    <h1 id="builder-title">Chip builder</h1>
    <p class="tool-intro">
      Connect parts in HDL. Inspect whole words. Advance the clock to see state change.
    </p>
  </header>
  <div class="workspace-toolbar">
    <label
      >View<select bind:value={mode}
        ><option value="split">Split</option><option value="visual">Visual</option><option
          value="code">Code</option
        ></select
      ></label
    ><button class="action primary" on:click={compile}>Compile</button><button
      class="action"
      on:click={advance}
      disabled={!circuit}>{phase === 'low' ? 'Tick' : 'Tock'}</button
    ><button class="action" on:click={reset} disabled={!circuit}>Reset</button>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <p class="status" role="status">{status}</p>
  <div class="machine-grid" class:single={mode !== 'split'}>
    {#if mode !== 'visual'}<section class="code-panel" aria-labelledby="hdl-heading">
        <h2 id="hdl-heading">Circuit definition</h2>
        <label
          ><span class="sr-only">Chip HDL</span><textarea
            bind:value={source}
            on:input={edited}
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            aria-label="Chip HDL"
          ></textarea></label
        >
        <p class="hint">
          Bus bit 0 is the least significant bit. Connect slices with <code>in[0..7]</code>.
        </p>
        <details>
          <summary>Inspect a supplied component</summary>
          <p>
            Each probe wraps one supplied component. Replace its parts to build your own design.
          </p>
          <div class="field-row">
            <button class="action" on:click={() => loadExample('inverter')}>16-bit inverter</button
            ><button class="action" on:click={() => loadExample('arithmetic')}>ALU</button><button
              class="action"
              on:click={() => loadExample('register')}>Register</button
            ><button class="action" on:click={() => loadExample('computer')}>Computer</button>
          </div>
        </details>
        <details>
          <summary
            >Your chip dependencies{dependencies.length ? ` · ${dependencies.length}` : ''}</summary
          >
          <p>
            Give each custom chip its own HDL definition. Its name can then be used as a part above.
          </p>
          {#each dependencies as dependency, index (dependency.id)}<div class="dependency">
              <label
                >Custom chip {index + 1}<textarea
                  bind:value={dependency.source}
                  on:input={edited}
                  spellcheck="false"
                  autocapitalize="off"
                  aria-label={`Custom chip ${index + 1} HDL`}
                ></textarea></label
              ><button class="text-button" on:click={() => removeDependency(dependency.id)}
                >Remove custom chip {index + 1}</button
              >
            </div>{/each}
          <button class="action" on:click={addDependency}>Add custom chip</button>
        </details>
      </section>{/if}
    {#if mode !== 'code'}<section class="machine-panel panel" aria-labelledby="signals-heading">
        <h2 id="signals-heading">Live signals</h2>
        {#if circuit}
          <div class="clock">
            <span>Clock {phase}</span><strong>{cycles}</strong><span>manual cycles</span>
          </div>
          {#if Object.keys(inputWidths).length}<h3>Inputs</h3>
            {#each Object.entries(inputWidths) as [name, width] (name)}<div class="field-row">
                <label
                  >Input {name}<input
                    type="text"
                    inputmode="numeric"
                    bind:value={inputValues[name]}
                    on:input={(event) => {
                      inputValues[name] = event.currentTarget.value;
                      evaluate();
                    }}
                    aria-label={`Input ${name}`}
                    aria-describedby={`pin-width-${name}`}
                  /></label
                >
                <span id={`pin-width-${name}`} class="small-note"
                  >{width} {width === 1 ? 'bit' : 'bits'}</span
                >
              </div>{/each}{:else}<p class="hint">This circuit has no external inputs.</p>{/if}
          <h3>Outputs</h3>
          {#if Object.keys(outputWidths).length}<dl class="output-list">
              {#each Object.entries(outputWidths) as [name, width] (name)}<div>
                  <dt>{name} · {width} {width === 1 ? 'bit' : 'bits'}</dt>
                  <dd>
                    <span data-testid={`chip-output-${name}`}>{outputs[name] ?? '—'}</span>
                    {#if outputs[name] !== undefined}<span class="word"
                        >{outputs[name].toString(2).padStart(width, '0')}</span
                      >{/if}
                  </dd>
                </div>{/each}
            </dl>{:else}<p class="hint">
              This circuit has no external output pins. Use a CPU or Memory probe to expose internal
              behavior, or run a complete program in the <a href={resolve('/tools/computer')}
                >computer tool</a
              >.
            </p>{/if}
          <p class="hint">
            Combinational outputs follow input changes. Stored values become visible at tock.
          </p>
        {:else}<p class="hint">Compile your circuit to reveal its pins.</p>{/if}
      </section>{/if}
  </div>
  {#key circuit}<TestPanel
      {circuit}
      onupdate={() => {
        if (circuit) {
          outputs = { ...circuit.outputs };
          phase = circuit.phase === 'tick' ? 'high' : 'low';
          if (inspectingMemory) inspectMemory();
        }
      }}
    />{/key}
  <details>
    <summary>ROM and keyboard</summary>
    <p>
      For circuits containing ROM32K, Keyboard, or Computer. These controls supply the program and
      keyboard memory value.
    </p>
    <div class="field-row">
      <label
        >Program format<select bind:value={romFormat}
          ><option value="assembly">Hack assembly</option><option value="binary"
            >Binary .hack</option
          ></select
        ></label
      ><button class="action" on:click={loadProgram} disabled={!circuit}>Load ROM</button>
    </div>
    <label
      >ROM program<textarea bind:value={romSource} spellcheck="false" aria-label="ROM program"
      ></textarea></label
    >
    <div class="field-row">
      <label
        >Keyboard code<input type="text" inputmode="numeric" bind:value={keyboardValue} /></label
      ><button class="action" on:click={setKeyboard} disabled={!circuit}>Set keyboard</button>
    </div>
    {#if peripheralError}<p class="error" role="alert">{peripheralError}</p>{/if}
    <h3>Inspect your computer's memory</h3>
    <p class="hint">
      Read the memory inside your compiled circuit. Once selected, this word updates as you advance
      its clock.
    </p>
    <div class="field-row">
      <label
        >Memory address<input
          type="text"
          inputmode="numeric"
          bind:value={inspectAddress}
          on:input={() => {
            inspectingMemory = false;
            memoryValue = null;
          }}
        /></label
      ><button class="action" on:click={inspectMemory} disabled={!circuit}>Inspect memory</button>
    </div>
    <p class="small-note">
      Memory word: <output data-testid="chip-memory-word">{memoryValue ?? '—'}</output>
    </p>
    {#if memoryError}<p class="error" role="alert">{memoryError}</p>{/if}
  </details>
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  <div class="more-reading">
    <a href={resolve('/learn/path')}>Continue building your computer ↗</a><a
      href={resolve('/learn/reference/[...path]#reading-hdl', { path: 'boolean-logic/background' })}
      >HDL reference ↗</a
    ><a href={resolve('/tools/computer')}>Run assembly on the computer ↗</a>
  </div>
</main>

<style>
  .clock {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 12px;
    color: #bfc5da;
    padding: 18px 0;
    border-top: 1px solid #525b74;
    border-bottom: 1px solid #525b74;
    font:
      12px/1.7 ui-monospace,
      monospace;
  }
  .clock strong {
    color: #eeeaff;
    font-size: 24px;
    font-weight: 500;
  }
  .word {
    display: block;
    color: #bfc5da;
    font:
      12px/1.6 ui-monospace,
      monospace;
    overflow-wrap: anywhere;
  }
  .dependency {
    margin: 24px 0;
  }
</style>

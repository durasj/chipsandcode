<script lang="ts">
  import { onMount } from 'svelte';
  import '#lib/tools/lab.css';
  import {
    binaryWord,
    busComponents,
    busInputNames,
    busSelectorCount,
    parseWord,
    simulateBus,
    type BusComponent,
  } from '#lib/tools/logic.js';

  let ready = false;
  onMount(() => {
    ready = true;
  });
  let component: BusComponent = 'not16';
  let selector = 0;
  let editInput = 'in';
  let signal = true;
  let words: Record<string, string> = {
    a: '0x00f0',
    b: '0x0f0f',
    c: '0x3333',
    d: '0x5555',
    e: '0xaaaa',
    f: '0x8000',
    g: '0x0001',
    h: '0xffff',
    in: '0x00f0',
  };

  $: info = busComponents.find((entry) => entry.id === component)!;
  $: names = busInputNames(component);
  $: choices = busSelectorCount(component);
  $: isDemux = component.startsWith('dmux');
  $: isMux = component.startsWith('mux');
  $: inputWidth = component === 'or8way' ? 8 : 16;
  $: outputWidth = isDemux || component === 'or8way' ? 1 : 16;
  $: parsed = Object.fromEntries(
    names.map((name) => [
      name,
      isDemux ? { value: Number(signal), error: '' } : parseWord(words[name], inputWidth),
    ]),
  );
  $: valid = names.every((name) => parsed[name].value !== null);
  $: outputs = valid
    ? simulateBus(
        component,
        Object.fromEntries(names.map((name) => [name, parsed[name].value as number])),
        selector,
      )
    : null;
  $: editableNames = names.length > 2 ? [editInput] : names;
  $: selectedName = String.fromCharCode(97 + selector);
  $: errorNames = names.filter((name) => parsed[name].error);

  function chooseComponent(next: BusComponent) {
    component = next;
    selector = 0;
    editInput = busInputNames(next)[0];
  }
  function editWord(name: string, value: string) {
    words = { ...words, [name]: value };
  }
  function toggleBit(name: string, bit: number) {
    const current = parsed[name].value;
    if (current === null) return;
    editWord(name, `0b${binaryWord(current ^ (1 << bit), inputWidth)}`);
  }
</script>

<svelte:head>
  <title>Buses and routing · Tools · Chips and Code</title>
  <meta
    name="description"
    content="Explore multi-bit logic and multi-way routing with 16-bit words, selectors, and live outputs."
  />
</svelte:head>

<main class="logic-lab" data-ready={ready} aria-labelledby="buses-title">
  <a href="/tools" class="back-link"><span aria-hidden="true">←</span> Tools</a>
  <header class="tool-heading">
    <p class="eyebrow">Logic lab / 02</p>
    <h1 id="buses-title">Buses and routing</h1>
    <p class="tool-intro">
      A bus groups signals into a word. Explore what happens when gates act on whole words, or
      selectors choose their path.
    </p>
  </header>

  <div class="component-choice">
    <label
      >Component
      <select
        aria-label="Component"
        value={component}
        on:change={(event) => chooseComponent(event.currentTarget.value as BusComponent)}
      >
        {#each busComponents as entry}<option value={entry.id}>{entry.name}</option>{/each}
      </select>
    </label>
    <p class="small-note">
      {isDemux ? '1-bit routing' : component === 'or8way' ? '8 inputs → 1 output' : '16-bit words'}
    </p>
  </div>
  <h2 class="contract-line">{info.description}</h2>

  <div class="lab-grid">
    <section class="panel input-panel" aria-labelledby="inputs-heading">
      <h2 id="inputs-heading">Inputs</h2>
      {#if isDemux}
        <button
          class="signal-button"
          aria-label={`Input in ${Number(signal)}`}
          aria-pressed={signal}
          on:click={() => (signal = !signal)}
          ><span>in</span>{' '}<strong>{Number(signal)}</strong></button
        >
      {:else}
        {#if names.length > 2}
          <label class="edit-choice"
            >Input to edit
            <select aria-label="Input to edit" bind:value={editInput}>
              {#each names as name}<option value={name}>Input {name}</option>{/each}
            </select>
          </label>
        {/if}
        <div class="word-fields">
          {#each editableNames as name}
            <div>
              <label for={`word-${name}`}
                >Input {name}
                <input
                  id={`word-${name}`}
                  type="text"
                  spellcheck="false"
                  autocomplete="off"
                  value={words[name]}
                  aria-invalid={parsed[name].error ? 'true' : 'false'}
                  aria-describedby={parsed[name].error
                    ? `word-${name}-error word-format`
                    : 'word-format'}
                  on:input={(event) => editWord(name, event.currentTarget.value)}
                />
              </label>
              {#if parsed[name].error}<p class="error" id={`word-${name}-error`} role="alert">
                  {parsed[name].error}
                </p>{/if}
            </div>
          {/each}
        </div>
        <p class="hint" id="word-format">
          Decimal, 0x hex, or 0b binary. {inputWidth} bits: 0–{(2 ** inputWidth - 1).toLocaleString(
            'en-US',
          )}.
        </p>
        {#if errorNames.some((name) => !editableNames.includes(name))}
          <p class="error" role="alert">
            Check input {errorNames.filter((name) => !editableNames.includes(name)).join(', ')} using
            “Input to edit”.
          </p>
        {/if}
      {/if}

      {#if choices}
        <label class="selector-choice"
          >Selector
          <select aria-label="Selector" bind:value={selector}>
            {#each Array.from({ length: choices }) as _, index}
              <option value={index}
                >{binaryWord(index, Math.log2(choices))} · {isDemux ? 'output' : 'input'}
                {String.fromCharCode(97 + index)}</option
              >
            {/each}
          </select>
        </label>
        <p class="hint">
          {Math.log2(choices)} selector {choices === 2 ? 'bit chooses' : 'bits choose'} one of {choices}
          {isDemux ? 'outputs' : 'inputs'}.
        </p>
      {/if}

      {#if !isDemux}
        <details class="bit-editor">
          <summary>Inspect individual bits</summary>
          <p class="hint">
            Bit {inputWidth - 1} is on the left. Bit 0, worth 1, is on the right. Toggle a bit to change
            its word.
          </p>
          {#each editableNames as name}
            <p class="bit-label">Input {name}</p>
            {#if parsed[name].value !== null}
              <div class="bits editable-bits" class:eight-bits={inputWidth === 8}>
                {#each binaryWord(parsed[name].value as number, inputWidth).split('') as bit, index}
                  <button
                    class:one={bit === '1'}
                    aria-label={`Input ${name} bit ${inputWidth - 1 - index}: ${bit}`}
                    aria-pressed={bit === '1'}
                    on:click={() => toggleBit(name, inputWidth - 1 - index)}
                  >
                    <small aria-hidden="true">{inputWidth - 1 - index}</small><span>{bit}</span>
                  </button>
                {/each}
              </div>
            {:else}<p class="error">Enter a valid word before editing its bits.</p>{/if}
          {/each}
        </details>
      {/if}
    </section>

    <section class="panel output-panel" aria-labelledby="outputs-heading">
      <div class="output-heading">
        <h2 id="outputs-heading">{isDemux ? 'Output paths' : 'Output'}</h2>
        <span class="chip-name">{info.name}</span>
      </div>
      {#if outputs}
        {#if isDemux}
          <table class="route-table">
            <caption
              >Only output {selectedName} receives the input. All other outputs are 0.</caption
            >
            <thead
              ><tr
                ><th scope="col">Output</th><th scope="col">Path</th><th scope="col">Value</th></tr
              ></thead
            >
            <tbody
              >{#each Object.entries(outputs) as [name, value]}
                <tr class:active-row={name === selectedName}
                  ><th scope="row">{name}</th><td>{name === selectedName ? 'selected' : '—'}</td><td
                    ><output data-testid={`bus-output-${name}`} aria-label={`Output ${name}`}
                      >{value}</output
                    ></td
                  ></tr
                >
              {/each}</tbody
            >
          </table>
          <p class="route-status" aria-live="polite" data-testid="bus-output">
            Input {Number(signal)} → output {selectedName}: {outputs[selectedName]}
          </p>
        {:else}
          <output
            class="numeric-output"
            data-testid="bus-output"
            aria-live="polite"
            aria-label="Output value">{outputs.out}</output
          >
          {#if outputWidth === 16}<p class="hex-output">
              0x{outputs.out.toString(16).toUpperCase().padStart(4, '0')}
            </p>{/if}
          <div
            class="bits output-bits"
            class:single-bit={outputWidth === 1}
            role="img"
            aria-label={`Output bits ${binaryWord(outputs.out, outputWidth)}`}
          >
            {#each binaryWord(outputs.out, outputWidth).split('') as bit, index}<span
                class:one={bit === '1'}><small>{outputWidth - 1 - index}</small><b>{bit}</b></span
              >{/each}
          </div>
          {#if isMux}<p class="route-status">
              Input {selectedName} → out. Every bit travels together.
            </p>
          {:else if component === 'or8way'}<p class="route-status">
              {outputs.out ? 'At least one input bit is 1.' : 'All eight input bits are 0.'}
            </p>
          {:else}<p class="route-status">
              The same {component === 'not16' ? 'NOT' : component === 'and16' ? 'AND' : 'OR'} operation
              at each of 16 positions.
            </p>{/if}
        {/if}
      {:else}
        <div class="unavailable" data-testid="bus-output">
          <span aria-hidden="true">—</span>
          <p>Enter valid inputs to see the output.</p>
        </div>
      {/if}

      {#if isMux}
        <table class="route-table mux-table">
          <caption>Available input words</caption>
          <thead
            ><tr><th scope="col">Input</th><th scope="col">Decimal</th><th scope="col">Path</th></tr
            ></thead
          >
          <tbody
            >{#each names as name, index}<tr class:active-row={selector === index}
                ><th scope="row">{name}</th><td>{parsed[name].value ?? 'invalid'}</td><td
                  >{selector === index ? '→ out' : '—'}</td
                ></tr
              >{/each}</tbody
          >
        </table>
      {/if}
    </section>
  </div>

  <details>
    <summary>How this component is built</summary>
    {#if component === 'not16' || component === 'and16' || component === 'or16'}
      <p>
        Place 16 copies of a single-bit {component === 'not16'
          ? 'NOT'
          : component === 'and16'
            ? 'AND'
            : 'OR'} gate side by side. Each copy handles one bit position. There is no carry between positions:
        this is bitwise logic, not arithmetic.
      </p>
    {:else if component === 'or8way'}
      <p>
        Combine pairs with OR, then combine their results until one bit remains. A tree of seven
        two-input OR gates can combine eight inputs.
      </p>
    {:else if isMux}
      <p>
        A Mux16 uses 16 single-bit Mux gates controlled by the same selector. Larger multiplexors
        form a tree: {component === 'mux8way16'
          ? 'seven Mux16 chips select among eight input words'
          : component === 'mux4way16'
            ? 'three Mux16 chips select among four input words'
            : 'one selector chooses the entire a or b word'}. The selector is an unsigned binary
        index: zero selects a.
      </p>
    {:else}
      <p>
        Route the signal through a tree of single-bit DMux gates. A {choices}-way demultiplexor
        needs {choices - 1} two-way DMux gates. The selected path receives the input; every other output
        stays at 0, even when the selected input is 1.
      </p>
    {/if}
    <p>
      These models let you explore the bus contracts directly. General bus construction in HDL is
      still ahead; the <a href="/tools/hardware-simulator">hardware simulator</a> currently builds single-bit
      circuits.
    </p>
  </details>

  <div class="more-reading">
    <a href="/learn/reference/boolean-logic/project#buses">Read the full explanation ↗</a>
    <a href="/tools/boolean-functions">Explore Boolean functions ↗</a>
  </div>
</main>

<style>
  .contract-line {
    margin-bottom: 26px;
    color: #e5e1fa;
    line-height: 1.6;
  }
  .word-fields {
    display: grid;
    gap: 20px;
  }
  .edit-choice {
    margin-bottom: 22px;
  }
  .selector-choice {
    border-top: 1px solid #41465b;
    padding-top: 22px;
    margin-top: 22px;
  }
  .output-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 25px;
  }
  .output-heading h2 {
    margin-bottom: 0;
  }
  .chip-name {
    color: #c0b5ff;
    font:
      12px ui-monospace,
      monospace;
  }
  .numeric-output {
    display: block;
    font:
      500 clamp(36px, 5vw, 56px)/1.1 ui-monospace,
      monospace;
    color: #eeeaff;
  }
  .hex-output {
    color: #b8bbd0;
    font:
      13px ui-monospace,
      monospace;
    margin: 12px 0 0;
  }
  .bits {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 5px;
  }
  .bits > span,
  .bits > button {
    display: grid;
    gap: 5px;
    justify-items: center;
    border: 1px solid #66708b;
    background: #111523;
    color: #d1d6e9;
    padding: 7px 0;
    min-width: 0;
    border-radius: 3px;
    font:
      16px/1.3 ui-monospace,
      monospace;
  }
  .bits > .one {
    border-color: #c0b5ff;
    color: white;
    background: #40377e;
  }
  .bits b {
    font-weight: 500;
  }
  .bits small {
    color: #c9cbe0;
    font-size: 10px;
  }
  .output-bits {
    margin-top: 26px;
  }
  .single-bit {
    max-width: 52px;
    grid-template-columns: 1fr;
  }
  .route-status {
    color: #d2cafd;
    font-size: 13px;
    line-height: 1.7;
    margin: 22px 0 0;
  }
  .bit-label {
    color: #c7c9dc;
    font:
      12px ui-monospace,
      monospace;
    margin: 22px 0 10px;
  }
  .editable-bits > button {
    min-height: 50px;
  }
  .mux-table {
    margin-top: 28px;
  }
  .route-table td,
  .route-table th {
    padding-left: 8px;
    padding-right: 8px;
  }
  .unavailable {
    min-height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: #c4c8dd;
  }
  .unavailable > span {
    font-size: 40px;
  }
  .unavailable p {
    font-size: 14px;
    line-height: 1.7;
  }
  @media (max-width: 380px) {
    .bits {
      gap: 3px;
    }
    .bits > span,
    .bits > button {
      font-size: 14px;
    }
  }
</style>

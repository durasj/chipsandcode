<script lang="ts">
  import { onMount } from 'svelte';
  import '#lib/tools/lab.css';
  import {
    booleanFunctions,
    canonicalExpression,
    constructWithNand,
    evaluateFunction,
    evaluateNandConstruction,
    functionSignature,
    inputRows,
    nandHDL,
    toggleFunctionRow,
  } from '#lib/tools/logic.js';

  let ready = false;
  onMount(() => {
    ready = true;
  });
  let mask = 6;
  let a = false;
  let b = false;
  let comparison = 6;
  let copyState = '';
  $: output = evaluateFunction(mask, a, b);
  $: expression = canonicalExpression(mask);
  $: construction = constructWithNand(mask);
  $: source = nandHDL(construction);
  $: verified = inputRows.every(
    ([x, y]) => evaluateNandConstruction(construction, x, y) === evaluateFunction(mask, x, y),
  );
  $: differences = inputRows.filter(
    ([x, y]) => evaluateFunction(mask, x, y) !== evaluateFunction(comparison, x, y),
  );

  function choose(value: number) {
    mask = value;
    copyState = '';
  }
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(source);
      copyState = 'HDL copied.';
    } catch {
      copyState = 'Select the code below to copy it.';
    }
  }
</script>

<svelte:head>
  <title>Boolean functions · Tools · Chips and Code</title>
  <meta
    name="description"
    content="Explore every two-input Boolean function, derive its canonical expression, and build equivalent NAND-only HDL."
  />
</svelte:head>

<main class="logic-lab" data-ready={ready} aria-labelledby="functions-title">
  <a href="/tools" class="back-link"><span aria-hidden="true">←</span> Tools</a>
  <header class="tool-heading">
    <p class="eyebrow">Logic lab / 01</p>
    <h1 id="functions-title">Boolean functions</h1>
    <p class="tool-intro">
      Four answers define a two-input function. Change an answer and see the expression change with
      it.
    </p>
  </header>

  <div class="component-choice">
    <label
      >Function
      <select
        aria-label="Function"
        value={mask}
        on:change={(event) => choose(Number(event.currentTarget.value))}
      >
        {#each booleanFunctions as name, index}<option value={index}>{name}</option>{/each}
      </select>
    </label>
    <p class="small-note">{functionSignature(mask)} · {booleanFunctions[mask]}</p>
  </div>

  <div class="lab-grid">
    <section class="panel" aria-labelledby="table-heading">
      <h2 id="table-heading">Define the output</h2>
      <table>
        <caption>All four input combinations. Select an output to change it.</caption>
        <thead><tr><th scope="col">a</th><th scope="col">b</th><th scope="col">out</th></tr></thead>
        <tbody>
          {#each inputRows as [x, y], index}
            <tr class:active-row={a === x && b === y}>
              <td>{Number(x)}</td><td>{Number(y)}</td>
              <td
                ><button
                  class="signal-button table-output"
                  aria-label={`Output for a ${Number(x)} b ${Number(y)}: ${Number(evaluateFunction(mask, x, y))}`}
                  aria-pressed={evaluateFunction(mask, x, y)}
                  on:click={() => choose(toggleFunctionRow(mask, index))}
                  >{Number(evaluateFunction(mask, x, y))}</button
                ></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
      <p class="hint">Four independent 0-or-1 answers give 2⁴ = 16 possible functions.</p>
    </section>

    <div class="function-readout">
      <section class="panel" aria-labelledby="try-heading">
        <h2 id="try-heading">Try its inputs</h2>
        <div class="function-diagram">
          <div class="input-pair">
            <button
              class="signal-button"
              aria-label={`Input a ${Number(a)}`}
              aria-pressed={a}
              on:click={() => (a = !a)}><span>a</span>{' '}<strong>{Number(a)}</strong></button
            >
            <button
              class="signal-button"
              aria-label={`Input b ${Number(b)}`}
              aria-pressed={b}
              on:click={() => (b = !b)}><span>b</span>{' '}<strong>{Number(b)}</strong></button
            >
          </div>
          <svg viewBox="0 0 100 110" class="connecting-lines" aria-hidden="true"
            ><path d="M0 25H50V55H100M0 85H50V55" /></svg
          >
          <div class="output-column">
            <span>out</span><output
              class="live-output"
              class:high={output}
              data-testid="function-output"
              aria-live="polite"
              aria-label={`Function output ${Number(output)}`}>{Number(output)}</output
            >
          </div>
        </div>
        <p class="hint">The highlighted table row is the input you are testing.</p>
      </section>
      <section class="expression-block" aria-labelledby="expression-heading">
        <h2 id="expression-heading">The same function, as an expression</h2>
        <p class="hint">
          Take each row whose output is 1. AND its input values together, then OR those terms.
        </p>
        <p class="formula" data-testid="canonical-expression">f = {expression}</p>
      </section>
    </div>
  </div>

  <details>
    <summary>NAND construction</summary>
    <p>
      NOT, AND, and OR can each be built from NAND. Applying those transformations to this
      expression gives the construction below. It is systematic, not necessarily the smallest
      circuit.
    </p>
    <p class="verified" data-testid="nand-verification">
      {verified ? '4 of 4 input combinations match.' : 'Construction mismatch.'}
      {construction.gates.length} NAND gates.
    </p>
    <button class="text-button" on:click={copyCode}>Copy HDL</button>
    <span class="copy-message" role="status">{copyState}</span>
    <!-- This overflow region is keyboard-focusable so the code can be scrolled horizontally. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <pre tabindex="0" role="region" aria-label="Equivalent NAND HDL"><code>{source}</code></pre>
    <p>
      This is real single-bit HDL. Paste it into the <a href="/tools/hardware-simulator"
        >hardware simulator</a
      > to inspect or test it there.
    </p>
  </details>

  <details>
    <summary>Compare functions</summary>
    <p>Two functions are equivalent only if every input combination produces the same output.</p>
    <label class="comparison-choice"
      >Compare with
      <select aria-label="Compare with" bind:value={comparison}>
        {#each booleanFunctions as name, index}<option value={index}>{name}</option>{/each}
      </select>
    </label>
    <p
      aria-live="polite"
      data-testid="equivalence-result"
      class="equivalence-result"
      class:verified={differences.length === 0}
    >
      {#if differences.length === 0}Equivalent: all 4 input combinations match.
      {:else}{differences.length} of 4 input combinations differ: {differences
          .map(([x, y]) => `a=${Number(x)}, b=${Number(y)}`)
          .join('; ')}.{/if}
    </p>
  </details>

  <div class="more-reading">
    <a href="/learn/reference/boolean-logic/background#canonical-representation"
      >Read the full explanation ↗</a
    >
    <a href="/learn/reference/boolean-logic/background#universality"
      >Why NAND can build any function ↗</a
    >
  </div>
</main>

<style>
  .table-output {
    justify-content: center;
    min-width: 56px;
    min-height: 42px;
    padding: 6px 12px;
  }
  .function-diagram {
    display: grid;
    grid-template-columns: 86px minmax(40px, 1fr) 62px;
    align-items: center;
    margin: 26px 0 20px;
  }
  .input-pair {
    display: grid;
    gap: 16px;
  }
  .connecting-lines {
    width: 100%;
    height: 110px;
  }
  .connecting-lines path {
    fill: none;
    stroke: #929bb7;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }
  .output-column {
    position: relative;
  }
  .output-column > span {
    position: absolute;
    top: -25px;
    left: 0;
    width: 58px;
    text-align: center;
    color: #c7c9dc;
    font:
      12px ui-monospace,
      monospace;
  }
  .expression-block {
    padding: 26px 0 0;
  }
  .comparison-choice {
    max-width: 320px;
    margin-top: 18px;
  }
  .copy-message {
    font-size: 13px;
    margin-left: 16px;
    color: #c7c9dc;
  }
</style>

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { createCircuit, simulateCircuit } from './circuit';
  import { getMission } from './missions';

  export let oncomplete: () => void;
  export let onclose: () => void;

  const mission = getMission('nand');
  const circuit = createCircuit(mission);
  // One switch changes between cases, so the learner can follow its effect.
  const cases = [
    { a: false, b: false },
    { a: false, b: true },
    { a: true, b: true },
    { a: true, b: false },
  ];
  let inputs = { a: false, b: false };
  let step = 0;
  let confirmed = false;
  let feedback = '';
  let heading: HTMLHeadingElement;
  let nextButton: HTMLButtonElement;

  $: output = simulateCircuit(mission, circuit, inputs).outputs.out;
  $: target = cases[step];
  $: atTarget = inputs.a === target.a && inputs.b === target.b;
  $: finished = step === cases.length - 1 && confirmed;
  $: instruction = confirmed
    ? finished
      ? 'You have checked every input combination.'
      : 'That combination is checked.'
    : inputs.a !== target.a
      ? `Set input a to ${Number(target.a)}.`
      : inputs.b !== target.b
        ? `Set input b to ${Number(target.b)}.`
        : 'Read the output. What value comes out?';

  onMount(() => heading?.focus());

  function toggle(pin: 'a' | 'b') {
    if (confirmed) return;
    inputs = { ...inputs, [pin]: !inputs[pin] };
    feedback = '';
  }

  async function answer(value: boolean) {
    if (confirmed || !atTarget) return;
    if (value !== output) {
      feedback = `The output is ${Number(output)}. Follow the line on the right and try again.`;
      return;
    }
    confirmed = true;
    feedback = `With a at ${Number(target.a)} and b at ${Number(target.b)}, the output is ${Number(output)}.`;
    await tick();
    nextButton?.focus({ preventScroll: true });
  }

  async function advance() {
    if (!confirmed) return;
    if (finished) {
      oncomplete();
      return;
    }
    step += 1;
    confirmed = false;
    feedback = '';
    await tick();
    const nextPin = inputs.a !== cases[step].a ? 'a' : 'b';
    document.getElementById(`nand-input-${nextPin}`)?.focus({ preventScroll: true });
  }
</script>

<section class="nand-discovery" aria-label="Discover NAND">
  <button class="back-link" on:click={onclose}><span aria-hidden="true">←</span> Back</button>
  <header>
    <p class="step-label">SIGNALS & LOGIC</p>
    <h1 bind:this={heading} tabindex="-1">Two signals. One rule.</h1>
    <p class="introduction">
      A gate gives an answer from two inputs. This one is called <strong>NAND</strong>.
    </p>
  </header>

  <div
    class="nand-circuit"
    role="group"
    aria-label="A NAND gate with inputs a and b and output out"
  >
    <div class="input-column">
      {#each ['a', 'b'] as pin}
        <button
          id={`nand-input-${pin}`}
          class="signal-switch"
          class:on={inputs[pin as 'a' | 'b']}
          aria-label={`Input ${pin} ${Number(inputs[pin as 'a' | 'b'])}`}
          aria-pressed={inputs[pin as 'a' | 'b']}
          disabled={confirmed}
          on:click={() => toggle(pin as 'a' | 'b')}
        >
          <span>{pin}</span>{' '}<strong>{Number(inputs[pin as 'a' | 'b'])}</strong>
        </button>
      {/each}
    </div>
    <svg viewBox="0 0 320 200" aria-hidden="true" class="gate-diagram">
      <path d="M0 50H100" class="wire" class:high={inputs.a} />
      <path d="M0 150H100" class="wire" class:high={inputs.b} />
      <path d="M100 25H150A75 75 0 0 1 150 175H100Z" class="gate-body" />
      <circle cx="233" cy="100" r="8" class="gate-body" />
      <path d="M241 100H320" class="wire" class:high={output} />
      <text x="156" y="107" text-anchor="middle">NAND</text>
    </svg>
    <output class="signal-output" class:on={output} aria-label={`NAND output ${Number(output)}`}>
      <span>out</span><strong>{Number(output)}</strong>
    </output>
  </div>

  <div class="experiment-step">
    <span class="case-count">{Math.min(step + 1, cases.length)} of {cases.length}</span>
    <p class="instruction" aria-live="polite">{instruction}</p>
    {#if confirmed}
      <p class="feedback" aria-live="polite">{feedback}</p>
      {#if finished}
        <p class="takeaway">NAND outputs 0 only when both inputs are 1.</p>
      {/if}
      <button class="continue-button" bind:this={nextButton} on:click={advance}
        >{finished ? 'Continue' : 'Next combination'}
        <span aria-hidden="true">→</span></button
      >
    {:else}
      <div class="answer-buttons" role="group" aria-label="Read the NAND output">
        <button disabled={!atTarget} on:click={() => answer(false)}>Output 0</button>
        <button disabled={!atTarget} on:click={() => answer(true)}>Output 1</button>
      </div>
      <p class="feedback" aria-live="polite">{feedback}</p>
    {/if}
  </div>

  {#if finished}
    <details class="code-note">
      <summary>See its code</summary>
      <p>NAND is supplied by the simulator. Next, you will use it to build your own circuits.</p>
      <pre><code
          >CHIP Nand &#123;
    IN a, b;
    OUT out;
    BUILTIN Nand;
&#125;</code
        ></pre>
    </details>
  {/if}
</section>

<style>
  .nand-discovery {
    max-width: 840px;
    margin: 0 auto;
    padding: 16px 32px 72px;
    color: #eeedf6;
  }
  button {
    font: inherit;
    cursor: pointer;
  }
  button:focus-visible,
  summary:focus-visible {
    outline: 2px solid #b7adff !important;
    outline-offset: 5px;
  }
  .back-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    gap: 10px;
    padding: 0;
    color: #b0b2c3;
    font-size: 13px;
  }
  header {
    margin-top: 24px;
  }
  .step-label,
  .case-count {
    margin: 0 0 12px;
    font:
      11px/1.5 ui-monospace,
      SFMono-Regular,
      monospace;
    letter-spacing: 0.08em;
    color: #a5a3bd;
  }
  h1 {
    margin: 0;
    font-size: clamp(30px, 4vw, 44px);
    line-height: 1.12;
    letter-spacing: -0.045em;
    font-weight: 500;
  }
  h1:focus {
    outline: none;
  }
  .introduction {
    max-width: 520px;
    color: #b2b2c4;
    font-size: 15px;
    line-height: 1.7;
    margin: 17px 0 0;
  }
  .introduction strong {
    color: #e1dcff;
    font-weight: 500;
  }
  .nand-circuit {
    display: grid;
    grid-template-columns: 68px minmax(0, 1fr) 68px;
    align-items: center;
    max-width: 520px;
    margin: 18px auto;
  }
  .input-column {
    display: grid;
    grid-template-rows: 1fr 1fr;
    align-items: center;
    align-self: stretch;
  }
  .signal-switch,
  .signal-output {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 68px;
    min-height: 48px;
    padding: 11px 12px;
    border: 1px solid #505166;
    border-radius: 5px;
    background: #141621;
    color: #c5c5d6;
    font-family: ui-monospace, SFMono-Regular, monospace;
  }
  .signal-switch span,
  .signal-output span {
    font-size: 12px;
  }
  .signal-switch strong,
  .signal-output strong {
    font-size: 21px;
    font-weight: 500;
  }
  .signal-switch.on,
  .signal-output.on {
    border-color: #aaa0f3;
    color: #ede8ff;
    background: #2b2548;
  }
  .signal-switch:hover:not(:disabled) {
    border-color: #c2baff;
  }
  .signal-switch:disabled {
    cursor: default;
  }
  .gate-diagram {
    display: block;
    width: 100%;
    overflow: visible;
  }
  .wire {
    fill: none;
    stroke: #626177;
    stroke-width: 1.5;
  }
  .wire.high {
    stroke: #b0a6ff;
  }
  .gate-body {
    fill: #10121d;
    stroke: #9c92d1;
    stroke-width: 1.4;
  }
  .gate-diagram text {
    fill: #ded7ff;
    font:
      18px ui-monospace,
      SFMono-Regular,
      monospace;
  }
  .experiment-step {
    padding-top: 23px;
    border-top: 1px solid #2c2c3d;
  }
  .case-count {
    letter-spacing: 0;
  }
  .instruction {
    margin: 6px 0 17px;
    font-size: 17px;
    line-height: 1.5;
  }
  .answer-buttons {
    display: flex;
    gap: 10px;
  }
  .answer-buttons button {
    min-width: 110px;
    min-height: 46px;
    padding: 11px 18px;
    border: 1px solid #58506f;
    border-radius: 4px;
    background: #1b182a;
    color: #e5dfff;
    font-size: 14px;
  }
  .answer-buttons button:hover:not(:disabled) {
    border-color: #b7adff;
    background: #2c2545;
  }
  .answer-buttons button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .feedback {
    min-height: 22px;
    margin: 12px 0 0;
    color: #c0b9da;
    font-size: 13px;
    line-height: 1.7;
  }
  .takeaway {
    color: #e0daff;
    font-size: 16px;
    line-height: 1.6;
    margin: 16px 0;
  }
  .continue-button {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 25px;
    min-height: 46px;
    padding: 12px 16px;
    margin-top: 15px;
    border: 1px solid #7367eb;
    border-radius: 4px;
    background: #4f46e5;
    color: white;
    font-size: 13px;
    font-weight: 500;
  }
  .continue-button:hover {
    background: #6055e9;
  }
  .code-note {
    margin-top: 28px;
    font-size: 13px;
    color: #b4b2c8;
  }
  .code-note summary {
    width: fit-content;
    min-height: 44px;
    cursor: pointer;
    padding: 11px 0;
  }
  .code-note p {
    max-width: 540px;
    line-height: 1.7;
  }
  pre {
    padding: 18px;
    margin-top: 15px;
    border: 1px solid #303044;
    border-radius: 4px;
    color: #d9d3f2;
    font-size: 13px;
    line-height: 1.7;
    overflow: auto;
  }
  @media (max-width: 520px) {
    .nand-discovery {
      padding: 14px 20px 48px;
    }
    header {
      margin-top: 21px;
    }
    .introduction {
      font-size: 14px;
    }
    .nand-circuit {
      grid-template-columns: 58px minmax(0, 1fr) 58px;
      margin: 28px 0;
    }
    .signal-switch,
    .signal-output {
      width: 58px;
      padding: 10px 8px;
    }
    .gate-diagram text {
      font-size: 24px;
    }
    .input-column {
      padding: 0;
    }
    .continue-button {
      max-width: 100%;
    }
  }
</style>

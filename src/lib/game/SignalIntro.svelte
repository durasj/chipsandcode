<script lang="ts">
  import { tick } from 'svelte';
  import NotChip from '#lib/hardware-simulator/chips/builtin/NotChip.js';
  import AndChip from '#lib/hardware-simulator/chips/builtin/AndChip.js';

  export let oncomplete: () => void;
  export let onclose: () => void;

  type Stage = 'signal' | 'not' | 'and';
  let stage: Stage = 'signal';
  let signal = false;
  let observation = 0;
  let a = false;
  let b = false;
  let andObservation = 0;
  let heading: HTMLHeadingElement;
  const inverter = new NotChip();
  const conjunction = new AndChip();
  // Each step changes one input. The initial 00 is already visible.
  const andTargets = [
    { a: true, b: false },
    { a: true, b: true },
    { a: false, b: true },
    { a: false, b: false },
  ];
  const titles: Record<Stage, string> = {
    signal: 'A computer starts with a signal.',
    not: 'First, flip a signal.',
    and: 'Now, combine two signals.',
  };

  function invert(value: boolean) {
    inverter.setInput('in', value);
    inverter.run();
    return inverter.getOutput('out');
  }

  function combine(first: boolean, second: boolean) {
    conjunction.setInput('a', first);
    conjunction.setInput('b', second);
    conjunction.run();
    return conjunction.getOutput('out');
  }

  $: result = stage === 'signal' ? signal : stage === 'not' ? invert(signal) : combine(a, b);
  $: explored = stage === 'and' ? andObservation === andTargets.length : observation === 2;
  $: target = andTargets[Math.min(andObservation, andTargets.length - 1)];
  $: andInstruction = explored
    ? 'Only two 1s together produce a 1.'
    : a !== target.a
      ? `Set input a to ${Number(target.a)}.`
      : `Set input b to ${Number(target.b)}.`;

  function toggleSignal() {
    signal = !signal;
    if (observation === 0 && signal) observation = 1;
    else if (observation === 1 && !signal) observation = 2;
  }

  function toggleAnd(pin: 'a' | 'b') {
    if (pin === 'a') a = !a;
    else b = !b;
    const expected = andTargets[andObservation];
    if (expected && a === expected.a && b === expected.b) andObservation += 1;
  }

  async function continueLearning() {
    if (!explored) return;
    if (stage === 'and') {
      oncomplete();
      return;
    }
    stage = stage === 'signal' ? 'not' : 'and';
    signal = false;
    observation = 0;
    await tick();
    heading?.focus({ preventScroll: true });
  }
</script>

<section class="signal-intro" aria-labelledby="signal-intro-title" data-foundation={stage}>
  <button class="back-link" onclick={onclose}><span aria-hidden="true">←</span> Back</button>

  <div class="intro-content">
    <h1 id="signal-intro-title" bind:this={heading} tabindex="-1">{titles[stage]}</h1>
    <p class="introduction">
      {#if stage === 'signal'}
        A digital signal carries one of two values: <span>0</span> or <span>1</span>.
      {:else if stage === 'not'}
        A <strong>NOT</strong> gate gives the opposite value.
      {:else}
        <strong>AND</strong> gives <span>1</span> only when both inputs are <span>1</span>.
      {/if}
    </p>

    {#if stage === 'signal'}
      <div class="signal-line" class:signal-on={signal}>
        <div class="signal-control">
          <span class="terminal-label" id="signal-label">Signal</span>
          <button
            class="signal-switch"
            type="button"
            role="switch"
            aria-labelledby="signal-label"
            aria-checked={signal}
            aria-describedby="signal-guidance"
            onclick={toggleSignal}
          >
            <span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span>
            <span class="signal-value" aria-hidden="true">{Number(signal)}</span>
          </button>
        </div>
        <div class="signal-wire" aria-hidden="true"><span></span></div>
        <div class="signal-output">
          <span class="terminal-label">Output</span>
          <div class="output-light" role="img" aria-label={`Output ${Number(result)}`}>
            <span aria-hidden="true">{Number(result)}</span>
          </div>
        </div>
      </div>
    {:else}
      <div class="gate-circuit" class:two-inputs={stage === 'and'}>
        <div class="gate-inputs">
          {#if stage === 'not'}
            <button
              class="gate-input"
              class:high={signal}
              type="button"
              role="switch"
              aria-label="NOT input"
              aria-checked={signal}
              aria-describedby="signal-guidance"
              onclick={toggleSignal}><span>in</span><strong>{Number(signal)}</strong></button
            >
          {:else}
            {#each ['a', 'b'] as pin}
              <button
                class="gate-input"
                class:high={pin === 'a' ? a : b}
                type="button"
                role="switch"
                aria-label={`AND input ${pin}`}
                aria-checked={pin === 'a' ? a : b}
                aria-describedby="signal-guidance"
                onclick={() => toggleAnd(pin as 'a' | 'b')}
                ><span>{pin}</span><strong>{Number(pin === 'a' ? a : b)}</strong></button
              >
            {/each}
          {/if}
        </div>
        <svg viewBox="0 0 240 160" aria-hidden="true" class="gate-diagram">
          {#if stage === 'not'}
            <path d="M0 80H70" class="wire" class:high={signal} />
            <path d="M70 24L166 80L70 136Z" class="gate-body" />
            <circle cx="176" cy="80" r="10" class="gate-body" />
            <path d="M186 80H240" class="wire" class:high={result} />
            <text x="105" y="86">NOT</text>
          {:else}
            <path d="M0 40H60" class="wire" class:high={a} />
            <path d="M0 120H60" class="wire" class:high={b} />
            <path d="M60 12H120A68 68 0 0 1 120 148H60Z" class="gate-body" />
            <path d="M188 80H240" class="wire" class:high={result} />
            <text x="118" y="86">AND</text>
          {/if}
        </svg>
        <div
          class="gate-output"
          class:high={result}
          role="img"
          aria-label={`Output ${Number(result)}`}
        >
          <span>out</span><strong>{Number(result)}</strong>
        </div>
      </div>
    {/if}

    <div class="guidance" id="signal-guidance" aria-live="polite" aria-atomic="true">
      {#if stage === 'signal'}
        {#if observation === 0}
          <p>Set the signal to <strong>1</strong>.</p>
        {:else if observation === 1}
          <p>The output follows: <strong>1</strong>.</p>
          <p class="next-action">Set the signal back to 0.</p>
        {:else}
          <p>Same signal in. Same signal out.</p>
          <p class="next-action">Now let’s change what comes out.</p>
        {/if}
      {:else if stage === 'not'}
        <p><strong>{Number(signal)}</strong> in. <strong>{Number(result)}</strong> out.</p>
        <p class="next-action">
          {observation === 0
            ? 'Set the input to 1. Watch the output.'
            : observation === 1
              ? 'Now set the input back to 0.'
              : 'NOT flips a signal. Now try a gate with two inputs.'}
        </p>
      {:else}
        <p>
          <strong>{Number(a)}</strong> AND <strong>{Number(b)}</strong> gives
          <strong>{Number(result)}</strong>.
        </p>
        <p class="next-action">{andInstruction}</p>
      {/if}
    </div>

    {#if explored}
      <button class="continue-button" onclick={continueLearning}
        >Continue <span aria-hidden="true">→</span></button
      >
    {/if}
  </div>
</section>

<style>
  .signal-intro {
    width: min(100%, 1060px);
    margin: 0 auto;
    padding: 24px 5% 56px;
    color: #f5f4fc;
  }
  button {
    font: inherit;
    cursor: pointer;
    touch-action: manipulation;
  }
  button:focus-visible {
    outline: 2px solid #c1b7ff !important;
    outline-offset: 5px;
  }
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 0;
    color: #bcc0d2;
    font-size: 13px;
  }
  .back-link:hover {
    color: #fff;
  }
  .intro-content {
    max-width: 700px;
    margin: 24px auto 0;
    text-align: center;
  }
  h1 {
    max-width: 650px;
    margin: 0 auto;
    font-size: clamp(30px, 4.2vw, 48px);
    font-weight: 500;
    line-height: 1.12;
    letter-spacing: -0.045em;
  }
  h1:focus {
    outline: none;
  }
  .introduction {
    max-width: 560px;
    margin: 20px auto 0;
    color: #bcc0d2;
    font-size: 16px;
    line-height: 1.6;
  }
  .introduction span,
  .introduction strong {
    color: #e3ddff;
    font-weight: 500;
  }
  .signal-line {
    display: grid;
    grid-template-columns: 144px minmax(24px, 1fr) 72px;
    align-items: end;
    max-width: 540px;
    margin: 44px auto 32px;
    padding: 0 12px;
    --trace: #8289a3;
  }
  .signal-line.signal-on {
    --trace: #b7aaff;
  }
  .signal-control,
  .signal-output {
    display: grid;
    justify-items: center;
    gap: 18px;
  }
  .terminal-label {
    color: #bcc0d2;
    font-size: 12px;
    line-height: 1.5;
  }
  .signal-switch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    width: 144px;
    height: 72px;
    padding: 0 16px;
    border: 1px solid #8289a3;
    border-radius: 5px;
    background: #131621;
    color: #d1d4e4;
  }
  .signal-switch:hover {
    border-color: #c1b7ff;
  }
  .switch-track {
    display: flex;
    align-items: center;
    width: 48px;
    height: 26px;
    border-radius: 20px;
    background: #535a71;
    padding: 4px;
    transition: background 180ms;
  }
  .switch-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #f1f1fa;
    transform: translateX(0);
    transition: transform 180ms;
  }
  .signal-on .switch-track {
    background: #4f46e5;
  }
  .signal-on .switch-thumb {
    transform: translateX(22px);
  }
  .signal-value {
    font:
      24px/1 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .signal-on .signal-switch {
    color: #f4f0ff;
    border-color: #b7aaff;
  }
  .signal-wire {
    display: flex;
    align-items: center;
    height: 72px;
  }
  .signal-wire > span {
    position: relative;
    width: 100%;
    height: 2px;
    background: var(--trace);
    transition: background 180ms;
  }
  .signal-wire > span::after {
    content: '';
    position: absolute;
    right: 28px;
    top: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--trace);
  }
  .output-light {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border: 2px solid var(--trace);
    border-radius: 50%;
    color: #d1d4e4;
    background: #10131d;
    font:
      30px/1 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    transition:
      border-color 180ms,
      background 180ms;
  }
  .signal-on .output-light {
    color: #fff;
    background: #4f46e5;
  }
  .gate-circuit {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr) 76px;
    align-items: center;
    max-width: 510px;
    margin: 38px auto 28px;
  }
  .gate-inputs {
    display: grid;
    height: 100%;
    align-items: center;
  }
  .two-inputs .gate-inputs {
    grid-template-rows: 1fr 1fr;
  }
  .gate-input,
  .gate-output {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 54px;
    padding: 11px 12px;
    border: 1px solid #8289a3;
    border-radius: 4px;
    background: #131621;
    color: #d1d4e4;
    font-family: ui-monospace, SFMono-Regular, monospace;
  }
  .gate-input span,
  .gate-output span {
    font-size: 12px;
  }
  .gate-input strong,
  .gate-output strong {
    font-size: 24px;
    font-weight: 500;
  }
  .gate-input.high,
  .gate-output.high {
    background: #2b2548;
    border-color: #b7aaff;
    color: #f4f0ff;
  }
  .gate-input:hover {
    border-color: #c1b7ff;
  }
  .gate-diagram {
    display: block;
    width: 100%;
  }
  .wire {
    fill: none;
    stroke: #8289a3;
    stroke-width: 1.6;
  }
  .wire.high {
    stroke: #b7aaff;
    stroke-width: 2;
  }
  .gate-body {
    fill: #131621;
    stroke: #b7aaff;
    stroke-width: 1.5;
  }
  .gate-diagram text {
    fill: #f4f0ff;
    font:
      17px ui-monospace,
      SFMono-Regular,
      monospace;
    text-anchor: middle;
  }
  .guidance {
    min-height: 58px;
    margin: 0 auto;
    font-size: 16px;
    line-height: 1.6;
  }
  .guidance p {
    margin: 0;
  }
  .guidance strong {
    font-weight: 500;
    color: #e3ddff;
  }
  .guidance .next-action {
    margin-top: 6px;
    font-size: 14px;
    color: #bcc0d2;
  }
  .continue-button {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
    min-height: 46px;
    margin-top: 24px;
    padding: 12px 18px;
    border: 1px solid #9a90ff;
    border-radius: 4px;
    background: #4f46e5;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
  }
  .continue-button:hover {
    background: #5b50dc;
  }
  @media (max-width: 520px) {
    .signal-intro {
      padding: 14px 6% 36px;
    }
    .intro-content {
      margin-top: 22px;
    }
    .introduction {
      font-size: 14px;
    }
    .signal-line {
      grid-template-columns: 116px minmax(20px, 1fr) 64px;
      margin-top: 34px;
      padding: 0;
    }
    .signal-switch {
      width: 116px;
      height: 64px;
      gap: 12px;
      padding: 0 10px;
    }
    .signal-wire {
      height: 64px;
    }
    .signal-wire > span::after {
      right: 12px;
    }
    .output-light {
      width: 64px;
      height: 64px;
    }
    .gate-circuit {
      grid-template-columns: 64px minmax(0, 1fr) 64px;
      margin-top: 32px;
    }
    .gate-input,
    .gate-output {
      min-height: 48px;
      padding: 9px 8px;
    }
    .gate-input strong,
    .gate-output strong {
      font-size: 21px;
    }
    .gate-diagram text {
      font-size: 24px;
    }
    .guidance {
      font-size: 15px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .switch-track,
    .switch-thumb,
    .signal-wire > span,
    .output-light {
      transition: none;
    }
  }
</style>

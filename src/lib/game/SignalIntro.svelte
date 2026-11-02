<script lang="ts">
  export let oncomplete: () => void;
  export let onclose: () => void;

  let signal = false;
  let step: 0 | 1 | 2 = 0;

  function toggleSignal() {
    signal = !signal;
    if (step === 0 && signal) step = 1;
    else if (step === 1 && !signal) step = 2;
  }

  function continueLearning() {
    if (step === 2) oncomplete();
  }
</script>

<section class="signal-intro" aria-labelledby="signal-intro-title">
  <button class="back-link" onclick={onclose}><span aria-hidden="true">←</span> Back</button>

  <div class="intro-content">
    <h1 id="signal-intro-title" tabindex="-1">A computer starts with a signal.</h1>
    <p class="introduction">A signal has two states: <span>0</span> and <span>1</span>.</p>

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
        <div class="output-light" role="img" aria-label={`Output ${Number(signal)}`}>
          <span aria-hidden="true">{Number(signal)}</span>
        </div>
      </div>
    </div>

    <div class="guidance" id="signal-guidance" aria-live="polite" aria-atomic="true">
      {#if step === 0}
        <p>Turn the signal on.</p>
      {:else if step === 1}
        <p><strong>1.</strong> The signal is on.</p>
        <p class="next-action">Turn it off again.</p>
      {:else}
        <p><strong>{Number(signal)}.</strong> The signal is {signal ? 'on' : 'off'}.</p>
        <p class="next-action">Now combine two signals to make a decision.</p>
      {/if}
    </div>

    {#if step === 2}
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
    color: #eeedf7;
  }
  button {
    font: inherit;
    cursor: pointer;
    touch-action: manipulation;
  }
  button:focus-visible {
    outline: 2px solid #b6adff !important;
    outline-offset: 5px;
  }
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 0;
    color: #a9adbf;
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
    margin: 20px 0 0;
    color: #a9adbf;
    font-size: 16px;
    line-height: 1.6;
  }
  .introduction span {
    color: #ded9ff;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  .signal-line {
    display: grid;
    grid-template-columns: 144px minmax(24px, 1fr) 72px;
    align-items: end;
    max-width: 540px;
    margin: 44px auto 32px;
    padding: 0 12px;
    --trace: #717790;
  }
  .signal-line.signal-on {
    --trace: #a69aff;
  }
  .signal-control,
  .signal-output {
    display: grid;
    justify-items: center;
    gap: 18px;
  }
  .terminal-label {
    color: #a9adbf;
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
    border: 1px solid #717790;
    border-radius: 5px;
    background: #131621;
    color: #c8cbdb;
  }
  .signal-switch:hover {
    border-color: #aaa0ef;
  }
  .switch-track {
    display: flex;
    align-items: center;
    width: 48px;
    height: 26px;
    border-radius: 20px;
    background: #393d50;
    padding: 4px;
    transition: background 180ms;
  }
  .switch-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #d6d6e5;
    transform: translateX(0);
    transition: transform 180ms;
  }
  .signal-on .switch-track {
    background: #4f46e5;
  }
  .signal-on .switch-thumb {
    background: #fff;
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
    color: #e5e0ff;
    border-color: #9c91e9;
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
    transition: background 180ms;
  }
  .output-light {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border: 2px solid var(--trace);
    border-radius: 50%;
    color: #b0b5c9;
    background: #10131d;
    font:
      30px/1 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    transition:
      border-color 180ms,
      background 180ms,
      color 180ms,
      box-shadow 180ms;
  }
  .signal-on .output-light {
    color: #fff;
    background: #4f46e5;
    box-shadow: 0 0 36px #6559e932;
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
    color: #d4ccff;
  }
  .guidance .next-action {
    margin-top: 6px;
    font-size: 14px;
    color: #a9adbf;
  }
  .continue-button {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
    min-height: 46px;
    margin-top: 24px;
    padding: 12px 18px;
    border: 1px solid #786df7;
    border-radius: 4px;
    background: #4f46e5;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
  }
  .continue-button:hover {
    background: #5e54ed;
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
    .guidance {
      font-size: 15px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .switch-track,
    .switch-thumb,
    .signal-wire > span,
    .signal-wire > span::after,
    .output-light {
      transition: none;
    }
  }
</style>

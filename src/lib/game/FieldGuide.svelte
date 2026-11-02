<script lang="ts">
  export let onclose: () => void;

  type Gate = 'NAND' | 'NOT' | 'AND' | 'OR' | 'XOR';
  const chapters = [
    { id: 'signals', number: '01', title: 'Signals & gates' },
    { id: 'expressions', number: '02', title: 'Reading the logic' },
    { id: 'blueprints', number: '03', title: 'Inside a chip' },
    { id: 'scale', number: '04', title: 'Thinking bigger' },
    { id: 'origins', number: '05', title: 'Further reading' },
  ];
  let chapter = 'signals';
  let gate: Gate = 'NAND';
  let a = false;
  let b = false;
  let c = false;
  let bus = [true, false, true, true, false, false, true, false];
  let selector = 0;
  const words = ['1010', '0110', '1100', '0001'];
  const gates: Gate[] = ['NAND', 'NOT', 'AND', 'OR', 'XOR'];
  const descriptions: Record<Gate, string> = {
    NAND: 'Outputs 0 only when both inputs are 1. This is your supplied primitive: every gate in the logic layer can be built from copies of it.',
    NOT: 'Inverts one input. A 0 becomes 1; a 1 becomes 0. Also called an inverter.',
    AND: 'Outputs 1 only when both inputs are 1. Think of a machine that needs two safety switches.',
    OR: 'Outputs 1 when at least one input is 1. Both inputs being 1 still produces 1.',
    XOR: 'Outputs 1 when the inputs differ. Exactly one input must be 1.',
  };
  function evaluate(kind: Gate, x: boolean, y: boolean) {
    if (kind === 'NOT') return !x;
    if (kind === 'AND') return x && y;
    if (kind === 'OR') return x || y;
    if (kind === 'XOR') return x !== y;
    return !(x && y);
  }
  const binaryRows = [
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ];
  $: rows =
    gate === 'NOT'
      ? [
          [false, false],
          [true, false],
        ]
      : binaryRows;
  $: result = evaluate(gate, a, b);
  $: expressionResult = (a || b) && !c;
  $: terms = [!a && b && !c, a && !b && !c, a && b && !c];
  const notHDL = `CHIP Not {
    IN in;
    OUT out;

    PARTS:
    Nand(a=in, b=in, out=out);
}`;
</script>

<section class="field-guide" aria-label="Logic reference">
  <header class="guide-header">
    <div class="guide-mark" aria-hidden="true">01</div>
    <div class="guide-heading">
      <p class="eyebrow">CHIPS AND CODE / REFERENCE</p>
      <h1>Under the surface.</h1>
    </div>
    <button type="button" class="back-button" onclick={onclose}>← Back to layers</button>
  </header>

  <div class="notebook">
    <nav class="chapter-nav" aria-label="Reference chapters">
      <span class="nav-caption">LAYER 00 / LOGIC</span>
      {#each chapters as item}
        <button
          type="button"
          class:current={chapter === item.id}
          aria-current={chapter === item.id ? 'page' : undefined}
          onclick={() => (chapter = item.id)}
          ><span>{item.number}</span>{item.title}<span class="chapter-arrow" aria-hidden="true"
            >↗</span
          ></button
        >
      {/each}
      <p class="margin-note">
        Inspect the behavior.<br />Understand the model.<br />Return to your design.
      </p>
    </nav>

    <div class="paper">
      {#if chapter === 'signals'}
        <p class="eyebrow">01 / BOOLEAN SIGNALS</p>
        <h2>Two states.<br />Every possibility.</h2>
        <p class="intro">
          A Boolean signal has two values: <strong>0</strong> and <strong>1</strong>. Gates
          transform those signals. Flip an input and follow what changes.
        </p>

        <div class="gate-picker" aria-label="Choose a gate">
          {#each gates as kind}
            <button
              type="button"
              class:chosen={gate === kind}
              aria-pressed={gate === kind}
              onclick={() => (gate = kind)}>{kind}</button
            >
          {/each}
        </div>

        <div class="experiment">
          <div class="input-stack">
            <button
              type="button"
              class="signal-toggle"
              class:high={a}
              aria-pressed={a}
              onclick={() => (a = !a)}
              ><span>{gate === 'NOT' ? 'in' : 'A'}</span><b>{Number(a)}</b><small>toggle</small
              ></button
            >
            {#if gate !== 'NOT'}
              <button
                type="button"
                class="signal-toggle"
                class:high={b}
                aria-pressed={b}
                onclick={() => (b = !b)}
                ><span>B</span><b>{Number(b)}</b><small>toggle</small></button
              >
            {/if}
          </div>
          <span class="wire" class:live={a || (gate !== 'NOT' && b)} aria-hidden="true"></span>
          <div class="gate-body">
            <small>logic gate</small><strong>{gate}</strong><span>IN → OUT</span>
          </div>
          <span class="wire" class:live={result} aria-hidden="true"></span>
          <div class="signal-output" class:high={result} aria-live="polite">
            <span>OUT</span><b>{Number(result)}</b><small
              >{result ? 'signal on' : 'signal off'}</small
            >
          </div>
        </div>
        <p class="experiment-caption">{descriptions[gate]}</p>

        <div class="two-columns">
          <div>
            <h3>The complete contract.</h3>
            <p>
              A truth table lists every possible input and its output. The highlighted row is the
              state you're exploring. For a two-input gate there are four cases; for a three-input
              gate there are eight.
            </p>
            <p class="pencil-note">
              The glow is a visual guide to 0 and 1, not a physical electricity simulation.
            </p>
          </div>
          <table class="truth-table">
            <caption>{gate} truth table</caption>
            <thead
              ><tr
                ><th scope="col">{gate === 'NOT' ? 'in' : 'A'}</th>{#if gate !== 'NOT'}<th
                    scope="col">B</th
                  >{/if}<th scope="col">OUT</th></tr
              ></thead
            >
            <tbody
              >{#each rows as [x, y]}<tr class:active-row={a === x && (gate === 'NOT' || b === y)}
                  ><td>{Number(x)}</td>{#if gate !== 'NOT'}<td>{Number(y)}</td>{/if}<td
                    ><strong>{Number(evaluate(gate, x, y))}</strong></td
                  ></tr
                >{/each}</tbody
            >
          </table>
        </div>
      {:else if chapter === 'expressions'}
        <p class="eyebrow">02 / BOOLEAN EXPRESSIONS</p>
        <h2>Same function.<br />Different representations.</h2>
        <p class="intro">
          “A or B is on, and C is off.” That is a complete specification. We can write it as an
          expression, draw connected gates, or list its truth table.
        </p>
        <div class="formula">f = (a OR b) AND NOT c</div>
        <div class="expression-controls">
          <button
            type="button"
            class="signal-toggle"
            class:high={a}
            aria-pressed={a}
            onclick={() => (a = !a)}><span>a</span><b>{Number(a)}</b><small>toggle</small></button
          >
          <button
            type="button"
            class="signal-toggle"
            class:high={b}
            aria-pressed={b}
            onclick={() => (b = !b)}><span>b</span><b>{Number(b)}</b><small>toggle</small></button
          >
          <button
            type="button"
            class="signal-toggle"
            class:high={c}
            aria-pressed={c}
            onclick={() => (c = !c)}><span>c</span><b>{Number(c)}</b><small>toggle</small></button
          >
          <div class="signal-output" class:high={expressionResult} aria-live="polite">
            <span>f</span><b>{Number(expressionResult)}</b><small>output</small>
          </div>
        </div>
        <div class="trace-strip" aria-live="polite">
          <span>a OR b <b>{Number(a || b)}</b></span><span>NOT c <b>{Number(!c)}</b></span><span
            >both true? <b>{Number(expressionResult)}</b></span
          >
        </div>
        <h3>Build it from the rows that output 1.</h3>
        <p>
          There are three such rows. For each, AND together the inputs that describe it, using NOT
          for a 0. Then OR those terms together. This is a <strong>canonical sum of products</strong
          >.
        </p>
        <div class="canonical" aria-label="Canonical sum of products">
          {#each ['(NOT a AND b AND NOT c)', '(a AND NOT b AND NOT c)', '(a AND b AND NOT c)'] as term, i}
            {#if i > 0}<span class="or-word">OR</span>{/if}
            <div class:term-on={terms[i]}><code>{term}</code><b>{Number(terms[i])}</b></div>
          {/each}
        </div>
        <p class="pencil-note">
          A general recipe: any Boolean function can be written using AND, OR, and NOT. Each of
          those gates can itself be built from NAND.
        </p>
      {:else if chapter === 'blueprints'}
        <p class="eyebrow">03 / COMPOSITION & HDL</p>
        <h2>An interface outside.<br />A circuit inside.</h2>
        <p class="intro">
          A chip has an interface—named inputs, outputs, and promised behavior. Its implementation
          is the network of parts inside. The same interface can have more than one correct
          implementation.
        </p>
        <div class="chip-explainer">
          <div class="interface-view">
            <span>INTERFACE</span>
            <div>in → <strong>NOT</strong> → out</div>
            <p>Output is the opposite of input.</p>
          </div>
          <div class="implementation-view">
            <span>ONE IMPLEMENTATION</span>
            <div class="nand-wiring">
              <span>in ↗<br />in ↘</span><strong>NAND</strong><span>→ out</span>
            </div>
            <p>The same input feeds both NAND pins.</p>
          </div>
        </div>
        <div class="two-columns blueprint-columns">
          <div>
            <h3>Structure, expressed as code.</h3>
            <p>
              HDL means <strong>hardware description language</strong>. It describes the structure
              of a circuit, rather than a sequence of instructions.
            </p>
            <dl>
              <dt>CHIP / IN / OUT</dt>
              <dd>Name the chip and its external pins.</dd>
              <dt>PARTS</dt>
              <dd>List the components and connect their pins.</dd>
              <dt>Nand(a=in, b=in, out=out)</dt>
              <dd>
                Connect both NAND inputs to the external input, and its output to the external
                output.
              </dd>
            </dl>
          </div>
          <div class="code-card">
            <span>Not.hdl / worked example</span>
            <pre><code>{notHDL}</code></pre>
          </div>
        </div>
        <div class="note-card">
          <h3>Primitive or composite?</h3>
          <p>
            A primitive is supplied as a working part: here, NAND. A composite is built by
            connecting other parts. Once a composite chip works, its interface lets another designer
            use it without needing to understand every wire inside.
          </p>
        </div>
        <p class="pencil-note">
          Testing checks the blueprint against its contract. For small gates, test every input
          combination. Fewer parts can be an optional design challenge after correctness.
        </p>
      {:else if chapter === 'scale'}
        <p class="eyebrow">04 / BUSES & SELECTORS</p>
        <h2>From a bit<br />to a word.</h2>
        <p class="intro">
          The current logic layer builds single-bit gates. These interactive models explain where
          the existing reading goes next: buses and multi-way selectors.
        </p>
        <div class="concept-label">Concept preview / construction planned</div>
        <h3>A bus carries many bits together.</h3>
        <p>
          An 8-bit NOT applies the same inversion to each bit independently. Flip any bit below. A
          16-bit version follows the same pattern with sixteen wires.
        </p>
        <div class="bus-sketch">
          <span class="bus-label">IN</span>
          <div class="bus-bits">
            {#each bus as bit, i}<button
                type="button"
                class:bit-on={bit}
                aria-pressed={bit}
                aria-label={`Bus input bit ${7 - i}: ${Number(bit)}`}
                onclick={() => (bus = bus.map((value, index) => (index === i ? !value : value)))}
                ><span>{7 - i}</span>{Number(bit)}</button
              >{/each}
          </div>
          <span class="bus-label">NOT</span>
          <div class="bus-bits output-bits" aria-label="Inverted bus output" aria-live="polite">
            {#each bus as bit, i}<div class:bit-on={!bit}>
                <span>{7 - i}</span>{Number(!bit)}
              </div>{/each}
          </div>
        </div>
        <div class="two-columns scale-columns">
          <div>
            <h3>More inputs. A few selector bits.</h3>
            <p>
              A multiplexor chooses one input to send to its output. With two selector bits, a
              four-way multiplexor can choose among four inputs.
            </p>
            <p>
              A demultiplexor routes in the other direction: one input to a selected output, with
              the other outputs set to 0.
            </p>
            <p class="pencil-note">
              A four-way selector needs 2 bits. An eight-way selector needs 3. Multi-bit selectors
              route a whole bus at once.
            </p>
          </div>
          <div class="selector-sketch">
            <span class="sketch-label">4-WAY / 4-BIT MUX</span>
            <div class="selector-choices">
              {#each words as word, i}<button
                  type="button"
                  class:selected-word={selector === i}
                  aria-pressed={selector === i}
                  onclick={() => (selector = i)}
                  ><span>{String.fromCharCode(97 + i)}</span><code>{word}</code><small
                    >sel {i.toString(2).padStart(2, '0')}</small
                  ></button
                >{/each}
            </div>
            <p aria-live="polite">
              sel <code>{selector.toString(2).padStart(2, '0')}</code> → OUT
              <strong>{words[selector]}</strong>
            </p>
          </div>
        </div>
      {:else}
        <p class="eyebrow">05 / SOURCES & FURTHER READING</p>
        <h2>Go deeper<br />into the design.</h2>
        <p class="intro">
          Explore the original explanations, inspect the exercise contracts, or open the full
          hardware IDE for an unconstrained workspace.
        </p>
        <div class="reading-links">
          <a href="/learn/hardware/boolean-logic/intro"
            ><span>01 / THE BIG PICTURE</span><strong>Why build a computer from gates?</strong><b
              aria-hidden="true">↗</b
            ></a
          >
          <a href="/learn/hardware/boolean-logic/background"
            ><span>02 / BOOLEAN LOGIC REFERENCE</span><strong
              >Boolean logic, HDL & simulation</strong
            ><b aria-hidden="true">↗</b></a
          >
          <a href="/learn/hardware/boolean-logic/project"
            ><span>03 / CHIP SPECIFICATIONS</span><strong>Gate specifications & exercises</strong><b
              aria-hidden="true">↗</b
            ></a
          >
          <a href="/experiment/hardware-ide"
            ><span>04 / FREE EXPLORATION</span><strong>Open the hardware IDE</strong><b
              aria-hidden="true">↗</b
            ></a
          >
        </div>
        <div class="note-card credits">
          <h3>Sources and attribution.</h3>
          <p>
            This reference adapts the existing Chips and Code Boolean logic material, based on <a
              href="https://www.nand2tetris.org/"
              target="_blank"
              rel="noreferrer">Nand2Tetris</a
            >. Nand2Tetris content is licensed under
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/3.0/"
              target="_blank"
              rel="noreferrer">CC BY-NC-SA 3.0</a
            >. The explanations and interactive presentation have been adapted for this interactive
            reference.
          </p>
          <p>
            Chips and Code is not affiliated with or endorsed by Nand2Tetris. Software is MIT
            licensed. <a href="/about">Project background & credits ↗</a>
          </p>
        </div>
      {/if}
      <footer class="page-footer">
        <span>CHIPS AND CODE / REFERENCE</span><span
          >{chapters.find((item) => item.id === chapter)?.number} — 05</span
        >
      </footer>
    </div>
  </div>
</section>

<style>
  .field-guide {
    --ink: #f0f0f7;
    --paper: #12151f;
    --muted: #a1a5b6;
    --line: #303446;
    --signal: #a79fff;
    background: #0b0d14;
    color: var(--ink);
    min-height: 100vh;
    padding: 36px clamp(16px, 4vw, 64px) 64px;
    font-family: Arial, Helvetica, sans-serif;
  }
  .guide-header {
    max-width: 1280px;
    margin: 0 auto 28px;
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .guide-mark {
    width: 48px;
    height: 48px;
    border: 1px solid var(--line);
    display: grid;
    place-items: center;
    color: var(--signal);
    font: 14px monospace;
    background: #181928;
  }
  .guide-heading {
    flex: 1;
  }
  .eyebrow {
    font: 10px monospace;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin: 0 0 10px;
    color: var(--muted);
  }
  .guide-heading h1 {
    font-size: 30px;
    letter-spacing: -0.9px;
    margin: 0;
    font-weight: 600;
  }
  button,
  a {
    touch-action: manipulation;
  }
  button {
    font: inherit;
    cursor: pointer;
  }
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid #b5afff !important;
    outline-offset: 4px;
  }
  .back-button {
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 12px 16px;
    color: var(--ink);
    background: #171a26;
    font-size: 12px;
    min-height: 44px;
  }
  .back-button:hover {
    background: #25283b;
  }
  .notebook {
    max-width: 1280px;
    margin: auto;
    display: grid;
    grid-template-columns: 224px minmax(0, 1fr);
    border: 1px solid var(--line);
    border-radius: 5px;
    overflow: hidden;
    background: var(--paper);
  }
  .chapter-nav {
    padding: 30px 12px;
    background: #0f111a;
    border-right: 1px solid var(--line);
  }
  .nav-caption {
    font: 10px monospace;
    line-height: 1.7;
    letter-spacing: 0.1em;
    display: block;
    padding: 0 13px;
    margin-bottom: 24px;
    color: var(--muted);
  }
  .chapter-nav button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 15px 11px;
    min-height: 50px;
    gap: 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    text-align: left;
    color: var(--muted);
    font-size: 12px;
    margin-bottom: 5px;
  }
  .chapter-nav button > span:first-child {
    font: 10px monospace;
    color: var(--muted);
  }
  .chapter-nav button.current {
    background: #25223f;
    border-color: #48406f;
    color: #f0edff;
  }
  .chapter-nav button.current > span:first-child {
    color: var(--signal);
  }
  .chapter-nav button:hover:not(.current) {
    background: #1b1e2b;
    color: var(--ink);
  }
  .chapter-arrow {
    margin-left: auto;
  }
  .margin-note {
    font: 11px/1.9 monospace;
    color: var(--muted);
    padding: 24px 12px;
  }
  .paper {
    padding: 42px clamp(24px, 4vw, 56px) 26px;
    min-width: 0;
  }
  .paper > .eyebrow {
    color: var(--signal);
  }
  .paper h2 {
    font-weight: 500;
    font-size: clamp(30px, 3.6vw, 46px);
    line-height: 1.1;
    letter-spacing: -1.6px;
    margin: 16px 0 22px;
  }
  .intro {
    max-width: 680px;
    font-size: 15px !important;
    line-height: 1.8 !important;
    color: #bfc2d1;
    margin-bottom: 28px !important;
  }
  .paper p {
    font-size: 13px;
    line-height: 1.8;
    margin: 12px 0;
  }
  .paper h3 {
    font-size: 19px;
    line-height: 1.3;
    font-weight: 500;
    margin: 24px 0 12px;
  }
  .paper strong {
    font-weight: 600;
  }
  .paper code {
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  }
  .paper a {
    text-decoration: underline;
    text-underline-offset: 3px;
    color: var(--signal);
  }
  .gate-picker {
    display: flex;
    gap: 5px;
    margin: 26px 0 10px;
    flex-wrap: wrap;
  }
  .gate-picker button {
    border: 1px solid var(--line);
    border-radius: 4px;
    background: #1a1d2a;
    padding: 10px 16px;
    font: 12px monospace;
    color: var(--muted);
    min-height: 44px;
  }
  .gate-picker button.chosen {
    background: #30285a;
    color: #ddd8ff;
    border-color: #7266b7;
  }
  .experiment {
    display: flex;
    align-items: center;
    background: radial-gradient(ellipse at 50% 50%, #242039 0%, #10131c 75%);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 30px 22px;
    min-height: 215px;
  }
  .input-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .signal-toggle,
  .signal-output {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 75px;
    min-height: 90px;
    padding: 10px;
    background: #191d2a;
    border: 1px solid #3d4359;
    border-radius: 4px;
    color: #b9bdcf;
  }
  .signal-toggle > span,
  .signal-output > span {
    font: 10px monospace;
    letter-spacing: 0.1em;
  }
  .signal-toggle b,
  .signal-output b {
    font: 30px/1.1 monospace;
  }
  .signal-toggle small,
  .signal-output small {
    font-size: 9px;
    white-space: nowrap;
  }
  .signal-toggle.high,
  .signal-output.high {
    background: #342b61;
    border-color: #9a8ddb;
    color: #e8e3ff;
  }
  .signal-toggle:hover {
    border-color: #b1a8ed;
  }
  .signal-output {
    margin-left: auto;
  }
  .wire {
    height: 2px;
    min-width: 12px;
    flex: 1;
    background: #4b5168;
    position: relative;
  }
  .wire.live {
    background: #a79fff;
    box-shadow: 0 0 12px #8578ff66;
  }
  .wire:after {
    content: '';
    position: absolute;
    right: 0;
    top: -3px;
    width: 8px;
    height: 8px;
    background: inherit;
    border-radius: 50%;
  }
  .gate-body {
    background: #1b1b30;
    border-radius: 4px;
    color: #eeeaff;
    padding: 22px 15px;
    display: flex;
    flex-direction: column;
    text-align: center;
    gap: 12px;
    min-width: 100px;
    border: 1px solid #686184;
    box-shadow:
      0 0 0 4px #10121d,
      0 0 0 5px #39364c;
  }
  .gate-body small {
    font: 9px monospace;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .gate-body strong {
    font: 23px monospace;
  }
  .gate-body span {
    font: 9px monospace;
    color: var(--signal);
  }
  .experiment-caption {
    color: var(--muted);
    font-size: 12px !important;
    padding: 8px 0 14px;
    border-bottom: 1px solid var(--line);
  }
  .two-columns {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 30px;
    align-items: start;
    margin-top: 22px;
  }
  .pencil-note {
    color: var(--muted);
    font-size: 12px !important;
    border-left: 2px solid #4c456d;
    padding-left: 14px;
  }
  .truth-table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 18px;
    font: 12px monospace;
    text-align: center;
  }
  .truth-table caption {
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 10px;
    color: var(--muted);
    padding: 0 0 10px;
  }
  .truth-table th {
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--muted);
    border-bottom: 1px solid #4a4e63;
    padding: 12px;
  }
  .truth-table td {
    padding: 11px;
    border-bottom: 1px solid var(--line);
  }
  .truth-table tr.active-row {
    background: #2b2549;
  }
  .truth-table tr.active-row td:last-child {
    color: #c6bdff;
  }
  .formula {
    padding: 25px 15px;
    border: 1px solid var(--line);
    background: #0f111b;
    font: 500 clamp(14px, 2vw, 20px) monospace;
    letter-spacing: -0.5px;
    text-align: center;
    margin: 25px 0;
  }
  .expression-controls {
    display: flex;
    gap: 12px;
    align-items: center;
    margin: 24px 0;
  }
  .expression-controls .signal-toggle {
    flex: 1;
  }
  .expression-controls .signal-output {
    margin-left: 25px;
    flex: 1;
  }
  .trace-strip {
    display: flex;
    gap: 1px;
    background: var(--line);
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 30px;
  }
  .trace-strip > span {
    flex: 1;
    background: #1a1d2a;
    padding: 12px;
    font: 10px monospace;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .trace-strip b {
    background: #302a4b;
    padding: 4px 7px;
    border-radius: 2px;
    font-size: 14px;
  }
  .canonical {
    margin: 22px 0;
  }
  .canonical > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: #161925;
    font-size: 12px;
  }
  .canonical > div.term-on {
    background: #2b2549;
    border-color: #706398;
  }
  .canonical b {
    font: 18px monospace;
  }
  .or-word {
    display: block;
    padding: 7px 16px;
    font: 9px monospace;
    letter-spacing: 0.14em;
    color: var(--muted);
  }
  .chip-explainer {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
    margin: 25px 0;
    background: #161925;
  }
  .chip-explainer > div {
    padding: 24px 18px;
    text-align: center;
  }
  .chip-explainer > div + div {
    border-left: 1px dashed #4b4860;
  }
  .chip-explainer > div > span,
  .sketch-label {
    font: 9px monospace;
    letter-spacing: 0.1em;
    color: var(--muted);
  }
  .chip-explainer > div > div {
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font: 13px monospace;
  }
  .chip-explainer strong {
    background: #2d264b;
    color: #ded7ff;
    border: 1px solid #696083;
    border-radius: 3px;
    padding: 15px 10px;
  }
  .chip-explainer p {
    font-size: 11px;
    margin: 0;
  }
  .nand-wiring span {
    line-height: 1.6;
  }
  .blueprint-columns {
    grid-template-columns: 1fr 1.1fr;
    gap: 24px;
  }
  .blueprint-columns h3 {
    margin-top: 0;
  }
  .code-card {
    border: 1px solid var(--line);
    border-radius: 4px;
    overflow: hidden;
    background: #0b0d15;
    color: #ded8ff;
    margin: 4px 0;
  }
  .code-card > span {
    display: block;
    font: 10px monospace;
    letter-spacing: 0.05em;
    color: var(--muted);
    padding: 14px 18px;
    border-bottom: 1px solid var(--line);
  }
  .code-card pre {
    padding: 18px;
    margin: 0;
    overflow-x: auto;
    font-size: 11px;
    line-height: 1.8;
  }
  .paper dl {
    font-size: 11px;
    line-height: 1.7;
  }
  .paper dt {
    font: 11px monospace;
    margin-top: 14px;
    color: var(--signal);
  }
  .paper dd {
    margin: 4px 0;
    color: var(--muted);
  }
  .note-card {
    background: #1b1b2c;
    border: 1px solid var(--line);
    border-left: 2px solid #8272c5;
    padding: 4px 22px 12px;
    margin: 28px 0;
  }
  .note-card h3 {
    margin-top: 15px;
  }
  .concept-label {
    display: inline-block;
    font: 9px monospace;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    border: 1px solid #4b4563;
    border-radius: 3px;
    padding: 8px 10px;
    background: #201d30;
    color: #c4bdd8;
    margin-bottom: 3px;
  }
  .bus-sketch {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
    margin: 25px 0 32px;
  }
  .bus-label {
    font: 10px monospace;
  }
  .bus-bits {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 5px;
  }
  .bus-bits button,
  .bus-bits > div {
    position: relative;
    min-height: 55px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    background: #1a1e2b;
    border: 1px solid #41475c;
    border-radius: 3px;
    font: 21px monospace;
    color: #bbc1d8;
  }
  .bus-bits span {
    font: 9px monospace;
    color: var(--muted);
  }
  .bus-bits .bit-on {
    background: #30284f;
    color: #e1dbff;
    border-color: #8477bb;
  }
  .output-bits > div {
    background: #161925;
  }
  .scale-columns {
    grid-template-columns: 1fr 1fr;
  }
  .scale-columns h3 {
    margin-top: 0;
  }
  .selector-sketch {
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 18px;
    background: #171a27;
  }
  .selector-choices {
    display: grid;
    gap: 6px;
    margin-top: 15px;
  }
  .selector-choices button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background: #10131e;
    border: 1px solid var(--line);
    border-radius: 3px;
    padding: 10px;
    font: 12px monospace;
    min-height: 44px;
  }
  .selector-choices small {
    font-size: 9px;
    color: var(--muted);
  }
  .selector-choices .selected-word {
    background: #30284f;
    border-color: #8477bb;
  }
  .selector-sketch p {
    font: 12px monospace;
    margin-bottom: 0;
  }
  .selector-sketch p strong {
    font-size: 19px;
    color: #c7baff;
  }
  .reading-links {
    display: grid;
    gap: 10px;
    margin-top: 30px;
  }
  .reading-links a {
    padding: 22px 48px 22px 20px;
    display: flex;
    flex-direction: column;
    gap: 11px;
    position: relative;
    border: 1px solid var(--line);
    border-radius: 4px;
    text-decoration: none;
    background: #171a26;
    color: var(--ink);
  }
  .reading-links a:hover {
    background: #242039;
    border-color: #73678e;
  }
  .reading-links span {
    font: 9px monospace;
    letter-spacing: 0.08em;
    color: var(--muted);
  }
  .reading-links strong {
    font-size: 18px;
    font-weight: 500;
  }
  .reading-links b {
    position: absolute;
    right: 19px;
    top: 30px;
    font-size: 21px;
    font-weight: 400;
    color: var(--signal);
  }
  .credits p {
    font-size: 12px;
  }
  .page-footer {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    border-top: 1px solid var(--line);
    margin-top: 40px;
    padding-top: 18px;
    color: var(--muted);
    font: 9px monospace;
    letter-spacing: 0.1em;
  }
  @media (max-width: 900px) {
    .notebook {
      grid-template-columns: 185px minmax(0, 1fr);
    }
    .chapter-nav {
      padding: 28px 8px;
    }
    .chapter-nav button {
      font-size: 11px;
      gap: 7px;
      padding: 14px 8px;
    }
    .paper {
      padding: 30px 24px 22px;
    }
    .two-columns,
    .blueprint-columns,
    .scale-columns {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .truth-table {
      max-width: 400px;
      margin-top: 0;
    }
    .experiment {
      padding: 22px 15px;
    }
    .signal-toggle,
    .signal-output {
      min-width: 64px;
    }
    .gate-body {
      min-width: 87px;
      padding: 20px 10px;
    }
    .expression-controls .signal-output {
      margin-left: 5px;
    }
  }
  @media (max-width: 620px) {
    .field-guide {
      padding: 22px 12px 36px;
    }
    .guide-header {
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .guide-mark {
      width: 38px;
      height: 38px;
    }
    .guide-heading h1 {
      font-size: 24px;
    }
    .guide-heading .eyebrow {
      font-size: 8px;
      letter-spacing: 0.07em;
      margin-bottom: 5px;
    }
    .back-button {
      padding: 9px 10px;
      font-size: 10px;
    }
    .notebook {
      grid-template-columns: minmax(0, 1fr);
    }
    .chapter-nav {
      padding: 10px;
      display: flex;
      overflow-x: auto;
      border-right: 0;
      border-bottom: 1px solid var(--line);
      gap: 6px;
    }
    .nav-caption,
    .margin-note,
    .chapter-arrow {
      display: none;
    }
    .chapter-nav button {
      flex-shrink: 0;
      width: auto;
      min-height: 44px;
      padding: 10px;
      margin: 0;
      font-size: 10px;
      white-space: nowrap;
    }
    .paper {
      padding: 28px 16px 20px;
    }
    .paper h2 {
      font-size: 32px;
    }
    .intro {
      font-size: 13px !important;
    }
    .experiment {
      padding: 20px 8px;
      min-height: 200px;
    }
    .signal-toggle,
    .signal-output {
      min-width: 53px;
      padding: 9px 6px;
      min-height: 79px;
    }
    .signal-toggle small,
    .signal-output small {
      font-size: 8px;
    }
    .gate-body {
      min-width: 72px;
      padding: 18px 6px;
      gap: 11px;
    }
    .gate-body strong {
      font-size: 18px;
    }
    .gate-body small,
    .gate-body span {
      font-size: 8px;
    }
    .wire {
      min-width: 5px;
    }
    .gate-picker {
      gap: 4px;
    }
    .gate-picker button {
      padding: 10px 12px;
      font-size: 10px;
    }
    .expression-controls {
      gap: 7px;
    }
    .expression-controls .signal-toggle,
    .expression-controls .signal-output {
      min-width: 0;
    }
    .trace-strip > span {
      font-size: 8px;
      padding: 9px 6px;
      gap: 3px;
    }
    .trace-strip b {
      font-size: 12px;
      padding: 3px 5px;
    }
    .canonical > div {
      font-size: 10px;
      padding: 14px 10px;
      gap: 6px;
    }
    .chip-explainer {
      grid-template-columns: 1fr;
    }
    .chip-explainer > div + div {
      border-left: 0;
      border-top: 1px dashed #4b4860;
    }
    .bus-sketch {
      grid-template-columns: 25px minmax(0, 1fr);
      gap: 6px;
    }
    .bus-bits {
      gap: 3px;
    }
    .bus-bits button,
    .bus-bits > div {
      min-height: 50px;
      font-size: 17px;
    }
    .bus-bits span {
      font-size: 8px;
    }
    .reading-links strong {
      font-size: 16px;
    }
    .page-footer {
      font-size: 8px;
      gap: 10px;
    }
  }
</style>

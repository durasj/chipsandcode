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
    NAND: 'Outputs 0 only when both inputs are 1. This is your supplied primitive: every gate in the first expedition can be built from copies of it.',
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

<section class="field-guide" aria-label="Field guide">
  <header class="guide-header">
    <div class="guide-mark" aria-hidden="true">⌘</div>
    <div class="guide-heading">
      <p class="eyebrow">Chips & Code / Explorer's edition</p>
      <h1>Field notes.</h1>
    </div>
    <button type="button" class="back-button" onclick={onclose}>← Back to the isles</button>
  </header>

  <div class="notebook">
    <nav class="chapter-nav" aria-label="Field guide chapters">
      <span class="nav-caption">The small ideas behind big machines</span>
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
        Open when curious.<br />Take what you need.<br />Go build something.
      </p>
    </nav>

    <div class="paper">
      {#if chapter === 'signals'}
        <p class="eyebrow">Note 01 / A language with two words</p>
        <h2>Everything starts<br />with a little on & off.</h2>
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
              aria-label={`Input ${gate === 'NOT' ? 'in' : 'A'}: ${Number(a)}`}
              onclick={() => (a = !a)}
              ><span>{gate === 'NOT' ? 'in' : 'A'}</span><b>{Number(a)}</b><small>flip signal</small
              ></button
            >
            {#if gate !== 'NOT'}
              <button
                type="button"
                class="signal-toggle"
                class:high={b}
                aria-pressed={b}
                aria-label={`Input B: ${Number(b)}`}
                onclick={() => (b = !b)}
                ><span>B</span><b>{Number(b)}</b><small>flip signal</small></button
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
            <h3>No guessing. Every possibility.</h3>
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
        <p class="eyebrow">Note 02 / Same idea, different views</p>
        <h2>A machine can be<br />a sentence, too.</h2>
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
            onclick={() => (a = !a)}
            ><span>a</span><b>{Number(a)}</b><small>flip signal</small></button
          >
          <button
            type="button"
            class="signal-toggle"
            class:high={b}
            aria-pressed={b}
            onclick={() => (b = !b)}
            ><span>b</span><b>{Number(b)}</b><small>flip signal</small></button
          >
          <button
            type="button"
            class="signal-toggle"
            class:high={c}
            aria-pressed={c}
            onclick={() => (c = !c)}
            ><span>c</span><b>{Number(c)}</b><small>flip signal</small></button
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
        <p class="eyebrow">Note 03 / Look inside the black box</p>
        <h2>Small parts.<br />Bigger possibilities.</h2>
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
            <h3>A blueprint the simulator can read.</h3>
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
            <span>Not.hdl / example blueprint</span>
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
        <p class="eyebrow">Note 04 / A preview beyond the expedition</p>
        <h2>One signal.<br />Then a whole bundle.</h2>
        <p class="intro">
          The current expedition builds single-bit gates. These interactive sketches explain where
          the existing reading goes next: buses and multi-way selectors.
        </p>
        <div class="concept-label">Concept sketch / not a construction mission</div>
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
        <p class="eyebrow">Note 05 / Keep exploring</p>
        <h2>Follow the<br />wires further.</h2>
        <p class="intro">
          The expedition puts the machines first. The original reading and hardware editor are here
          whenever you want more detail or a blank workbench.
        </p>
        <div class="reading-links">
          <a href="/learn/hardware/boolean-logic/intro"
            ><span>01 / THE BIG PICTURE</span><strong>Why build a computer from gates?</strong><b
              aria-hidden="true">↗</b
            ></a
          >
          <a href="/learn/hardware/boolean-logic/background"
            ><span>02 / THE ORIGINAL FIELD NOTES</span><strong
              >Boolean logic, HDL & simulation</strong
            ><b aria-hidden="true">↗</b></a
          >
          <a href="/learn/hardware/boolean-logic/project"
            ><span>03 / THE CONSTRUCTION CONTRACTS</span><strong
              >Gate specifications & exercises</strong
            ><b aria-hidden="true">↗</b></a
          >
          <a href="/experiment/hardware-ide"
            ><span>04 / FREE EXPLORATION</span><strong>Open the hardware IDE</strong><b
              aria-hidden="true">↗</b
            ></a
          >
        </div>
        <div class="note-card credits">
          <h3>Built on good ideas.</h3>
          <p>
            These notes adapt the existing Chips and Code Boolean logic material, based on <a
              href="https://www.nand2tetris.org/"
              target="_blank"
              rel="noreferrer">Nand2Tetris</a
            >. Nand2Tetris content is licensed under
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/3.0/"
              target="_blank"
              rel="noreferrer">CC BY-NC-SA 3.0</a
            >. The explanations and interactive presentation have been adapted for this field guide.
          </p>
          <p>
            Chips and Code is not affiliated with or endorsed by Nand2Tetris. Software is MIT
            licensed. <a href="/about">Project background & credits ↗</a>
          </p>
        </div>
      {/if}
      <footer class="page-footer">
        <span>CHIPS & CODE / FIELD NOTES</span><span
          >{chapters.find((item) => item.id === chapter)?.number} — 05</span
        >
      </footer>
    </div>
  </div>
</section>

<style>
  .field-guide {
    --ink: #173641;
    --paper: #f7f2e4;
    --muted: #647373;
    --mint: #b8ebc9;
    --line: #d9d5c8;
    background: #112d38;
    color: var(--ink);
    min-height: 100vh;
    padding: 34px clamp(16px, 5vw, 80px) 60px;
    font-family: Arial, Helvetica, sans-serif;
  }
  .guide-header {
    max-width: 1240px;
    margin: 0 auto 30px;
    display: flex;
    align-items: center;
    gap: 18px;
    color: var(--paper);
  }
  .guide-mark {
    width: 54px;
    height: 54px;
    border: 1px solid #698088;
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 34px;
    color: #b8ebc9;
  }
  .guide-heading {
    flex: 1;
  }
  .eyebrow {
    font-size: 10px;
    letter-spacing: 0.16em;
    font-weight: 700;
    text-transform: uppercase;
    margin: 0 0 10px;
  }
  .guide-heading .eyebrow {
    color: #b1c4c5;
  }
  .guide-heading h1 {
    font-size: 32px;
    letter-spacing: -1.2px;
    margin: 0;
    font-weight: 700;
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
    outline: 3px solid #cc613f !important;
    outline-offset: 4px;
  }
  .back-button {
    border: 1px solid #70878a;
    border-radius: 7px;
    padding: 12px 16px;
    color: var(--paper);
    background: transparent;
    font-size: 12px;
    font-weight: 700;
    min-height: 44px;
  }
  .back-button:hover {
    background: #294650;
  }
  .notebook {
    max-width: 1240px;
    margin: auto;
    display: grid;
    grid-template-columns: 235px minmax(0, 1fr);
    border-radius: 12px;
    overflow: hidden;
    background: var(--paper);
    box-shadow: 0 25px 70px #0003;
  }
  .chapter-nav {
    padding: 35px 15px;
    background: #eae7da;
    border-right: 1px solid #d7d3c6;
  }
  .nav-caption {
    font-size: 10px;
    line-height: 1.7;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: block;
    padding: 0 14px;
    margin-bottom: 30px;
    color: #526968;
  }
  .chapter-nav button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 16px 12px;
    min-height: 52px;
    gap: 11px;
    background: transparent;
    border: 0;
    border-radius: 5px;
    text-align: left;
    color: #526665;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 5px;
  }
  .chapter-nav button > span:first-child {
    font: 11px monospace;
    color: #7c8c85;
  }
  .chapter-nav button.current {
    background: #173d45;
    color: #f7f2e4;
  }
  .chapter-nav button.current > span:first-child {
    color: #b8ebc9;
  }
  .chapter-nav button:hover:not(.current) {
    background: #dedfd1;
  }
  .chapter-arrow {
    margin-left: auto;
  }
  .margin-note {
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 17px;
    line-height: 1.6;
    color: #627570;
    padding: 25px 15px;
  }
  .paper {
    padding: 45px clamp(22px, 4vw, 60px) 24px;
    min-width: 0;
    background: linear-gradient(90deg, #dedace55, transparent 16px), var(--paper);
  }
  .paper > .eyebrow {
    color: #a95837;
  }
  .paper h2 {
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 400;
    font-size: clamp(34px, 4vw, 55px);
    line-height: 1.05;
    letter-spacing: -1.6px;
    margin: 16px 0 22px;
  }
  .intro {
    max-width: 660px;
    font-size: 15px !important;
    line-height: 1.8 !important;
    color: #526361;
    margin-bottom: 28px !important;
  }
  .paper p {
    font-size: 13px;
    line-height: 1.8;
    margin: 12px 0;
  }
  .paper h3 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 22px;
    line-height: 1.25;
    font-weight: 400;
    margin: 22px 0 12px;
  }
  .paper strong {
    font-weight: 700;
  }
  .paper code {
    font-family: 'Courier New', monospace;
  }
  .paper a {
    text-decoration: underline;
    text-underline-offset: 3px;
    color: inherit;
  }
  .gate-picker {
    display: flex;
    gap: 6px;
    margin: 25px 0 0;
    flex-wrap: wrap;
  }
  .gate-picker button {
    border: 1px solid #cfd3c7;
    border-radius: 5px 5px 0 0;
    border-bottom: 0;
    background: #ebe9dd;
    padding: 11px 17px;
    font:
      700 11px 'Courier New',
      monospace;
    color: #526665;
    min-height: 43px;
  }
  .gate-picker button.chosen {
    background: #173d45;
    color: #b8ebc9;
    border-color: #173d45;
  }
  .experiment {
    display: flex;
    align-items: center;
    background: #e8ebde;
    border: 1px solid #cfd6c8;
    border-radius: 0 8px 8px 8px;
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
    background: #d9e1d7;
    border: 1px solid #aebfb4;
    border-radius: 7px;
    color: #38534e;
  }
  .signal-toggle > span,
  .signal-output > span {
    font:
      700 10px 'Courier New',
      monospace;
    letter-spacing: 0.1em;
  }
  .signal-toggle b,
  .signal-output b {
    font-family: 'Courier New', monospace;
    font-size: 30px;
    line-height: 1.1;
  }
  .signal-toggle small,
  .signal-output small {
    font-size: 9px;
    white-space: nowrap;
  }
  .signal-toggle.high,
  .signal-output.high {
    background: #b8ebc9;
    border-color: #54856c;
    color: #153e2c;
  }
  .signal-toggle:hover {
    box-shadow: 0 2px 0 #658677;
    transform: translateY(-1px);
  }
  .signal-output {
    margin-left: auto;
  }
  .wire {
    height: 3px;
    min-width: 12px;
    flex: 1;
    background: #a5b5a5;
    position: relative;
  }
  .wire.live {
    background: #46885e;
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
    background: #23464b;
    border-radius: 8px;
    color: #f7f2e4;
    padding: 22px 15px;
    display: flex;
    flex-direction: column;
    text-align: center;
    gap: 12px;
    min-width: 100px;
    border: 4px double #769084;
    box-shadow: 4px 5px 0 #bcc7b8;
  }
  .gate-body small {
    font-size: 9px;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
  .gate-body strong {
    font:
      700 23px 'Courier New',
      monospace;
  }
  .gate-body span {
    font:
      9px 'Courier New',
      monospace;
    color: #b8ebc9;
  }
  .experiment-caption {
    color: #526665;
    font-size: 12px !important;
    padding: 8px 0 14px;
    border-bottom: 1px solid var(--line);
  }
  .two-columns {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 35px;
    align-items: start;
    margin-top: 22px;
  }
  .pencil-note {
    font-family: Georgia, serif;
    font-style: italic;
    color: #637765;
  }
  .truth-table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 18px;
    font:
      12px 'Courier New',
      monospace;
    text-align: center;
  }
  .truth-table caption {
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 10px;
    color: #5c716a;
    padding: 0 0 10px;
  }
  .truth-table th {
    font-size: 10px;
    letter-spacing: 0.12em;
    color: #64766c;
    border-bottom: 1px solid #aebdad;
    padding: 12px;
  }
  .truth-table td {
    padding: 11px;
    border-bottom: 1px solid #d8dece;
  }
  .truth-table tr.active-row {
    background: #d7edda;
  }
  .truth-table tr.active-row td:last-child {
    color: #174b2f;
  }
  .formula {
    padding: 25px 15px;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    font:
      700 clamp(14px, 2vw, 20px) 'Courier New',
      monospace;
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
    background: #d1d9cb;
    border: 1px solid #d1d9cb;
    border-radius: 7px;
    overflow: hidden;
    margin-bottom: 30px;
  }
  .trace-strip > span {
    flex: 1;
    background: #e8ebdf;
    padding: 12px;
    font:
      10px 'Courier New',
      monospace;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .trace-strip b {
    background: #cfddcb;
    padding: 4px 7px;
    border-radius: 3px;
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
    border: 1px solid #d7dccc;
    border-radius: 5px;
    background: #edeee3;
    font-size: 12px;
  }
  .canonical > div.term-on {
    background: #cbeacf;
    border-color: #77a586;
  }
  .canonical b {
    font:
      700 18px 'Courier New',
      monospace;
  }
  .or-word {
    display: block;
    padding: 7px 16px;
    font:
      9px 'Courier New',
      monospace;
    letter-spacing: 0.14em;
    color: #79877c;
  }
  .chip-explainer {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid #cdd5c7;
    border-radius: 8px;
    overflow: hidden;
    margin: 25px 0;
    background: #e8ebdf;
  }
  .chip-explainer > div {
    padding: 24px 18px;
    text-align: center;
  }
  .chip-explainer > div + div {
    border-left: 1px dashed #aabcae;
  }
  .chip-explainer > div > span,
  .sketch-label {
    font:
      9px 'Courier New',
      monospace;
    letter-spacing: 0.1em;
    color: #677e70;
  }
  .chip-explainer > div > div {
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font:
      13px 'Courier New',
      monospace;
  }
  .chip-explainer strong {
    background: #23464b;
    color: #ceebce;
    border-radius: 5px;
    padding: 15px 10px;
    box-shadow: 3px 3px 0 #b0c0b1;
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
    border-radius: 7px;
    overflow: hidden;
    background: #173d45;
    color: #e8eddf;
    margin: 4px 0;
  }
  .code-card > span {
    display: block;
    font:
      9px 'Courier New',
      monospace;
    letter-spacing: 0.05em;
    color: #a4c6b2;
    padding: 14px 18px;
    border-bottom: 1px solid #3d5d5d;
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
    font:
      700 10px 'Courier New',
      monospace;
    margin-top: 14px;
  }
  .paper dd {
    margin: 4px 0;
    color: #5d6e64;
  }
  .note-card {
    background: #eae9da;
    border-left: 3px solid #b4764c;
    padding: 4px 22px 12px;
    margin: 28px 0;
  }
  .note-card h3 {
    margin-top: 15px;
  }
  .concept-label {
    display: inline-block;
    font:
      9px 'Courier New',
      monospace;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    border: 1px solid #b8c2b0;
    border-radius: 4px;
    padding: 8px 10px;
    background: #e7eadc;
    color: #596d59;
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
    font:
      10px 'Courier New',
      monospace;
    font-weight: 700;
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
    background: #e0e6d8;
    border: 1px solid #bfccb7;
    border-radius: 4px;
    font:
      700 21px 'Courier New',
      monospace;
    color: #5d745e;
  }
  .bus-bits span {
    font:
      9px 'Courier New',
      monospace;
    color: #6d826a;
  }
  .bus-bits .bit-on {
    background: #c5e5c7;
    color: #225734;
    border-color: #8dad8b;
  }
  .output-bits > div {
    background: #e9ebde;
  }
  .scale-columns {
    grid-template-columns: 1fr 1fr;
  }
  .scale-columns h3 {
    margin-top: 0;
  }
  .selector-sketch {
    border: 1px solid #bfcbb8;
    border-radius: 7px;
    padding: 18px;
    background: #e8ebdf;
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
    background: #f1f1e5;
    border: 1px solid #cdd5c4;
    border-radius: 4px;
    padding: 10px;
    font:
      12px 'Courier New',
      monospace;
    min-height: 42px;
  }
  .selector-choices small {
    font-size: 9px;
    color: #62715e;
  }
  .selector-choices .selected-word {
    background: #c5e5c7;
    border-color: #739e79;
  }
  .selector-sketch p {
    font:
      12px 'Courier New',
      monospace;
    margin-bottom: 0;
  }
  .selector-sketch p strong {
    font-size: 19px;
    color: #25623e;
  }
  .reading-links {
    display: grid;
    gap: 12px;
    margin-top: 32px;
  }
  .reading-links a {
    padding: 22px 48px 22px 20px;
    display: flex;
    flex-direction: column;
    gap: 11px;
    position: relative;
    border: 1px solid #c8d0c1;
    border-radius: 6px;
    text-decoration: none;
    background: #eceee1;
  }
  .reading-links a:hover {
    background: #dbe7d5;
    border-color: #73967a;
  }
  .reading-links span {
    font:
      9px 'Courier New',
      monospace;
    letter-spacing: 0.08em;
    color: #607567;
  }
  .reading-links strong {
    font:
      400 21px Georgia,
      serif;
  }
  .reading-links b {
    position: absolute;
    right: 19px;
    top: 30px;
    font-size: 21px;
    font-weight: 400;
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
    color: #7f897a;
    font:
      8px 'Courier New',
      monospace;
    letter-spacing: 0.1em;
  }
  @media (max-width: 850px) {
    .notebook {
      grid-template-columns: 185px minmax(0, 1fr);
    }
    .chapter-nav {
      padding: 30px 10px;
    }
    .chapter-nav button {
      font-size: 11px;
      gap: 7px;
      padding: 14px 9px;
    }
    .paper {
      padding: 32px 25px 22px;
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
      padding: 22px 12px 35px;
    }
    .guide-header {
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .guide-mark {
      width: 40px;
      height: 40px;
      font-size: 25px;
      border-radius: 10px;
    }
    .guide-heading h1 {
      font-size: 27px;
    }
    .guide-heading .eyebrow {
      font-size: 8px;
      letter-spacing: 0.1em;
      margin-bottom: 5px;
    }
    .back-button {
      padding: 9px 10px;
      font-size: 10px;
    }
    .notebook {
      grid-template-columns: 1fr;
    }
    .chapter-nav {
      padding: 10px;
      display: flex;
      overflow-x: auto;
      border-right: 0;
      border-bottom: 1px solid #d7d3c6;
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
      padding: 29px 20px 20px;
      background: var(--paper);
    }
    .paper h2 {
      font-size: 38px;
    }
    .intro {
      font-size: 13px !important;
    }
    .experiment {
      padding: 20px 10px;
      min-height: 200px;
    }
    .signal-toggle,
    .signal-output {
      min-width: 57px;
      padding: 9px 7px;
      min-height: 79px;
    }
    .signal-toggle small,
    .signal-output small {
      font-size: 8px;
    }
    .gate-body {
      min-width: 74px;
      padding: 18px 7px;
      gap: 11px;
    }
    .gate-body strong {
      font-size: 19px;
    }
    .gate-body small,
    .gate-body span {
      font-size: 8px;
    }
    .wire {
      min-width: 7px;
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
    }
    .chip-explainer {
      grid-template-columns: 1fr;
    }
    .chip-explainer > div + div {
      border-left: 0;
      border-top: 1px dashed #aabcae;
    }
    .chip-explainer > div {
      padding: 18px;
    }
    .bus-sketch {
      grid-template-columns: 29px minmax(0, 1fr);
      gap: 8px;
    }
    .bus-bits {
      gap: 3px;
    }
    .bus-bits button,
    .bus-bits > div {
      font-size: 17px;
      min-height: 52px;
    }
    .bus-bits span {
      font-size: 8px;
    }
    .reading-links strong {
      font-size: 19px;
    }
    .formula {
      font-size: 13px;
      padding: 20px 7px;
    }
    .page-footer {
      font-size: 7px;
      gap: 10px;
    }
    .note-card {
      padding-left: 16px;
      padding-right: 16px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .signal-toggle:hover {
      transform: none;
    }
  }
</style>

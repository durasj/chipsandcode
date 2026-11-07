<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import '#lib/tools/lab.css';
  import '#lib/computer/workspace.css';
  import Screen from '#lib/computer/Screen.svelte';
  import {
    assemble,
    parseHack,
    createMachine,
    binary16,
    signed16,
    disassemble,
  } from '#lib/computer/hack.js';

  const demos = {
    value: '// Write 7 into RAM[0].\n@7\nD=A\n@R0\nM=D\n',
    pixels: '// Turn on the first 16 screen pixels.\n@SCREEN\nM=-1\n',
  };
  const draftKey = 'chipsandcode.computer-tool.v1';
  let source = demos.value;
  let format = 'assembly';
  let mode = 'split';
  let ready = false;
  let machine: ReturnType<typeof createMachine> | undefined;
  let words: number[] = [];
  let sourceMap: number[] = [];
  let symbols: Record<string, number> = {};
  let screen = new Uint16Array(8192);
  let revision = 0;
  let error = '';
  let notice = '';
  let message = '';
  let running = false;
  let frame = 0;
  let runCount = 0;
  let memoryBase = '0';
  let writeAddress = '0';
  let writeValue = '0';
  let memoryError = '';
  let trace: ReturnType<ReturnType<typeof createMachine>['step']> = null;
  $: base = Math.max(0, Math.min(24576, Math.trunc(Number(memoryBase) || 0)));
  $: memoryRows = readMemory(base, revision);
  $: instructionStart = Math.max(0, Math.min((machine?.pc ?? 0) - 6, words.length - 20));
  $: shownInstructions = words.slice(instructionStart, instructionStart + 20);

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (saved && typeof saved.source === 'string') {
        source = saved.source;
        format = saved.format === 'binary' ? 'binary' : 'assembly';
      }
    } catch {
      notice = 'Your draft can only be kept for this session.';
    }
    ready = true;
    build();
    return () => cancelAnimationFrame(frame);
  });

  function remember() {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ source, format }));
    } catch {
      notice = 'Your draft can only be kept for this session.';
    }
  }
  function edited() {
    pause();
    machine = undefined;
    words = [];
    symbols = {};
    sourceMap = [];
    trace = null;
    screen = new Uint16Array(8192);
    revision += 1;
    error = '';
    message = 'Source changed. Assemble and load to run it.';
    queueMicrotask(remember);
  }
  function snapshot() {
    if (!machine) return;
    machine = machine;
    screen = machine.screen.slice();
    revision += 1;
  }
  function build() {
    pause();
    error = '';
    memoryError = '';
    trace = null;
    try {
      if (format === 'assembly') {
        const result = assemble(source);
        words = result.words;
        sourceMap = result.sourceMap;
        symbols = result.symbols;
      } else {
        words = parseHack(source);
        sourceMap = [];
        symbols = {};
      }
      if (!words.length)
        throw new Error('Add at least one instruction before running the computer.');
      machine = createMachine(words);
      snapshot();
      message = `${words.length} instructions loaded. Step to execute the first one.`;
      remember();
    } catch (problem) {
      machine = undefined;
      words = [];
      symbols = {};
      sourceMap = [];
      screen = new Uint16Array(8192);
      revision += 1;
      error = problem instanceof Error ? problem.message : String(problem);
      message = '';
    }
  }
  function pause() {
    cancelAnimationFrame(frame);
    if (running) message = 'Paused. Step to inspect the next instruction.';
    running = false;
  }
  function step() {
    pause();
    if (!machine) return;
    trace = machine.step();
    snapshot();
    message = trace
      ? `Executed ROM[${trace.before.pc}]. ${machine.halted ? 'End of loaded program.' : 'Next instruction is highlighted.'}`
      : 'End of loaded program. Reset to run again.';
  }
  function run() {
    if (!machine || running) return;
    running = true;
    runCount = 0;
    message = 'Running. Pause to inspect the machine.';
    function batch() {
      if (!running || !machine) return;
      const count = Math.min(2000, 200000 - runCount);
      trace = machine.run(count);
      runCount += count;
      snapshot();
      if (machine.halted || runCount >= 200000) {
        running = false;
        message = machine.halted
          ? 'End of loaded program.'
          : 'Paused after 200,000 instructions. Run again to continue.';
      } else frame = requestAnimationFrame(batch);
    }
    frame = requestAnimationFrame(batch);
  }
  function reset() {
    pause();
    machine?.reset();
    trace = null;
    memoryError = '';
    snapshot();
    message = 'Registers, memory, and screen reset. The program is still loaded.';
  }
  function readMemory(start: number, _revision: number) {
    void _revision;
    return Array.from({ length: Math.min(16, 24577 - start) }, (_, i) => ({
      address: start + i,
      value: machine?.read(start + i) ?? 0,
    }));
  }
  function setMemory() {
    memoryError = '';
    const address = Number(writeAddress),
      value = Number(writeValue);
    if (
      !Number.isInteger(address) ||
      address < 0 ||
      address > 24575 ||
      !Number.isInteger(value) ||
      value < -32768 ||
      value > 65535
    ) {
      memoryError = 'Use a writable address from 0 to 24575 and a value from −32768 to 65535.';
      return;
    }
    pause();
    machine?.write(address, value & 65535);
    snapshot();
  }
  function keydown(event: KeyboardEvent) {
    if (!machine || event.ctrlKey || event.metaKey || event.altKey) return;
    const special: Record<string, number> = {
      Enter: 128,
      Backspace: 129,
      ArrowLeft: 130,
      ArrowUp: 131,
      ArrowRight: 132,
      ArrowDown: 133,
      Home: 134,
      End: 135,
      PageUp: 136,
      PageDown: 137,
      Insert: 138,
      Delete: 139,
      Escape: 140,
    };
    const functionKey = event.key.match(/^F([1-9]|1[0-2])$/);
    const code = functionKey
      ? 140 + Number(functionKey[1])
      : event.key.length === 1 && event.key.charCodeAt(0) <= 127
        ? event.key.charCodeAt(0)
        : special[event.key];
    if (code === undefined) return;
    event.preventDefault();
    machine.setKeyboard(code);
    snapshot();
  }
  function releaseKey() {
    machine?.setKeyboard(0);
    snapshot();
  }
  function download() {
    if (!words.length) return;
    const url = URL.createObjectURL(
      new Blob([words.map(binary16).join('\n') + '\n'], { type: 'text/plain' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Program.hack';
    link.click();
    URL.revokeObjectURL(url);
  }
  function loadDemo(key: keyof typeof demos) {
    source = demos[key];
    format = 'assembly';
    build();
  }
</script>

<svelte:head
  ><title>Computer & assembler · Tools · Chips and Code</title><meta
    name="description"
    content="Assemble Hack programs and watch instructions change registers, memory, and a working screen."
  /></svelte:head
>
<main class="logic-lab machine-lab" data-ready={ready} aria-labelledby="computer-title">
  <a class="back-link" href={resolve('/tools')}>← Tools</a>
  <header class="tool-heading">
    <p class="eyebrow">From instructions to a working machine</p>
    <h1 id="computer-title">Computer &amp; assembler</h1>
    <p class="tool-intro">Write instructions. Step through them. Watch the machine respond.</p>
  </header>
  <div class="workspace-toolbar">
    <label
      >View<select bind:value={mode}
        ><option value="split">Split</option><option value="visual">Visual</option><option
          value="code">Code</option
        ></select
      ></label
    >
    <button class="action primary" on:click={build}>Assemble &amp; load</button>
    <button class="action" on:click={step} disabled={!machine || running}>Step</button>
    {#if running}<button class="action" on:click={pause}>Pause</button>{:else}<button
        class="action"
        on:click={run}
        disabled={!machine || machine.halted}>Run</button
      >{/if}
    <button class="action" on:click={reset} disabled={!machine}>Reset</button>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <p class="status" role="status">{message}</p>
  <div class="machine-grid" class:single={mode !== 'split'}>
    {#if mode !== 'visual'}<section class="code-panel" aria-labelledby="source-heading">
        <div class="code-label">
          <h2 id="source-heading">Program</h2>
          <label
            >Source format<select bind:value={format} on:change={edited}
              ><option value="assembly">Hack assembly</option><option value="binary"
                >Binary .hack</option
              ></select
            ></label
          >
        </div>
        <label class="source-label"
          ><span class="sr-only">Program source</span><textarea
            bind:value={source}
            on:input={edited}
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
            aria-label="Program source"
          ></textarea></label
        >
        <p class="hint">
          Assembly symbols are case-sensitive. Machine words have exactly 16 binary digits.
        </p>
        <details>
          <summary>Small examples</summary>
          <p>
            These demonstrations write a value or a screen word. Your course projects build larger
            programs.
          </p>
          <div class="field-row">
            <button class="action" on:click={() => loadDemo('value')}>Write a value</button><button
              class="action"
              on:click={() => loadDemo('pixels')}>Light 16 pixels</button
            >
          </div>
        </details>
        {#if words.length}<details>
            <summary>Machine code · {words.length} instructions</summary>
            <p class="hint">
              The highlighted address is next. Source line numbers refer to your assembly text.
            </p>
            <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div class="scroll-region" tabindex="0" role="region" aria-label="Machine instructions">
              <table>
                <thead
                  ><tr
                    ><th scope="col">ROM</th><th scope="col">Source</th><th scope="col"
                      >Instruction</th
                    ><th scope="col">Bits</th></tr
                  ></thead
                ><tbody
                  >{#each shownInstructions as word, index (instructionStart + index)}<tr
                      class:current-row={machine?.pc === instructionStart + index}
                      ><th scope="row">{instructionStart + index}</th><td
                        >{sourceMap[instructionStart + index] ?? '—'}</td
                      ><td>{disassemble(word)}</td><td>{binary16(word)}</td></tr
                    >{/each}</tbody
                >
              </table>
            </div>
            <button class="text-button" on:click={download}>Download .hack</button>
          </details>{/if}
        {#if Object.keys(symbols).length}<details>
            <summary>Symbol table</summary><!-- svelte-ignore a11y_no_noninteractive_tabindex -->
            <div class="scroll-region" tabindex="0" role="region" aria-label="Assembler symbols">
              <table>
                <thead><tr><th scope="col">Symbol</th><th scope="col">Address</th></tr></thead
                ><tbody
                  >{#each Object.entries(symbols) as [name, value] (name)}<tr
                      ><th scope="row">{name}</th><td>{value}</td></tr
                    >{/each}</tbody
                >
              </table>
            </div>
            <p>Labels resolve to ROM addresses. Variables start at RAM address 16.</p>
          </details>{/if}
      </section>{/if}
    {#if mode !== 'code'}<section class="machine-panel" aria-labelledby="machine-heading">
        <h2 id="machine-heading">Machine state</h2>
        <dl class="readouts">
          <div>
            <dt>A register</dt>
            <dd data-testid="register-a">{machine?.a ?? 0}</dd>
          </div>
          <div>
            <dt>D register</dt>
            <dd data-testid="register-d">{machine?.d ?? 0}</dd>
          </div>
          <div>
            <dt>Next ROM</dt>
            <dd data-testid="register-pc">{machine?.pc ?? 0}</dd>
          </div>
        </dl>
        <Screen words={screen} />
        <div class="field-row">
          <label
            >Keyboard<input
              type="text"
              readonly
              value={machine?.keyboard ? `Key code ${machine.keyboard}` : ''}
              placeholder="Focus here and hold a key"
              on:keydown={keydown}
              on:keyup={releaseKey}
              on:blur={releaseKey}
              disabled={!machine}
              aria-label="Keyboard input"
            /></label
          >
        </div>
        <p class="hint">Keyboard input appears at RAM[24576]. Release the key to return it to 0.</p>
        <details open>
          <summary>Memory</summary>
          <div class="field-row">
            <label
              >Start address<input
                type="text"
                inputmode="numeric"
                bind:value={memoryBase}
                aria-label="Memory start address"
              /></label
            >
          </div>
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <div class="scroll-region" tabindex="0" role="region" aria-label="Computer memory">
            <table>
              <thead
                ><tr
                  ><th scope="col">Address</th><th scope="col">Unsigned</th><th scope="col"
                    >Signed</th
                  ></tr
                ></thead
              ><tbody
                >{#each memoryRows as row (row.address)}<tr
                    ><th scope="row">{row.address}</th><td data-testid={`memory-${row.address}`}
                      >{row.value}</td
                    ><td>{signed16(row.value)}</td></tr
                  >{/each}</tbody
              >
            </table>
          </div>
          <details>
            <summary>Set a memory word</summary>
            <div class="field-row">
              <label
                >Address<input type="text" inputmode="numeric" bind:value={writeAddress} /></label
              ><label>Value<input type="text" bind:value={writeValue} /></label><button
                class="action"
                on:click={setMemory}
                disabled={!machine}>Write</button
              >
            </div>
            {#if memoryError}<p class="error" role="alert">{memoryError}</p>{/if}
          </details>
        </details>
        {#if trace}<details>
            <summary>Last instruction</summary>
            <p class="small-note">
              ROM[{trace.before.pc}]: {disassemble(trace.instruction)}<br />{trace.writeM
                ? `Memory[${trace.addressM}] ← ${trace.outM}`
                : 'No memory write.'}<br />{trace.jumped
                ? 'Jump taken.'
                : 'Next address selected normally.'}<br />{machine?.cycles ?? 0} instructions executed.
            </p>
          </details>{/if}
      </section>{/if}
  </div>
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  <div class="more-reading">
    <a href={resolve('/learn/path/[chapter]', { chapter: 'machine-language' })}
      >Learn machine language ↗</a
    ><a href={resolve('/learn/path/[chapter]', { chapter: 'assembler' })}>Build an assembler ↗</a><a
      href={resolve('/learn/reference/[...path]', { path: 'assembler' })}
      >Read the full explanation ↗</a
    >
  </div>
</main>

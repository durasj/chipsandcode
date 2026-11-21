<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import '#lib/tools/lab.css';
  import '#lib/computer/workspace.css';
  import FileEditor from '#lib/software/FileEditor.svelte';
  import Screen from '#lib/computer/Screen.svelte';
  import { createVM } from '#lib/software/index.js';
  let files: Record<string, string> = {
    'Stack.vm': '// Add two values on the stack.\npush constant 7\npush constant 8\nadd\n',
  };
  let runner: ReturnType<typeof createVM> | undefined;
  let ready = false,
    running = false,
    error = '',
    status = '',
    notice = '',
    mode = 'split';
  let stack: number[] = [];
  let segments = { SP: 256, LCL: 0, ARG: 0, THIS: 0, THAT: 0 };
  let calls: string[] = [];
  let current: { file: string; line: number; command: string } | null = null;
  let screen = new Uint16Array(8192);
  let cycles = 0;
  let keyboard = 0;
  let frame = 0;
  let started = 0;
  let address = '0';
  let memoryValue: number | null = null;
  onMount(() => {
    try {
      const transferred = sessionStorage.getItem('chipsandcode.vm.transfer.v1');
      const saved = JSON.parse(transferred || localStorage.getItem('chipsandcode.vm.v1') || 'null');
      if (
        saved &&
        typeof saved === 'object' &&
        !Array.isArray(saved) &&
        Object.values(saved).every((value) => typeof value === 'string')
      ) {
        files = saved;
        if (transferred) {
          localStorage.setItem('chipsandcode.vm.v1', JSON.stringify(files));
          sessionStorage.removeItem('chipsandcode.vm.transfer.v1');
        }
      }
    } catch {
      notice = 'Your draft can only be kept for this session.';
    }
    ready = true;
    load();
    return () => {
      cancelAnimationFrame(frame);
      runner?.dispose();
    };
  });
  function pause() {
    cancelAnimationFrame(frame);
    running = false;
  }
  function clear() {
    pause();
    runner?.dispose();
    runner = undefined;
    stack = [];
    segments = { SP: 256, LCL: 0, ARG: 0, THIS: 0, THAT: 0 };
    calls = [];
    current = null;
    screen = new Uint16Array(8192);
    cycles = 0;
    memoryValue = null;
    keyboard = 0;
  }
  function edited() {
    clear();
    error = '';
    status = 'Source changed. Load the program to run it.';
    queueMicrotask(() => {
      try {
        localStorage.setItem('chipsandcode.vm.v1', JSON.stringify(files));
      } catch {
        notice = 'Your draft can only be kept for this session.';
      }
    });
  }
  function refresh() {
    if (!runner) return;
    stack = [...runner.stack];
    segments = { ...runner.segments };
    calls = [...runner.callStack];
    current = runner.current;
    screen = runner.screen.slice();
    cycles = runner.cycles;
    if (memoryValue !== null) readMemory();
  }
  function load() {
    clear();
    error = '';
    try {
      runner = createVM(files);
      refresh();
      status = 'Program loaded. Step to follow its stack.';
    } catch (problem) {
      error = problem instanceof Error ? problem.message : String(problem);
      status = '';
    }
  }
  function step() {
    pause();
    error = '';
    if (!runner) return;
    try {
      runner.step();
      refresh();
      status = runner.halted
        ? 'Program finished.'
        : runner.blocked
          ? 'Waiting for a runtime service or keyboard input.'
          : 'One VM command executed.';
    } catch (problem) {
      error = problem instanceof Error ? problem.message : String(problem);
    }
  }
  function run() {
    if (!runner || running) return;
    running = true;
    started = runner.cycles;
    error = '';
    status = 'Running. Pause to inspect the stack.';
    function batch() {
      if (!running || !runner) return;
      try {
        runner.run(2000);
        refresh();
        if (runner.halted) {
          pause();
          status = 'Program finished.';
        } else if (runner.cycles - started >= 200000) {
          pause();
          status = 'Paused after 200,000 VM commands. Run again to continue.';
        } else {
          status = runner.blocked
            ? 'Waiting for a runtime service or keyboard input.'
            : 'Running. Pause to inspect the stack.';
          frame = requestAnimationFrame(batch);
        }
      } catch (problem) {
        pause();
        error = problem instanceof Error ? problem.message : String(problem);
      }
    }
    frame = requestAnimationFrame(batch);
  }
  function reset() {
    pause();
    if (!runner) return;
    runner.reset();
    keyboard = 0;
    runner.setKeyboard(0);
    refresh();
    status = 'Program reset.';
    error = '';
  }
  function readMemory() {
    if (!runner) return;
    const n = Number(address);
    if (!address.trim() || !Number.isInteger(n) || n < 0 || n > 24576) {
      memoryValue = null;
      return;
    }
    memoryValue = runner.read(n);
  }
  function keydown(event: KeyboardEvent) {
    if (!runner || event.ctrlKey || event.metaKey || event.altKey) return;
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
    const f = event.key.match(/^F([1-9]|1[0-2])$/);
    const code = f
      ? 140 + Number(f[1])
      : event.key.length === 1 && event.key.charCodeAt(0) <= 127
        ? event.key.charCodeAt(0)
        : special[event.key];
    if (code === undefined) return;
    event.preventDefault();
    keyboard = code;
    runner.setKeyboard(code);
  }
  function release() {
    keyboard = 0;
    runner?.setKeyboard(0);
  }
</script>

<svelte:head><title>VM emulator · Tools · Chips and Code</title></svelte:head>
<main class="logic-lab machine-lab" data-ready={ready} aria-labelledby="vm-title">
  <a class="back-link" href={resolve('/tools')}>← Tools</a>
  <header class="tool-heading">
    <p class="eyebrow">A machine for your compiled code</p>
    <h1 id="vm-title">VM emulator</h1>
    <p class="tool-intro">
      Watch stack commands, function calls, and memory turn a program into behavior.
    </p>
  </header>
  <div class="workspace-toolbar">
    <label
      >View<select bind:value={mode}
        ><option value="split">Split</option><option value="visual">Visual</option><option
          value="code">Code</option
        ></select
      ></label
    ><button class="action primary" on:click={load}>Load program</button><button
      class="action"
      on:click={step}
      disabled={!runner || running}>Step</button
    >{#if running}<button
        class="action"
        on:click={() => {
          pause();
          status = 'Paused.';
        }}>Pause</button
      >{:else}<button class="action" on:click={run} disabled={!runner || runner.halted}>Run</button
      >{/if}<button class="action" on:click={reset} disabled={!runner}>Reset</button>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}
  <p class="status" role="status">{status}</p>
  <div class="machine-grid" class:single={mode !== 'split'}>
    {#if mode !== 'visual'}<section aria-label="VM source">
        <FileEditor bind:files extension="vm" onchange={edited} />
        <p class="hint">
          Supports arithmetic, memory segments, branching, functions, calls, and return. Native Jack
          OS services are available.
        </p>
      </section>{/if}
    {#if mode !== 'code'}<section aria-label="VM state">
        <h2>Stack</h2>
        <p class="small-note" data-testid="vm-current">
          {current ? `${current.file}:${current.line} · ${current.command}` : 'No next command.'}
        </p>
        <p class="hint">{cycles} commands executed. The most recent stack value is last.</p>
        <div class="stack" role="group" aria-label="VM stack" data-testid="vm-stack">
          {#if stack.length}{#each stack.slice(-16) as word, index (index)}<div>
                <span>{segments.SP - Math.min(16, stack.length) + index}</span><strong
                  >{word}</strong
                >
              </div>{/each}{:else}<p class="hint">The stack is empty.</p>{/if}
        </div>
        <Screen words={screen} />
        <div class="field-row">
          <label
            >Keyboard<input
              type="text"
              readonly
              value={keyboard ? `Key code ${keyboard}` : ''}
              placeholder="Focus here and hold a key"
              aria-label="Keyboard input"
              on:keydown={keydown}
              on:keyup={release}
              on:blur={release}
              disabled={!runner}
            /></label
          >
        </div>
        <details>
          <summary>Segments and calls</summary>
          <dl class="segments">
            {#each Object.entries(segments) as [name, value] (name)}<div>
                <dt>{name}</dt>
                <dd>{value}</dd>
              </div>{/each}
          </dl>
          <h3>Call stack</h3>
          {#if calls.length}<ol>
              {#each calls as call, index (index)}<li>{call}</li>{/each}
            </ol>{:else}<p class="hint">No active function calls.</p>{/if}
        </details>
        <details>
          <summary>Inspect memory</summary>
          <div class="field-row">
            <label
              >Memory address<input
                type="text"
                inputmode="numeric"
                bind:value={address}
                on:input={() => (memoryValue = null)}
              /></label
            ><button class="action" on:click={readMemory} disabled={!runner}>Read memory</button>
          </div>
          <p class="small-note">
            Value: <output data-testid="vm-memory">{memoryValue ?? '—'}</output>
          </p>
          <p class="hint">Use an address from 0 to 24576.</p>
        </details>
      </section>{/if}
  </div>
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  <div class="more-reading">
    <a href={resolve('/tools/compiler')}>Compile Jack source ↗</a><a
      href={resolve('/tools/computer')}>Inspect the hardware computer ↗</a
    >
  </div>
</main>

<style>
  .stack {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 20px 0 26px;
    min-height: 60px;
  }
  .stack > div {
    display: grid;
    min-width: 64px;
    padding: 10px;
    border: 1px solid #717b94;
    background: #171d2d;
  }
  .stack span {
    font:
      10px/1.6 ui-monospace,
      monospace;
    color: #c0c6d8;
  }
  .stack strong {
    font:
      20px/1.6 ui-monospace,
      monospace;
    color: #edeaff;
  }
  .segments {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }
  .segments dt {
    color: #b8bbd0;
    font-size: 12px;
  }
  .segments dd {
    margin: 5px 0;
    font:
      18px ui-monospace,
      monospace;
  }
</style>

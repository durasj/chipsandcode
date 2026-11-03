<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import '#lib/tools/lab.css';
  import '#lib/computer/workspace.css';
  import FileEditor from '#lib/software/FileEditor.svelte';
  import { compileJack } from '#lib/software/index.js';
  const example =
    'class Main {\n  function void main() {\n    do Output.printInt(2 + 3);\n    return;\n  }\n}\n';
  let files: Record<string, string> = { 'Main.jack': example };
  let output: Record<string, string> = {};
  let diagnostics: { file: string; line: number; column: number; message: string }[] = [];
  let activeOutput = '';
  let ready = false;
  let status = '';
  let notice = '';
  let mode = 'split';
  $: if (!(activeOutput in output)) activeOutput = Object.keys(output)[0] ?? '';
  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('chipsandcode.compiler.v1') || 'null');
      if (
        saved &&
        typeof saved === 'object' &&
        !Array.isArray(saved) &&
        Object.values(saved).every((v) => typeof v === 'string')
      )
        files = saved;
    } catch {
      notice = 'Your draft can only be kept for this session.';
    }
    ready = true;
  });
  function edited() {
    output = {};
    diagnostics = [];
    status = 'Source changed. Compile to produce new VM code.';
    queueMicrotask(() => {
      try {
        localStorage.setItem('chipsandcode.compiler.v1', JSON.stringify(files));
      } catch {
        notice = 'Your draft can only be kept for this session.';
      }
    });
  }
  function compile() {
    output = {};
    diagnostics = [];
    try {
      const result = compileJack(files);
      diagnostics = result.errors;
      if (!diagnostics.length) {
        output = result.files;
        status = `Compiled ${Object.keys(output).length} VM ${Object.keys(output).length === 1 ? 'file' : 'files'}.`;
      } else status = 'Fix the source errors, then compile again.';
    } catch (problem) {
      diagnostics = [
        {
          file: 'Project',
          line: 0,
          column: 0,
          message: problem instanceof Error ? problem.message : String(problem),
        },
      ];
      status = 'Compilation failed.';
    }
  }
  async function openVM() {
    try {
      sessionStorage.setItem('chipsandcode.vm.transfer.v1', JSON.stringify(output));
      await goto(resolve('/tools/vm'));
    } catch {
      notice =
        'Could not transfer the project. Download its VM files and import them into the VM emulator.';
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob([output[activeOutput]], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = activeOutput;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head><title>Jack compiler · Tools · Chips and Code</title></svelte:head>
<main class="logic-lab machine-lab" data-ready={ready} aria-labelledby="compiler-title">
  <a class="back-link" href={resolve('/tools')}>← Tools</a>
  <header class="tool-heading">
    <p class="eyebrow">From a language to instructions</p>
    <h1 id="compiler-title">Jack compiler</h1>
    <p class="tool-intro">
      Compile a Jack project into VM code. Follow the result into the running machine.
    </p>
  </header>
  <div class="workspace-toolbar">
    <label
      >View<select bind:value={mode}
        ><option value="split">Source &amp; output</option><option value="source">Source</option
        ><option value="output">Output</option></select
      ></label
    ><button class="action primary" on:click={compile}>Compile Jack</button><button
      class="action"
      on:click={openVM}
      disabled={!Object.keys(output).length}>Open in VM emulator</button
    >
  </div>
  <p class="status" role="status">{status}</p>
  {#if diagnostics.length}<div class="error" role="alert">
      <p>Compilation errors</p>
      <ul>
        {#each diagnostics as issue, index (index)}<li>
            {issue.file}{issue.line ? `:${issue.line}:${issue.column}` : ''} — {issue.message}
          </li>{/each}
      </ul>
    </div>{/if}
  <div class="machine-grid" class:single={mode !== 'split'}>
    {#if mode !== 'output'}<section aria-label="Jack source">
        <FileEditor bind:files extension="jack" onchange={edited} />
      </section>{/if}{#if mode !== 'source'}<section aria-label="Compiler output">
        <div class="field-row">
          <label
            >VM output file<select bind:value={activeOutput} disabled={!Object.keys(output).length}
              >{#each Object.keys(output) as name (name)}<option value={name}>{name}</option
                >{/each}</select
            ></label
          >
        </div>
        <label
          >Generated VM<textarea
            readonly
            value={output[activeOutput] ?? ''}
            spellcheck="false"
            placeholder="Compile your source to inspect its VM instructions."
          ></textarea></label
        ><button class="text-button" on:click={download} disabled={!activeOutput}
          >Download selected .vm file</button
        >
        <p class="hint">
          The compiler handles classes, methods, constructors, arrays, strings, expressions, and
          control flow. Runtime services are supplied by the VM emulator.
        </p>
      </section>{/if}
  </div>
  {#if notice}<p class="notice" role="status">{notice}</p>{/if}
  <div class="more-reading">
    <a href={resolve('/tools/vm')}>VM emulator ↗</a><a href={resolve('/tools/bitmap')}
      >Draw a bitmap for Jack ↗</a
    >
  </div>
</main>

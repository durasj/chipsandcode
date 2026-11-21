<script lang="ts">
  import { DropdownMenu, Popover, Tabs } from 'bits-ui';

  import { goto } from '$app/navigation';
  import { compileHDL, type HDLCircuit } from '#lib/computer/hdl.js';
  import { createHDLTest, type HDLTestSession } from '#lib/computer/testing.js';
  import { dependencyMap, readWorkshopDraft } from '#lib/computer/hardware-project.js';
  import HardwarePeripherals from '#lib/computer/HardwarePeripherals.svelte';
  import type { Experiment, ExperimentRequest } from '#src/lib/shared.js';
  import type * as monacoApi from 'monaco-editor/editor/editor.api.js';
  import api, { apiEnabled } from '#lib/api.js';
  import examples from '../hardware-simulator/examples';

  function monacoEditor(node: HTMLElement) {
    let disposed = false;
    const subscriptions: monacoApi.IDisposable[] = [];
    (async () => {
      monaco = (await import('../editor')).monaco;
      if (disposed) return;
      monaco.editor.defineTheme('chips-and-code', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: 'A8AEC4' },
          { token: 'keyword', foreground: 'C4B9FF' },
          { token: 'entity', foreground: '95D8EF' },
          { token: 'type', foreground: 'E3E5F1' },
          { token: 'number', foreground: 'C2E5BD' },
        ],
        colors: {
          'editor.background': '#10131F',
          'editor.foreground': '#E3E5F1',
          'editorLineNumber.foreground': '#9DA5BE',
          'editorLineNumber.dimmedForeground': '#9DA5BE',
          'editorLineNumber.activeForeground': '#F4F3FF',
          'editor.lineHighlightBackground': '#191E30',
          'editor.selectionBackground': '#3E356B',
          'editorCursor.foreground': '#C4B9FF',
          'editorWidget.background': '#191E30',
          'editorWidget.border': '#626B85',
          focusBorder: '#C4B9FF',
        },
      });

      const draft = loadDraft();
      if (draft?.name) name = draft.name;
      dependencies = draft?.dependencies ?? experiment?.dependencies ?? [];
      testFiles = draft?.testFiles ?? experiment?.testFiles ?? {};
      try {
        workshopDraftAvailable = !!readWorkshopDraft(localStorage);
      } catch {
        /* Storage may be disabled. */
      }
      hdlModel = monaco.editor.createModel(draft?.hdl ?? experiment?.code ?? '', 'hdl');
      tstModel = monaco.editor.createModel(draft?.tests ?? experiment?.tests ?? '', 'tst');
      diffModel = {
        original: monaco.editor.createModel('', 'text/plain'),
        modified: monaco.editor.createModel(
          draft?.compare ?? experiment?.compare ?? '',
          'text/plain',
        ),
      };
      subscriptions.push(
        hdlModel.onDidChangeContent(() => {
          const valid = setup();
          checkIsDirty();
          if (valid) {
            runTestScript();
            run();
          }
          persistDraft();
        }),
      );
      subscriptions.push(
        tstModel.onDidChangeContent(() => {
          setupTestScript();
          checkIsDirty();
          runTestScript();
          persistDraft();
        }),
      );
      subscriptions.push(
        diffModel.modified.onDidChangeContent(() => {
          invalidateTests();
          checkIsDirty();
          runTestScript();
          persistDraft();
        }),
      );
      setup();
      setupTestScript();
      editor = monaco.editor.create(node, {
        ...editorOptions,
        model: hdlModel,
      });
      initialized = true;
      if (experiment || draft) {
        runTestScript();
        run();
        checkIsDirty();
      }
    })().catch((cause) => {
      if (!disposed)
        operationError = `The editor could not load. ${cause instanceof Error ? cause.message : 'Please reload and try again.'}`;
    });
    return {
      destroy() {
        disposed = true;
        workspaceActive = false;
        subscriptions.forEach((subscription) => subscription.dispose());
        editor?.dispose();
        hdlModel?.dispose();
        tstModel?.dispose();
        diffModel?.original.dispose();
        diffModel?.modified.dispose();
      },
    };
  }

  const editorOptions = {
    theme: 'chips-and-code',
    automaticLayout: true,
    editContext: false,
    wordBasedSuggestions: 'off',
    minimap: { enabled: false },
    fontSize: 14,
    lineHeight: 23,
    padding: { top: 16, bottom: 16 },
    scrollBeyondLastLine: false,
    accessibilityHelpUrl:
      'https://github.com/Microsoft/monaco-editor/wiki/Monaco-Editor-Accessibility-Guide',
  } satisfies monacoApi.editor.IStandaloneEditorConstructionOptions;

  function invalidateTests() {
    testSession = undefined;
    testStats = undefined;
    testStatus = '';
    diffModel?.original.setValue('');
  }

  function handleEditorError(e: any, model: monacoApi.editor.ITextModel) {
    let line: number = e.token?.line;
    let col: number = e.token?.col;
    if (!e.token) {
      // If this is lexer error it provides line/col only in message
      const lineCol = e.message.match(/line (\d+) col (\d+)/);
      if (lineCol) {
        line = +lineCol[1];
        col = +lineCol[2];
      }
    }

    // We must resort to simply first character if we don't know the token
    // This can be an error that is not strictly parsing related
    if (!line && !col) {
      monaco.editor.setModelMarkers(model, 'parser', [
        {
          startColumn: 1,
          startLineNumber: 1,
          endColumn: 1,
          endLineNumber: 1,
          severity: monaco.MarkerSeverity.Error,
          message: e.message,
        },
      ]);
      return;
    }

    // Skip suggestions for tokens like comments that don't help
    const skip = ['comment', 'commentBlock', 'whiteSpace'];
    const unwantedSuggestionsRe = new RegExp(
      `A (${skip.join('|')})( token)? based on:.*?(?=A .+ based on)`,
      'gms',
    );
    const message = e.message.replace(unwantedSuggestionsRe, '');

    monaco.editor.setModelMarkers(model, 'parser', [
      {
        startColumn: col,
        startLineNumber: line,
        endColumn: col + (e.token?.text.length || 1),
        endLineNumber: line,
        severity: monaco.MarkerSeverity.Error,
        message,
      },
    ]);
  }

  function setup() {
    codeError = '';
    runtimeError = '';
    testError = '';
    chip = undefined;
    inputPins = [];
    internalPins = [];
    outputPins = [];
    cycles = 0;
    phase = 'tock';
    invalidateTests();
    const value = hdlModel.getValue();
    monaco.editor.setModelMarkers(hdlModel, 'parser', []);
    if (
      !value
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .trim()
    )
      return false;
    try {
      chip = compileHDL(value, dependencyMap(dependencies));
      reflectPins();
      return true;
    } catch (cause) {
      codeError = cause instanceof Error ? cause.message : String(cause);
      handleEditorError(cause, hdlModel);
      return false;
    }
  }

  function setupTestScript() {
    testError = '';
    invalidateTests();
    monaco.editor.setModelMarkers(tstModel, 'parser', []);
  }

  function inputValues() {
    return Object.fromEntries(
      inputPins.map(({ name, value, width }) => {
        const parsed = typeof value === 'number' ? value : value.trim() ? Number(value) : NaN;
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > 2 ** width - 1)
          throw new Error(
            width === 1
              ? `Input ${name} must be 0 or 1.`
              : `Input ${name} must be an integer from 0 to ${2 ** width - 1}.`,
          );
        return [name, parsed];
      }),
    );
  }

  function run() {
    if (!chip || codeError) return;
    runtimeError = '';
    try {
      chip.evaluate(inputValues());
      reflectPins(false);
    } catch (cause) {
      runtimeError = cause instanceof Error ? cause.message : String(cause);
      invalidateTests();
    }
  }

  function advance() {
    if (!chip) return;
    runtimeError = '';
    try {
      if (chip.phase === 'tock') chip.tick(inputValues());
      else {
        chip.tock();
        cycles += 1;
      }
      reflectPins();
    } catch (cause) {
      runtimeError = cause instanceof Error ? cause.message : String(cause);
    }
  }

  function resetCircuit() {
    if (!chip) return;
    chip.reset();
    chip.setKeyboard(0);
    chip.evaluate(Object.fromEntries(Object.keys(chip.inputWidths).map((name) => [name, 0])));
    cycles = 0;
    runtimeError = '';
    invalidateTests();
    reflectPins();
  }

  function runTestScript(single = false, resume = false, interactive = false) {
    if (!chip || codeError) return;
    testError = '';
    const script = tstModel.getValue();
    if (
      !script
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '')
        .trim()
    ) {
      invalidateTests();
      return;
    }
    try {
      if (!interactive || !testIsInteractive || !resume || !testSession || testSession.done) {
        const target = interactive
          ? chip
          : compileHDL(hdlModel.getValue(), dependencyMap(dependencies));
        target.reset();
        target.evaluate(Object.fromEntries(Object.keys(chip.inputWidths).map((name) => [name, 0])));
        if (interactive) {
          cycles = 0;
          runtimeError = '';
        }
        testIsInteractive = interactive;
        testSession = createHDLTest(target, script, {
          compare: diffModel.modified.getValue().trim() || undefined,
          files: testFiles,
        });
      }
      if (single) testSession.step();
      else testSession.run(1000);
      testSession = testSession;
      diffModel.original.setValue(testSession.output);
      testStats =
        testSession.passed + testSession.failed > 0
          ? { passed: testSession.passed, total: testSession.passed + testSession.failed }
          : undefined;
      testStatus = `${testSession.status} · ${testSession.rows.length} output rows${testStats ? ` · ${testSession.passed} passed, ${testSession.failed} failed` : ''}`;
      testError = testSession.error ?? '';
    } catch (cause) {
      invalidateTests();
      testError = cause instanceof Error ? cause.message : String(cause);
    } finally {
      if (interactive) reflectPins();
    }
  }

  function reflectPins(syncInputs = true) {
    if (!chip) return;
    if (syncInputs)
      inputPins = Object.entries(chip.inputWidths).map(([name, width]) => ({
        name,
        width,
        value: chip!.inputs[name] ?? 0,
      }));
    outputPins = Object.entries(chip.outputWidths).map(([name, width]) => ({
      name,
      width,
      value: chip!.outputs[name] ?? 0,
    }));
    internalPins = Object.entries(chip.internalWidths).map(([name, width]) => ({
      name,
      width,
      value: chip!.internalValues[name] ?? 0,
    }));
    phase = chip.phase;
    revision += 1;
  }

  function dependenciesEdited() {
    queueMicrotask(() => {
      setup();
      runTestScript();
      checkIsDirty();
      persistDraft();
    });
  }

  async function uploadTestFiles(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    try {
      const files = Array.from(input.files ?? []);
      if (files.reduce((total, file) => total + file.size, 0) > 2000000)
        throw new Error('Keep test files below 2 MB total.');
      testFiles = {
        ...testFiles,
        ...Object.fromEntries(
          await Promise.all(files.map(async (file) => [file.name, await file.text()])),
        ),
      };
      invalidateTests();
      checkIsDirty();
      persistDraft();
    } catch (cause) {
      operationError = cause instanceof Error ? cause.message : String(cause);
    }
    input.value = '';
  }

  function restoreWorkshopDraft() {
    const draft = readWorkshopDraft(localStorage);
    if (!draft) return;
    // The workshop draft has its own canonical route, so it never overwrites an existing editor draft.
    location.assign('/tools/hardware-simulator/workshop-draft');
  }

  /**
   * Preloaded experiment
   */
  export let experiment: Experiment | undefined = undefined;
  /**
   * Should show experiment-level controls like Save/Open/Share
   */
  export let controls: boolean = true;
  /**
   * Should the content of the HDL be autosaved locally to prevent loss of progress
   */
  export let autoSaveHdlLocally: boolean = true;
  /**
   * Should the tests and output be in the assignment mode - meaning read-only
   */
  export let readOnlyAssignment: boolean = false;

  let monaco: typeof monacoApi;
  let editor: monacoApi.editor.IStandaloneCodeEditor | monacoApi.editor.IStandaloneDiffEditor;
  let hdlModel: monacoApi.editor.ITextModel;
  let hdlState: monacoApi.editor.ICodeEditorViewState;
  let tstModel: monacoApi.editor.ITextModel;
  let testsState: monacoApi.editor.ICodeEditorViewState;
  let diffModel: monacoApi.editor.IDiffEditorModel;
  let diffState: monacoApi.editor.IDiffEditorViewState;

  let chip: HDLCircuit | undefined;
  let dependencies: string[] = [];
  let testFiles: Record<string, string> = {};
  let view: 'split' | 'visual' | 'code' = 'split';
  let revision = 0;
  let phase: 'tick' | 'tock' = 'tock';
  let cycles = 0;
  let workshopDraftAvailable = false;
  let codeError = '';
  let testError = '';
  let runtimeError = '';
  let operationError = '';
  let initialized = false;
  let workspaceActive = true;
  let saveInFlight = false;
  let copyStatus = '';
  let storageNotice = '';
  $: error = codeError || testError || runtimeError || operationError;
  $: isBundledExample =
    !!experiment &&
    (experiment.id === 'workshop-draft' ||
      examples.some((example) => example.id === experiment?.id));
  let inputPins: { name: string; width: number; value: number | string }[] = [];
  let internalPins: { name: string; width: number; value: number }[] = [];
  let outputPins: { name: string; width: number; value: number }[] = [];

  let testSession: HDLTestSession | undefined;
  let testIsInteractive = false;
  let testStatus = '';
  let testStats: { total: number; passed: number } | undefined;

  let name = experiment?.name || 'Untitled Experiment';
  let visibility = experiment?.visibility || 'PUBLIC';

  let savingState: 'UNSAVED' | 'SAVING' | 'SAVED' | undefined = experiment ? 'SAVED' : undefined;
  async function save() {
    if (!initialized || saveInFlight || !workspaceActive) return;
    saveInFlight = true;
    savingState = 'SAVING';
    operationError = '';
    const savedId = isBundledExample ? undefined : experiment?.id;

    try {
      const response = await api<{ experiment: Experiment }>(`/experiments/${savedId || ''}`, {
        method: savedId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        body: JSON.stringify({
          name,
          code: hdlModel.getValue(),
          tests: tstModel.getValue(),
          compare: diffModel.modified.getValue(),
          type: experiment?.type || 'HARDWARE',
          visibility,
          ...(dependencies.length || experiment?.dependencies ? { dependencies } : {}),
          ...(Object.keys(testFiles).length || experiment?.testFiles ? { testFiles } : {}),
        } as ExperimentRequest),
      });

      if (!workspaceActive) return;
      experiment = response.experiment;
      // Shallow routing keeps the current editor and SvelteKit's history state intact.
      await goto(`/tools/hardware-simulator/${experiment.id}`, {
        shallow: true,
        replace: true,
        reset: false,
      });
      if (!workspaceActive) return;
      saveInFlight = false;
      checkIsDirty();
      persistDraft();
    } catch (e) {
      if (!workspaceActive) return;
      operationError = `Could not save: ${(e as Error)?.message || 'Unknown error'}`;
      savingState = 'UNSAVED';
    } finally {
      saveInFlight = false;
    }
  }

  async function download(e?: Event) {
    e?.preventDefault();
    if (!initialized) return;
    operationError = '';
    try {
      const target = document.createElement('a');
      const zip = await import('@zip.js/zip.js');
      zip.configure({ useWebWorkers: false });
      const archiveName = (name || 'experiment').replaceAll(/[^\w]/g, '-').toLocaleLowerCase();
      const chipName = (source: string, fallback: string) =>
        source
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\/\/[^\n]*/g, '')
          .match(/\bCHIP\s+([A-Za-z_][A-Za-z0-9_]*)/)?.[1] || fallback;
      const mainName = chipName(hdlModel.getValue(), 'Main');
      const files = new Map<string, string>();
      const add = (fileName: string, content: string) => {
        if (!/^[A-Za-z0-9_.-]+$/.test(fileName) || fileName === '.' || fileName === '..')
          throw new Error(`Use a plain filename for ${fileName} before downloading.`);
        if (files.has(fileName) && files.get(fileName) !== content)
          throw new Error(
            `Two project files are named ${fileName}. Rename one before downloading.`,
          );
        files.set(fileName, content);
      };
      add(`${mainName}.hdl`, hdlModel.getValue());
      add(`${mainName}.tst`, tstModel.getValue());
      add(`${mainName}.cmp`, diffModel.modified.getValue());
      dependencies.forEach((source, index) =>
        add(`${chipName(source, `Custom${index + 1}`)}.hdl`, source),
      );
      Object.entries(testFiles).forEach(([fileName, content]) => add(fileName, content));
      const blobWriter = new zip.BlobWriter('application/zip');
      const writer = new zip.ZipWriter(blobWriter);
      for (const [fileName, content] of files)
        await writer.add(fileName, new zip.TextReader(content));
      await writer.close();
      const url = URL.createObjectURL(await blobWriter.getData());
      target.href = url;
      target.download = `${archiveName}.zip`;
      document.body.append(target);
      target.click();
      target.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      operationError = `Could not download: ${cause instanceof Error ? cause.message : String(cause)}`;
    }
  }

  let removingState: boolean = false;
  async function remove() {
    // It was not even saved
    if (!experiment?.id || isBundledExample) {
      openNewExperiment();
      return;
    }

    removingState = true;

    try {
      await api(`/experiments/${experiment?.id}`, {
        method: 'DELETE',
        redirect: 'follow',
      });

      openNewExperiment();
    } catch (e) {
      operationError = `Could not delete: ${(e as Error)?.message || 'Unknown error'}`;
    }
    removingState = false;
  }

  async function getUserExperiments() {
    return (await api<{ experiments: { id: string; name: string }[] }>('/experiments')).experiments;
  }

  function checkIsDirty() {
    if (saveInFlight || !hdlModel || !tstModel || !diffModel) return;
    if (
      experiment?.name !== name ||
      experiment?.code !== hdlModel.getValue() ||
      experiment?.tests !== tstModel.getValue() ||
      experiment?.compare !== diffModel.modified.getValue() ||
      experiment?.visibility !== visibility ||
      JSON.stringify(experiment?.dependencies ?? []) !== JSON.stringify(dependencies) ||
      JSON.stringify(experiment?.testFiles ?? {}) !== JSON.stringify(testFiles)
    ) {
      if (savingState !== 'UNSAVED') {
        savingState = 'UNSAVED';
      }
    } else {
      savingState = 'SAVED';
    }
  }

  type LocalDraft = {
    hdl: string;
    tests?: string;
    compare?: string;
    name?: string;
    saved: string;
    dependencies?: string[];
    testFiles?: Record<string, string>;
  };
  const draftKey = () => `chipsandcode:hardware-tool:${experiment?.id || 'draft'}:v1`;
  function persistDraft() {
    if (!autoSaveHdlLocally || !initialized) return;
    try {
      localStorage.setItem(
        draftKey(),
        JSON.stringify({
          hdl: hdlModel.getValue(),
          tests: tstModel.getValue(),
          compare: diffModel.modified.getValue(),
          name,
          dependencies,
          testFiles,
          saved: new Date().toISOString(),
        }),
      );
      storageNotice = '';
    } catch {
      storageNotice = 'This browser cannot keep your draft. Download a copy to keep it.';
    }
  }
  function loadDraft(): LocalDraft | undefined {
    if (!autoSaveHdlLocally) return;
    try {
      const raw =
        localStorage.getItem(draftKey()) || (experiment && localStorage.getItem(experiment.id));
      if (!raw) return;
      const candidate = JSON.parse(raw);
      if (typeof candidate.hdl !== 'string' || typeof candidate.saved !== 'string') return;
      if (candidate.tests !== undefined && typeof candidate.tests !== 'string') return;
      if (candidate.compare !== undefined && typeof candidate.compare !== 'string') return;
      if (candidate.name !== undefined && typeof candidate.name !== 'string') return;
      if (
        candidate.dependencies !== undefined &&
        (!Array.isArray(candidate.dependencies) ||
          !candidate.dependencies.every((source: unknown) => typeof source === 'string'))
      )
        return;
      if (
        candidate.testFiles !== undefined &&
        (!candidate.testFiles ||
          typeof candidate.testFiles !== 'object' ||
          Array.isArray(candidate.testFiles) ||
          !Object.values(candidate.testFiles).every((source) => typeof source === 'string'))
      )
        return;
      const remoteAt = experiment && new Date(experiment.updated || experiment.created).valueOf();
      if (remoteAt && new Date(candidate.saved).valueOf() < remoteAt) return;
      return candidate;
    } catch {
      storageNotice = 'This browser cannot keep your draft. Download a copy to keep it.';
    }
  }
  function openNewExperiment() {
    try {
      localStorage.removeItem('chipsandcode:hardware-tool:draft:v1');
    } catch {
      /* Session still works. */
    }
    // Explicitly start a fresh editor, including after a shallow URL update on Save.
    location.assign('/tools/hardware-simulator');
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      copyStatus = 'Link copied';
    } catch {
      copyStatus = 'Select and copy the link above.';
    }
  }

  const EditorTab = { HDL: 0, TST: 1, DIFF: 2 } as const;
  type EditorTab = (typeof EditorTab)[keyof typeof EditorTab];
  const tabDescription: Record<EditorTab, string> = {
    [EditorTab.HDL]: 'Hardware Description Language',
    [EditorTab.TST]: 'Test Script',
    [EditorTab.DIFF]: 'Editable Expected and read-only Actual Output',
  };
  let selectedTab: EditorTab = EditorTab.HDL;
  function onTabChange({ detail }: { detail: EditorTab }) {
    if (!editor) return;
    const viewState = editor.saveViewState();
    if (viewState && editor.getModel() === hdlModel) {
      hdlState = viewState as monacoApi.editor.ICodeEditorViewState;
    } else if (viewState && editor.getModel() === tstModel) {
      testsState = viewState as monacoApi.editor.ICodeEditorViewState;
    } else if (viewState && 'original' in viewState) {
      diffState = viewState;
    }

    if (detail === EditorTab.DIFF) {
      const container = editor.getContainerDomNode();
      editor.dispose();

      selectedTab = detail;
      editor = monaco.editor.createDiffEditor(container, {
        ...editorOptions,
        automaticLayout: true,
        // Retain the standard textarea input path used by the existing keyboard workflows.
        editContext: false,
        enableSplitViewResizing: false,
      });
    } else if (selectedTab === EditorTab.DIFF) {
      const container = editor.getContainerDomNode();
      editor.dispose();

      selectedTab = detail;
      editor = monaco.editor.create(container, {
        ...editorOptions,
        automaticLayout: true,
        // Retain the standard textarea input path used by the existing keyboard workflows.
        editContext: false,
        wordBasedSuggestions: 'off',
      });
    }

    if (detail === EditorTab.DIFF) {
      const diffEditor = editor as monacoApi.editor.IStandaloneDiffEditor;

      diffEditor.setModel(diffModel);
      diffEditor.getOriginalEditor().updateOptions({ ariaLabel: 'Actual output, read-only' });
      diffEditor.getModifiedEditor().updateOptions({
        ariaLabel: readOnlyAssignment ? 'Expected output, read-only' : 'Expected output, editable',
      });
      if (diffState) diffEditor.restoreViewState(diffState);
    } else {
      const standaloneEditor = editor as monacoApi.editor.IStandaloneCodeEditor;

      if (detail === EditorTab.HDL) {
        standaloneEditor.setModel(hdlModel);
        if (hdlState) standaloneEditor.restoreViewState(hdlState);
      } else if (detail === EditorTab.TST) {
        standaloneEditor.setModel(tstModel);
        if (testsState) standaloneEditor.restoreViewState(testsState);
      }
    }

    selectedTab = detail;
    editor.updateOptions({
      readOnly: detail !== EditorTab.HDL && readOnlyAssignment,
    });

    editor.focus();
  }
</script>

<svelte:window
  on:keydown={(event) => {
    if (
      controls &&
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === 's' &&
      apiEnabled
    ) {
      event.preventDefault();
      void save();
    }
  }}
/>

<section
  class="hardware-workspace"
  aria-label="Hardware simulator workspace"
  data-ready={initialized}
>
  <header class="workspace-toolbar">
    <label class="experiment-title">
      <span>Experiment</span>
      <input
        type="text"
        bind:value={name}
        on:change={() => {
          checkIsDirty();
          persistDraft();
        }}
        disabled={!controls}
        maxlength="200"
        aria-label="Experiment name"
      />
    </label>
    {#if controls}
      <div class="file-actions">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="tool-button" aria-label="File"
            >File <span aria-hidden="true">⌄</span></DropdownMenu.Trigger
          >
          <DropdownMenu.Content sideOffset={8} align="end" class="hardware-menu">
            <DropdownMenu.Item onSelect={openNewExperiment} class="hardware-menu-item"
              >Open new</DropdownMenu.Item
            >
            {#if workshopDraftAvailable && experiment?.id !== 'workshop-draft'}
              <DropdownMenu.Item onSelect={restoreWorkshopDraft} class="hardware-menu-item"
                >Open workshop draft</DropdownMenu.Item
              >
            {/if}
            <div class="hardware-menu-label">Examples</div>
            {#each examples as example (example.id)}
              <DropdownMenu.Item>
                {#snippet child({ props })}
                  <a
                    {...props}
                    href={`/tools/hardware-simulator/${example.id}`}
                    class="hardware-menu-item">{example.name}</a
                  >
                {/snippet}
              </DropdownMenu.Item>
            {/each}
            {#if apiEnabled}
              <div class="hardware-menu-label">Saved on this device</div>
              {#await getUserExperiments()}
                <p class="hardware-menu-note" role="status">Loading experiments…</p>
              {:then savedExperiments}
                {#each savedExperiments as saved}
                  <DropdownMenu.Item>
                    {#snippet child({ props })}
                      <a
                        {...props}
                        href={`/tools/hardware-simulator/${saved.id}`}
                        class="hardware-menu-item">{saved.name}</a
                      >
                    {/snippet}
                  </DropdownMenu.Item>
                {:else}<p class="hardware-menu-note">No saved experiments yet.</p>{/each}
              {:catch cause}<p class="hardware-menu-note">
                  Saved experiments are unavailable. Your local work is still here.
                </p>{/await}
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        {#if apiEnabled}
          <button
            class="tool-button save-button"
            disabled={!initialized || savingState === 'SAVING'}
            on:click={save}
            title={isBundledExample ? 'Save a personal copy of this example' : 'Save experiment'}
            >{savingState === 'SAVING' ? 'Saving…' : 'Save'}</button
          >
          <Popover.Root>
            <Popover.Trigger
              class="tool-button"
              aria-label="Share"
              disabled={!experiment || savingState !== 'SAVED'}>Share</Popover.Trigger
            >
            <Popover.Content
              class="hardware-popover"
              align="end"
              sideOffset={8}
              aria-label="Share experiment"
            >
              <h2>Share this experiment</h2>
              {#if isBundledExample}
                <p>This is a bundled example. Save a copy to share your changes.</p>
              {:else}
                <label class="share-option">
                  <input
                    type="checkbox"
                    checked={visibility === 'PUBLIC'}
                    on:change={() => {
                      visibility = visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
                      checkIsDirty();
                    }}
                  />
                  <span>Anyone with a link can view</span>
                </label>
                {#if savingState !== 'SAVED'}<p>Save to apply your sharing preference.</p>{/if}
              {/if}
              <label class="share-link-label"
                >Experiment URL<input
                  readonly
                  value={typeof location !== 'undefined' ? location.href : ''}
                  aria-label="Experiment URL"
                /></label
              >
              <button class="tool-button" on:click={copyLink}>Copy link</button>
              <p role="status">{copyStatus}</p>
            </Popover.Content>
          </Popover.Root>
        {:else}
          <button class="tool-button" on:click={() => download()} disabled={!initialized}
            >Download</button
          >
        {/if}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger class="tool-button more-button" aria-label="More actions"
            >•••</DropdownMenu.Trigger
          >
          <DropdownMenu.Content class="hardware-menu" sideOffset={8} align="end">
            <DropdownMenu.Item
              disabled={!initialized}
              onSelect={() => download()}
              class="hardware-menu-item">Download .zip</DropdownMenu.Item
            >
            {#if apiEnabled && experiment && !isBundledExample}
              <DropdownMenu.Item onSelect={remove} disabled={removingState}>
                {#snippet child({ props })}<button
                    {...props}
                    class="hardware-menu-item destructive"
                    disabled={removingState}>{removingState ? 'Deleting…' : 'Delete'}</button
                  >{/snippet}
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    {/if}
  </header>

  <div class="simulation-toolbar">
    <label
      >View<select bind:value={view} aria-label="View"
        ><option value="split">Split</option><option value="visual">Visual</option><option
          value="code">Code</option
        ></select
      ></label
    >
    <button class="tool-button" on:click={advance} disabled={!chip}
      >{phase === 'tock' ? 'Tick' : 'Tock'}</button
    >
    <button class="tool-button" on:click={resetCircuit} disabled={!chip}>Reset</button>
    {#if chip}<span class="clock-status"
        >Clock {phase === 'tick' ? 'high' : 'low'} · {cycles} manual cycles</span
      >{/if}
  </div>
  <div class="workspace-grid" class:single={view !== 'split'}>
    <div class="editor-panel" class:hidden={view === 'visual'}>
      <Tabs.Root
        class="editor-tabs"
        value={String(selectedTab)}
        onValueChange={(value) => onTabChange({ detail: Number(value) as EditorTab })}
        activationMode="manual"
      >
        <Tabs.List class="editor-tab-list" aria-label="Editor views">
          <Tabs.Trigger value="0" class="editor-tab">HDL</Tabs.Trigger>
          <Tabs.Trigger value="1" class="editor-tab"
            >Tests
            {#if testStats}
              <span class="test-count" class:passing={testStats.passed === testStats.total}
                >{testStats.passed} / {testStats.total}</span
              >
            {/if}
          </Tabs.Trigger>
          <Tabs.Trigger value="2" class="editor-tab">Output</Tabs.Trigger>
        </Tabs.List>
        {#if selectedTab === EditorTab.DIFF}
          <p class="diff-labels">
            Compare actual output with expected values.{readOnlyAssignment
              ? ' Expected values are supplied.'
              : ' Expected values are editable.'}
          </p>
        {/if}
        <div
          class="editor-mount"
          role="region"
          use:monacoEditor
          aria-label={`${tabDescription[selectedTab]} editor`}
        ></div>
      </Tabs.Root>
      {#if selectedTab === EditorTab.TST || selectedTab === EditorTab.DIFF}
        <div class="test-toolbar">
          <button
            class="tool-button"
            disabled={!chip}
            on:click={() => runTestScript(false, true, true)}
            >{testSession && !testSession.done ? 'Continue test' : 'Run tests'}</button
          >
          <button
            class="tool-button"
            disabled={!chip}
            on:click={() => runTestScript(true, true, true)}>Step test</button
          >
          <button class="tool-button" disabled={!testSession} on:click={invalidateTests}
            >Restart test</button
          >
          <p role="status">{testStatus}</p>
          <p class="test-hint">
            Each batch runs up to 1,000 commands. A new test resets circuit state.
          </p>
        </div>
      {/if}
      <div class="editor-status" aria-live="polite">
        <span
          >{!initialized
            ? 'Loading editor…'
            : codeError
              ? 'Check the HDL'
              : chip
                ? `${chip.name} · compiled`
                : 'HDL · ready'}</span
        >
        <span
          >{storageNotice
            ? 'Draft not saved'
            : savingState === 'UNSAVED'
              ? 'Local draft'
              : savingState === 'SAVED'
                ? isBundledExample
                  ? 'Example'
                  : 'Saved'
                : 'Local workspace'}</span
        >
      </div>
      <details class="project-details">
        <summary
          >Your chip dependencies{dependencies.length ? ` · ${dependencies.length}` : ''}</summary
        >
        <p>
          Each custom chip has its own HDL definition and can be used as a part in your circuit.
        </p>
        {#each dependencies as source, index (index)}
          <label
            >Custom chip {index + 1}<textarea
              value={source}
              on:input={(event) => {
                dependencies[index] = event.currentTarget.value;
                dependenciesEdited();
              }}
              spellcheck="false"
              autocapitalize="off"
              aria-label={`Custom chip ${index + 1} HDL`}
            ></textarea></label
          >
          <button
            class="tool-button"
            on:click={() => {
              dependencies = dependencies.filter((_, i) => i !== index);
              dependenciesEdited();
            }}>Remove custom chip {index + 1}</button
          >
        {/each}
        <button
          class="tool-button"
          on:click={() => {
            dependencies = [
              ...dependencies,
              `CHIP Custom${dependencies.length + 1} {\n  IN in;\n  OUT out;\n  PARTS:\n  Not(in=in, out=out);\n}`,
            ];
            dependenciesEdited();
          }}>Add custom chip</button
        >
      </details>
      <details class="project-details">
        <summary>ROM and test files</summary>
        <p>
          Supply files referenced by a test script, such as a .hack program loaded into ROM32K.
          Files are saved with your experiment.
        </p>
        <label
          >Test files<input
            type="file"
            multiple
            accept=".hack,.asm,.tst,.cmp,.out"
            on:change={uploadTestFiles}
          /></label
        >
        {#if Object.keys(testFiles).length}
          <p>{Object.keys(testFiles).join(', ')}</p>
          <button
            class="tool-button"
            on:click={() => {
              testFiles = {};
              invalidateTests();
              checkIsDirty();
              persistDraft();
            }}>Clear test files</button
          >
        {/if}
      </details>
    </div>

    <aside class="signal-panel" class:hidden={view === 'code'} aria-label="Signal inspector">
      <div class="inspector-title">
        <h2>Signals</h2>
        <span>Bits &amp; buses</span>
      </div>
      {#if chip && !codeError}
        <p class="inspector-intro">Change an input. Follow its value through the circuit.</p>
        <table class="pin-table">
          <caption>Input pins</caption>
          <thead><tr><th scope="col">Pin</th><th scope="col">Value</th></tr></thead>
          <tbody>
            {#each inputPins as pin}
              <tr
                ><th scope="row"
                  >{pin.name}{#if pin.width > 1}<small>{pin.width} bits</small>{/if}</th
                ><td
                  ><input
                    type={pin.width === 1 ? 'number' : 'text'}
                    value={pin.value}
                    on:input={(event) => {
                      pin.value = event.currentTarget.value;
                      run();
                    }}
                    min="0"
                    max={2 ** pin.width - 1}
                    step="1"
                    required
                    aria-label={`Value for ${pin.name}`}
                  /></td
                ></tr
              >
            {/each}
          </tbody>
        </table>
        <table class="pin-table output-table">
          <caption>Output pins</caption>
          <thead><tr><th scope="col">Pin</th><th scope="col">Value</th></tr></thead>
          <tbody>
            {#each outputPins as pin}<tr
                ><th scope="row"
                  >{pin.name}{#if pin.width > 1}<small>{pin.width} bits</small>{/if}</th
                ><td
                  ><span
                    class="pin-value"
                    data-testid={`chip-output-${pin.name}`}
                    class:high={!runtimeError && pin.value === 1}
                    >{runtimeError ? '—' : pin.value}</span
                  ></td
                ></tr
              >{/each}
          </tbody>
        </table>
        {#if internalPins.length}
          <details class="internal-pins">
            <summary>Internal signals <span>{internalPins.length}</span></summary>
            <table class="pin-table">
              <caption class="sr-only">Internal pins</caption>
              <thead><tr><th scope="col">Pin</th><th scope="col">Value</th></tr></thead>
              <tbody
                >{#each internalPins as pin}<tr
                    ><th scope="row"
                      >{pin.name}{#if pin.width > 1}<small>{pin.width} bits</small>{/if}</th
                    ><td
                      ><span class="pin-value" class:high={!runtimeError && pin.value === 1}
                        >{runtimeError ? '—' : pin.value}</span
                      ></td
                    ></tr
                  >{/each}</tbody
              >
            </table>
          </details>
        {/if}
      {:else if error}
        <p class="inspector-intro">
          Simulation is paused. Repair the circuit to inspect its signals.
        </p>
      {:else}
        <div class="empty-circuit" aria-hidden="true">
          <span>in</span><i>CHIP</i><span>out</span>
        </div>
        <p class="inspector-intro">Describe a chip in HDL, or begin with a working example.</p>
        <a class="example-link" href="/tools/hardware-simulator/Xor"
          >Xor Gate <span aria-hidden="true">↗</span></a
        >
      {/if}
      <HardwarePeripherals circuit={chip} {revision} onupdate={reflectPins} />
      <details class="workspace-help">
        <summary>How this workspace works</summary>
        <p>
          <strong>HDL</strong> describes the chip and its connections. <strong>Tests</strong> sets
          inputs and checks each case. <strong>Output</strong> compares the actual result with the expected
          values.
        </p>
        <p>
          Use bits or whole buses, compose custom chips, and advance stored state with Tick and
          Tock. Code, tests, and live signals all describe the same circuit.
        </p>
        <a href="/learn/reference/boolean-logic/background#reading-hdl"
          >Read the HDL explanation ↗</a
        >
      </details>
    </aside>
  </div>

  {#if error}
    <div class="workspace-error" role="alert">
      <strong
        >{codeError
          ? 'Check the HDL'
          : testError
            ? 'Check the tests'
            : runtimeError
              ? 'Check the circuit'
              : 'Action could not finish'}</strong
      >
      <p>{error.split('\n')[0]}</p>
      {#if error.includes('\n')}<details>
          <summary>Diagnostic details</summary>
          <pre>{error}</pre>
        </details>{/if}
      {#if operationError && !codeError && !testError && !runtimeError}<button
          class="tool-button"
          aria-label="Dismiss"
          on:click={() => (operationError = '')}>Dismiss</button
        >{/if}
    </div>
  {/if}
  {#if storageNotice}<p class="storage-notice" role="status">{storageNotice}</p>{/if}
</section>

<style>
  .hardware-workspace {
    width: 100%;
    min-width: 0;
    color: #edf0fc;
    background: #10131f;
    border: 1px solid #414960;
    border-radius: 6px;
  }
  .workspace-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    padding: 18px 22px;
    border-bottom: 1px solid #414960;
    background: #151927;
  }
  .experiment-title {
    display: grid;
    gap: 5px;
    min-width: 0;
    flex: 1;
  }
  .experiment-title > span {
    color: #b9bfd3;
    font:
      11px ui-monospace,
      monospace;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .experiment-title input {
    width: 100%;
    min-width: 0;
    max-width: 560px;
    background: transparent;
    border: 0;
    border-bottom: 1px solid transparent;
    padding: 3px 0;
    color: #f3f3fc;
    font-size: 18px;
    line-height: 1.4;
    font-weight: 500;
  }
  .experiment-title input:hover {
    border-color: #777e97;
  }
  .experiment-title input:disabled {
    opacity: 1;
  }
  .file-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  :global(.hardware-workspace .tool-button),
  :global(.hardware-popover .tool-button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 40px;
    padding: 8px 13px;
    background: #202538;
    border: 1px solid #67708b;
    border-radius: 4px;
    color: #e8e9f5;
    font-size: 13px;
    line-height: 1.4;
    font-weight: 500;
    cursor: pointer;
  }
  :global(.hardware-workspace .tool-button:hover),
  :global(.hardware-popover .tool-button:hover) {
    background: #30364f;
    border-color: #b5aaff;
  }
  :global(.hardware-workspace .save-button) {
    color: #fff;
    background: #5145c4;
    border-color: #a193ff;
  }
  :global(.hardware-workspace .tool-button:disabled) {
    opacity: 0.55;
    cursor: not-allowed;
  }
  :global(.hardware-workspace .more-button) {
    font-weight: 700;
    letter-spacing: 2px;
    padding-inline: 12px;
  }
  :global(.hardware-workspace button:focus-visible),
  :global(.hardware-workspace input:focus-visible),
  :global(.hardware-workspace summary:focus-visible),
  :global(.hardware-workspace a:focus-visible),
  :global(.hardware-menu-item:focus-visible),
  :global(.hardware-popover input:focus-visible),
  :global(.hardware-popover button:focus-visible) {
    outline: 2px solid #c5bbff !important;
    outline-offset: 4px;
  }
  :global(.hardware-menu) {
    z-index: 80;
    max-height: min(600px, 75vh);
    overflow: auto;
    width: 270px;
    max-width: calc(100vw - 24px);
    background: #181d2d;
    color: #f1f0fb;
    border: 1px solid #69718a;
    border-radius: 5px;
    box-shadow: 0 20px 60px #0008;
    padding: 6px;
  }
  :global(.hardware-menu-item) {
    display: block;
    width: 100%;
    text-align: left;
    padding: 10px 12px;
    font-size: 13px;
    border-radius: 3px;
    cursor: pointer;
    color: #eceefa;
    overflow-wrap: anywhere;
  }
  :global(.hardware-menu-item[data-highlighted]) {
    background: #34304f;
    outline: none;
  }
  :global(.hardware-menu-item[data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  :global(.hardware-menu-item.destructive) {
    color: #ffb1b6;
  }
  :global(.hardware-menu-label) {
    color: #b7bfd6;
    border-top: 1px solid #41485e;
    margin-top: 5px;
    padding: 12px 12px 4px;
    font:
      11px ui-monospace,
      monospace;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  :global(.hardware-menu-note) {
    color: #b7bfd6;
    font-size: 12px;
    line-height: 1.6;
    margin: 7px 12px;
  }
  :global(.hardware-popover) {
    z-index: 80;
    width: 340px;
    max-width: calc(100vw - 24px);
    background: #181d2d;
    color: #f1f0fb;
    border: 1px solid #69718a;
    border-radius: 5px;
    box-shadow: 0 20px 60px #0008;
    padding: 20px;
  }
  :global(.hardware-popover h2) {
    margin: 0 0 16px;
    font-size: 17px;
    font-weight: 500;
  }
  :global(.hardware-popover p) {
    color: #c4c9db;
    font-size: 12px;
    line-height: 1.6;
    margin: 10px 0;
  }
  .share-option {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    margin-bottom: 18px;
  }
  .share-option input {
    accent-color: #9c8fff;
    width: 17px;
    height: 17px;
  }
  .share-link-label {
    display: block;
    color: #c4c9db;
    font-size: 12px;
    margin-bottom: 12px;
  }
  .share-link-label input {
    display: block;
    margin-top: 7px;
    width: 100%;
    background: #0d111b;
    border: 1px solid #69718a;
    color: #f0eff8;
    border-radius: 3px;
    padding: 10px;
    font-size: 12px;
  }
  .simulation-toolbar,
  .test-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    border-bottom: 1px solid #414960;
  }
  .simulation-toolbar label {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 14px;
  }
  .simulation-toolbar select {
    background: #202538;
    color: #edf0fc;
    border: 1px solid #77829c;
    border-radius: 4px;
    min-height: 44px;
    padding: 8px 30px 8px 12px;
  }
  .clock-status,
  .test-toolbar p {
    font:
      12px/1.7 ui-monospace,
      monospace;
    color: #c0c6d8;
  }
  .test-toolbar .test-hint {
    flex-basis: 100%;
    margin: 0;
  }
  .workspace-grid.single {
    grid-template-columns: minmax(0, 1fr);
  }
  .hidden {
    display: none;
  }
  .project-details {
    padding: 18px;
    border-top: 1px solid #414960;
  }
  .project-details summary {
    cursor: pointer;
    font-size: 14px;
  }
  .project-details p {
    color: #c0c6d8;
    font-size: 14px;
    line-height: 1.7;
    margin: 12px 0;
  }
  .project-details label {
    display: grid;
    gap: 8px;
    font-size: 14px;
    margin: 16px 0;
  }
  .project-details textarea {
    min-height: 180px;
    width: 100%;
    padding: 12px;
    background: #10131f;
    color: #edf0fc;
    border: 1px solid #77829c;
    font:
      14px/1.7 ui-monospace,
      monospace;
  }
  .project-details input {
    max-width: 100%;
  }
  .pin-table small {
    display: block;
    color: #b9bfd3;
    margin-top: 4px;
  }
  .workspace-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 290px;
  }
  .editor-panel {
    min-width: 0;
    border-right: 1px solid #414960;
  }
  :global(.editor-tabs) {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }
  :global(.editor-tab-list) {
    display: flex;
    gap: 5px;
    padding: 0 14px;
    border-bottom: 1px solid #414960;
    background: #151927;
  }
  :global(.editor-tab) {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 49px;
    padding: 10px 15px;
    border-bottom: 2px solid transparent;
    color: #bdc3d8;
    font-size: 13px;
    cursor: pointer;
  }
  :global(.editor-tab[data-state='active']) {
    border-color: #baadff;
    color: #f4f1ff;
  }
  :global(.editor-tab:hover) {
    color: #fff;
    background: #202538;
  }
  .test-count {
    font:
      11px ui-monospace,
      monospace;
    padding: 2px 5px;
    color: #ffb8b8;
    border: 1px solid #8f5b68;
    border-radius: 3px;
  }
  .test-count.passing {
    color: #a9edcd;
    border-color: #4b8c72;
  }
  .editor-mount {
    height: var(--tool-editor-height, 500px);
    min-height: 360px;
    min-width: 0;
    width: 100%;
  }
  .editor-status {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 18px;
    border-top: 1px solid #414960;
    color: #b9c1d8;
    font:
      11px/1.4 ui-monospace,
      monospace;
  }
  .diff-labels {
    margin: 0;
    padding: 8px 15px;
    font:
      11px/1.4 ui-monospace,
      monospace;
    color: #c3c7da;
    background: #202538;
  }
  .signal-panel {
    min-width: 0;
    padding: 22px;
  }
  .inspector-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .inspector-title h2 {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
  }
  .inspector-title > span {
    color: #b8b0ee;
    font:
      12px ui-monospace,
      monospace;
  }
  .inspector-intro {
    color: #bdc4da;
    font-size: 13px;
    line-height: 1.7;
    margin: 15px 0 25px;
  }
  .pin-table {
    width: 100%;
    border-collapse: collapse;
    font:
      13px ui-monospace,
      monospace;
    margin: 20px 0;
  }
  .pin-table caption {
    text-align: left;
    color: #d9ddeb;
    font-size: 12px;
    line-height: 1.5;
    margin: 0 0 12px;
  }
  .pin-table thead {
    font-size: 10px;
    color: #aeb8d1;
    text-transform: uppercase;
  }
  .pin-table th,
  .pin-table td {
    text-align: left;
    padding: 9px 7px;
    border-bottom: 1px solid #343d54;
  }
  .pin-table th {
    font-weight: 400;
    overflow-wrap: anywhere;
  }
  .pin-table th:last-child,
  .pin-table td:last-child {
    text-align: right;
  }
  .pin-table input {
    width: 100px;
    max-width: 100%;
    min-height: 36px;
    background: #1f263a;
    color: #f0ecff;
    border: 1px solid #75809c;
    border-radius: 3px;
    padding: 4px 8px;
  }
  .pin-value {
    display: inline-grid;
    place-items: center;
    min-width: 36px;
    padding: 0 6px;
    min-height: 30px;
    color: #c7cde0;
    border: 1px solid #69718a;
    border-radius: 3px;
    background: #151b2b;
  }
  .pin-value.high {
    border-color: #9f91ed;
    color: #e2daff;
    background: #32294e;
  }
  .internal-pins {
    margin-top: 20px;
    border-top: 1px solid #414960;
    padding-top: 15px;
  }
  .internal-pins summary {
    font-size: 12px;
    color: #c9cde0;
    cursor: pointer;
  }
  .internal-pins summary span {
    margin-left: 8px;
    color: #b7acff;
  }
  .workspace-help {
    border-top: 1px solid #414960;
    margin-top: 28px;
    padding-top: 16px;
  }
  .workspace-help summary {
    font-size: 12px;
    color: #c9cde0;
    cursor: pointer;
    line-height: 1.6;
  }
  .workspace-help p {
    font-size: 12px;
    line-height: 1.75;
    color: #bec5d9;
    margin: 13px 0;
  }
  .workspace-help a {
    font-size: 12px;
    color: #c5baff;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .empty-circuit {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 35px 0;
    color: #bfc6dc;
    font:
      11px ui-monospace,
      monospace;
  }
  .empty-circuit i {
    font-style: normal;
    border: 1px solid #8c80c0;
    padding: 20px 15px;
    color: #d2c7ff;
    position: relative;
  }
  .empty-circuit i::before,
  .empty-circuit i::after {
    content: '';
    position: absolute;
    width: 28px;
    height: 1px;
    background: #8c80c0;
    top: 50%;
  }
  .empty-circuit i::before {
    right: 100%;
  }
  .empty-circuit i::after {
    left: 100%;
  }
  .example-link {
    color: #c5baff;
    font-size: 13px;
    display: inline-flex;
    gap: 18px;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .workspace-error {
    padding: 18px 22px;
    background: #291a28;
    border-top: 1px solid #a76677;
    color: #ffd3da;
  }
  .workspace-error strong {
    font-size: 13px;
    font-weight: 600;
  }
  .workspace-error p,
  .workspace-error summary {
    font-size: 13px;
    line-height: 1.7;
    margin: 8px 0;
    overflow-wrap: anywhere;
  }
  .workspace-error summary {
    cursor: pointer;
  }
  .workspace-error pre {
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    max-height: 260px;
    overflow: auto;
  }
  .storage-notice {
    padding: 10px 22px;
    color: #f0ce91;
    font-size: 12px;
    line-height: 1.6;
  }
  :global(.monaco-line-decoration) {
    width: 4px !important;
    margin-left: 4px;
  }
  :global(.monaco-line-decoration.test-failed) {
    background: #ff9baf;
  }
  :global(.monaco-line-decoration.test-passed) {
    background: #88dfbd;
  }
  @media (min-width: 1500px) {
    .simulation-toolbar,
    .test-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-bottom: 1px solid #414960;
    }
    .simulation-toolbar label {
      display: flex;
      gap: 10px;
      align-items: center;
      font-size: 14px;
    }
    .simulation-toolbar select {
      background: #202538;
      color: #edf0fc;
      border: 1px solid #77829c;
      border-radius: 4px;
      min-height: 44px;
      padding: 8px 30px 8px 12px;
    }
    .clock-status,
    .test-toolbar p {
      font:
        12px/1.7 ui-monospace,
        monospace;
      color: #c0c6d8;
    }
    .test-toolbar .test-hint {
      flex-basis: 100%;
      margin: 0;
    }
    .workspace-grid.single {
      grid-template-columns: minmax(0, 1fr);
    }
    .hidden {
      display: none;
    }
    .project-details {
      padding: 18px;
      border-top: 1px solid #414960;
    }
    .project-details summary {
      cursor: pointer;
      font-size: 14px;
    }
    .project-details p {
      color: #c0c6d8;
      font-size: 14px;
      line-height: 1.7;
      margin: 12px 0;
    }
    .project-details label {
      display: grid;
      gap: 8px;
      font-size: 14px;
      margin: 16px 0;
    }
    .project-details textarea {
      min-height: 180px;
      width: 100%;
      padding: 12px;
      background: #10131f;
      color: #edf0fc;
      border: 1px solid #77829c;
      font:
        14px/1.7 ui-monospace,
        monospace;
    }
    .project-details input {
      max-width: 100%;
    }
    .pin-table small {
      display: block;
      color: #b9bfd3;
      margin-top: 4px;
    }
    .workspace-grid {
      grid-template-columns: minmax(0, 1fr) 340px;
    }
    .editor-mount {
      height: var(--tool-editor-height, 570px);
    }
  }
  @media (max-width: 800px) {
    .simulation-toolbar,
    .test-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-bottom: 1px solid #414960;
    }
    .simulation-toolbar label {
      display: flex;
      gap: 10px;
      align-items: center;
      font-size: 14px;
    }
    .simulation-toolbar select {
      background: #202538;
      color: #edf0fc;
      border: 1px solid #77829c;
      border-radius: 4px;
      min-height: 44px;
      padding: 8px 30px 8px 12px;
    }
    .clock-status,
    .test-toolbar p {
      font:
        12px/1.7 ui-monospace,
        monospace;
      color: #c0c6d8;
    }
    .test-toolbar .test-hint {
      flex-basis: 100%;
      margin: 0;
    }
    .workspace-grid.single {
      grid-template-columns: minmax(0, 1fr);
    }
    .hidden {
      display: none;
    }
    .project-details {
      padding: 18px;
      border-top: 1px solid #414960;
    }
    .project-details summary {
      cursor: pointer;
      font-size: 14px;
    }
    .project-details p {
      color: #c0c6d8;
      font-size: 14px;
      line-height: 1.7;
      margin: 12px 0;
    }
    .project-details label {
      display: grid;
      gap: 8px;
      font-size: 14px;
      margin: 16px 0;
    }
    .project-details textarea {
      min-height: 180px;
      width: 100%;
      padding: 12px;
      background: #10131f;
      color: #edf0fc;
      border: 1px solid #77829c;
      font:
        14px/1.7 ui-monospace,
        monospace;
    }
    .project-details input {
      max-width: 100%;
    }
    .pin-table small {
      display: block;
      color: #b9bfd3;
      margin-top: 4px;
    }
    .workspace-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .editor-panel {
      border-right: 0;
    }
    .signal-panel {
      border-top: 1px solid #414960;
    }
    .workspace-toolbar {
      padding: 15px;
      gap: 16px;
      align-items: flex-start;
      flex-direction: column;
    }
    .experiment-title {
      width: 100%;
    }
    .editor-mount {
      height: var(--tool-editor-height, 440px);
    }
    .file-actions {
      width: 100%;
    }
    .signal-panel {
      padding: 20px;
    }
    .pin-table {
      max-width: 400px;
    }
    .workspace-help {
      max-width: 600px;
    }
  }
  @media (max-width: 380px) {
    :global(.hardware-workspace .tool-button) {
      padding: 8px 10px;
      font-size: 12px;
    }
    :global(.editor-tab) {
      padding: 10px;
    }
    .workspace-toolbar {
      padding: 12px;
    }
    .signal-panel {
      padding: 16px;
    }
    .editor-status {
      font-size: 10px;
      padding: 10px 12px;
    }
  }
</style>

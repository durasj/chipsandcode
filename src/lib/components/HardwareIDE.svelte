<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import {
    Share,
    CheckCircle,
    EllipsisHorizontalCircle,
    ExclamationCircle,
    Play,
    EllipsisVertical,
    Trash,
    DocumentText,
    ArchiveBoxArrowDown,
    Plus,
    XMark,
  } from '@steeze-ui/heroicons';
  import {
    Menu,
    MenuButton,
    MenuItems,
    MenuItem,
    Popover,
    PopoverButton,
    PopoverPanel,
    TabGroup,
    TabList,
    Tab,
  } from '@rgossiaux/svelte-headlessui';
  import { createPopperActions } from 'svelte-popperjs';
  import type zipType from '@zip.js/zip.js';

  import { goto } from '$app/navigation';
  import parseHdl from '$lib/editor/hdl/parse';
  import parseTst from '$lib/editor/tst/parse';
  import type { Root as HDLRoot } from '$lib/editor/hdl/tree';
  import type { CompareNode, LoadNode, OutputNode, Root as TSTRoot } from '$lib/editor/tst/tree';
  import type Chip from '$lib/hardware-simulator/chips/Chip';
  import ChipFactory from '$lib/hardware-simulator/chips/ChipFactory';
  import type { Experiment, ExperimentRequest } from 'src/lib/shared';
  import type { monaco, monaco as monacoApi } from '$lib/editor';
  import { theme } from 'src/stores';
  import api from '$lib/api';
  import TestScript from '$lib/hardware-simulator/tests/TestScript';
  import InvalidDesignError from '../hardware-simulator/chips/InvalidDesignError';

  const [popperRef, popperContent] = createPopperActions();
  const popperOptions = {
    placement: 'bottom-end',
    strategy: 'fixed',
    modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
  };

  popperContent;

  function monacoEditor(node: HTMLElement) {
    (async () => {
      monaco = (await import('../editor')).monaco;

      // Prefer autosaved local data
      const content = loadLocal('hdl') || experiment?.code || '';

      hdlModel = monaco.editor.createModel(content, 'hdl');
      hdlModel.onDidChangeContent(() => {
        const valid = setup();

        if (valid) {
          checkIsDirty();

          runTestScript();
          run();
        }

        if (autoSaveHdlLocally) {
          saveLocally(hdlModel.getValue(), 'hdl');
        }
      });

      tstModel = monaco.editor.createModel(experiment?.tests || '', 'tst');
      tstModel.onDidChangeContent(() => {
        setupTestScript();
        checkIsDirty();

        runTestScript();
      });

      diffModel = {
        original: monaco.editor.createModel('', 'text/plain'),
        modified: monaco.editor.createModel(experiment?.compare || '', 'text/plain'),
      };
      diffModel.modified.onDidChangeContent(() => {
        checkIsDirty();

        runTestScript();
      });

      setup();
      setupTestScript();

      editor = monaco.editor.create(node, {
        theme: themeName ? `vs-${themeName}` : 'vs-light',
        automaticLayout: true,
        model: hdlModel,
        wordBasedSuggestions: false,
        accessibilityHelpUrl:
          'https://github.com/Microsoft/monaco-editor/wiki/Monaco-Editor-Accessibility-Guide',
      });

      if (experiment) {
        run();
        runTestScript();
      }
    })();

    return {
      destroy() {
        editor?.dispose();
      },
    };
  }

  const examples = [
    {
      id: 'nnDG6JRQjL0aNVb7AJHnmZrv02pHIINF',
      name: 'XOR Gate',
    },
    {
      id: '456',
      name: 'NOR Gate',
    },
  ];

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
    const value = hdlModel.getValue();

    let tree: HDLRoot | undefined;
    try {
      tree = parseHdl(value);

      monaco.editor.setModelMarkers(hdlModel, 'parser', []);
    } catch (e: any) {
      handleEditorError(e, hdlModel);

      return;
    }

    if (!tree?.[0]) {
      if (!!value) {
        monaco.editor.setModelMarkers(hdlModel, 'parser', [
          {
            startColumn: 1,
            startLineNumber: 1,
            endColumn: 1,
            endLineNumber: 1,
            severity: monaco.MarkerSeverity.Error,
            message: 'Expected at least one CHIP.',
          },
        ]);
      }
      return;
    }

    error = '';

    try {
      const chipFactory = new ChipFactory();
      chip = chipFactory.fromAST(tree[0]);
    } catch (e) {
      if (e instanceof InvalidDesignError) {
        error = e.message;
      } else {
        error = 'Loading of chip failed: ' + e;
      }

      return false;
    }

    reflectPins();

    return true;
  }

  function setupTestScript() {
    const value = tstModel.getValue();

    let tree: TSTRoot | undefined;
    try {
      tree = parseTst(value);

      monaco.editor.setModelMarkers(tstModel, 'parser', []);

      monaco.editor.setModelMarkers(tstModel, 'tests', []);
      testStats = undefined;
    } catch (e: any) {
      handleEditorError(e, tstModel);

      return;
    }

    if (!tree) return;

    const { preamble } = tree;

    const firstUnusedPreamble = preamble.find(
      (p) => p.type === 'compare' || p.type === 'load' || p.type === 'output',
    ) as LoadNode | OutputNode | CompareNode;
    if (firstUnusedPreamble) {
      const line = firstUnusedPreamble.file.line;
      const col = firstUnusedPreamble.file.col;
      monaco.editor.setModelMarkers(tstModel, 'tests', [
        {
          startColumn: col,
          startLineNumber: line,
          endColumn: col,
          endLineNumber: line,
          severity: monaco.MarkerSeverity.Info,
          message:
            'Specification of files is ignored. Only the loaded chip and comparison file specified via other tabs are used.',
        },
      ]);
    }

    tests = TestScript.fromAST(tree);
  }

  function run() {
    if (!chip) return;

    try {
      inputPins.forEach(({ name, value }) => {
        chip!.setInput(name, !!value);
      });

      chip.run();

      reflectPins();

      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : `Chip execution failed: ${e}`;
    }
  }

  function runTestScript() {
    if (!tests || !chip) return;

    try {
      const result = tests.run(chip, diffModel.modified.getValue(), (effect) => {
        if (effect.type === 'output') {
          diffModel.original.setValue(effect.output);
        }
      });

      reflectScriptResult(result);

      error = '';
    } catch (e) {
      error = e instanceof Error ? e.message : `Test execution failed: ${e}`;
    }
  }

  function reflectScriptResult(result: ReturnType<TestScript['run']>) {
    const oldDecorations = testStats?.decorations;
    testStats = undefined;
    const decorations = [];

    for (const instructions of result) {
      for (const instruction of instructions) {
        if (instruction.type === 'output') {
          const range = new monaco.Range(instruction.line, 0, instruction.line, 0);

          if ('error' in instruction && typeof instruction.error === 'string') {
            decorations.push({
              range,
              options: {
                isWholeLine: true,
                linesDecorationsClassName: 'bg-error monaco-line-decoration',
                hoverMessage: { value: 'Output comparison failed' },
              },
            });

            if (!testStats) {
              testStats = { passed: 0, total: 1, decorations: [] };
            } else {
              testStats.total++;
            }
          } else if ('error' in instruction && instruction.error === false) {
            decorations.push({
              range,
              options: {
                isWholeLine: true,
                linesDecorationsClassName: 'bg-success monaco-line-decoration',
                hoverMessage: { value: 'Output comparison passed' },
              },
            });

            if (!testStats) {
              testStats = { passed: 1, total: 1, decorations: [] };
            } else {
              testStats.passed++;
              testStats.total++;
            }
          }
        }
      }
    }

    if (testStats) {
      testStats.decorations = tstModel.deltaDecorations(oldDecorations || [], decorations);
    }
  }

  function reflectPins() {
    if (!chip) return;

    const input = [] as { name: string; value: number }[];
    const internal = [] as { name: string; value: number }[];
    const output = [] as { name: string; value: number }[];
    for (const [name, pin] of chip.getPins()) {
      if (pin.type === 'input') input.push({ name, value: pin.state ? 1 : 0 });
      if (pin.type === 'internal') internal.push({ name, value: pin.state ? 1 : 0 });
      if (pin.type === 'output') output.push({ name, value: pin.state ? 1 : 0 });
    }
    inputPins = input;
    internalPins = internal;
    outputPins = output;
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
  export let autoSaveHdlLocally: boolean = false;
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
  let diffModel: monaco.editor.IDiffEditorModel;
  let diffState: monacoApi.editor.IDiffEditorViewState;

  let chip: Chip | undefined;
  let error: string = '';
  let inputPins: { name: string; value: number }[] = [];
  let internalPins: { name: string; value: number }[] = [];
  let outputPins: { name: string; value: number }[] = [];

  let tests: TestScript | undefined;
  let testStats: { total: number; passed: number; decorations: string[] } | undefined;

  let name = experiment?.name || 'Untitled Experiment';
  let visibility = experiment?.visibility || 'PUBLIC';

  let savingState: 'UNSAVED' | 'SAVING' | 'SAVED' | undefined = experiment ? 'SAVED' : undefined;
  async function save() {
    savingState = 'SAVING';

    try {
      const response = await api<{ experiment: Experiment }>(
        `/experiments/${experiment?.id || ''}`,
        {
          method: experiment?.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          redirect: 'follow',
          body: JSON.stringify({
            name,
            code: hdlModel.getValue(),
            tests: tstModel.getValue(),
            compare: diffModel.modified.getValue(),
            type: experiment?.type || 'HARDWARE',
            visibility,
          } as ExperimentRequest),
        },
      );

      experiment = response.experiment;

      savingState = 'SAVED';
    } catch (e) {
      error = `Could not save: ${(e as Error)?.message || 'Unknown error'}`;
      savingState = 'UNSAVED';
    }
  }

  async function download(e: MouseEvent) {
    const target = e.target as HTMLAnchorElement;

    // Already triggered download
    if (target.download) return;

    e.preventDefault();

    if (!target) return;

    // We only import part to reduce chunk size by two thirds
    // @ts-ignore
    const zip = (await import('@zip.js/zip.js/lib/zip-no-worker-deflate.js')) as typeof zipType;
    zip.configure({ useWebWorkers: false });

    const fileName = experiment?.name.replaceAll(/[^\w]/g, '-').toLocaleLowerCase();

    const blobWriter = new zip.BlobWriter('application/zip');
    const writer = new zip.ZipWriter(blobWriter);
    await writer.add(`${fileName}.hdl`, new zip.TextReader(hdlModel.getValue()));
    await writer.add(`${fileName}.tst`, new zip.TextReader(tstModel.getValue()));
    await writer.close();
    const blob = await blobWriter.getData();

    const url = URL.createObjectURL(blob);

    target.href = url;
    target.download = `${fileName}.zip`;
    target.click();

    URL.revokeObjectURL(url);
    target.href = 'data:';
    target.download = '';
  }

  let removingState: boolean = false;
  async function remove() {
    // It was not even saved
    if (!experiment?.id) openNewExperiment();

    removingState = true;

    try {
      await api(`/experiment/${experiment?.id}`, {
        method: 'DELETE',
        redirect: 'follow',
      });

      openNewExperiment();
    } catch (e) {
      error = `Could not delete: ${(e as Error)?.message || 'Unknown error'}`;
    }
    removingState = false;
  }

  async function getUserExperiments() {
    return (await api<{ experiments: { id: string; name: string }[] }>('/experiments')).experiments;
  }

  function checkIsDirty() {
    if (
      experiment?.name !== name ||
      experiment?.code !== hdlModel.getValue() ||
      experiment?.tests !== tstModel.getValue() ||
      experiment?.compare !== diffModel.modified.getValue() ||
      experiment?.visibility !== visibility
    ) {
      if (savingState !== 'UNSAVED') {
        savingState = 'UNSAVED';
      }
    } else {
      savingState = 'SAVED';
    }
  }

  function saveLocally(content: string, type: 'hdl') {
    // Saving locally is possible only for drafts on existing experiments
    if (!experiment) return;

    const stored = localStorage.getItem(experiment.id);

    const newSave = {
      ...JSON.parse(stored || '{}'),
      [type]: content,
      saved: new Date().toISOString(),
    };

    localStorage.setItem(experiment.id, JSON.stringify(newSave));
  }

  function loadLocal(type: 'hdl') {
    // Saving locally is possible only for drafts on existing experiments
    if (!experiment) return;

    const stored = localStorage.getItem(experiment.id);
    if (!stored) return;

    const local = JSON.parse(stored);

    const localAt = new Date(local.saved);
    const remoteAt = new Date(experiment.modified || experiment.created);
    if (localAt.valueOf() < remoteAt.valueOf()) return;

    return local[type] as string;
  }

  function openNewExperiment() {
    const alreadyOnNew = location.pathname.match(/.*hardware-ide\/?$/);
    if (alreadyOnNew) {
      location.reload();
    } else {
      goto('/experiment/hardware-ide');
    }
  }

  let themeName: 'light' | 'dark';
  theme.subscribe((name) => {
    themeName = name;
    if (monaco) monaco.editor.setTheme(`vs-${name}`);
  });

  enum EditorTab {
    HDL = 0,
    TST = 1,
    DIFF = 2,
  }
  const tabDescription: Record<EditorTab, string> = {
    [EditorTab.HDL]: 'Hardware Description Language',
    [EditorTab.TST]: 'Test Script',
    [EditorTab.DIFF]: 'Editable Expected and read-only Actual Output',
  };
  let selectedTab = EditorTab.HDL;
  function onTabChange({ detail }: { detail: EditorTab }) {
    const viewState = editor.saveViewState();
    if (viewState && editor.getModel() === hdlModel) {
      hdlState = viewState as monaco.editor.ICodeEditorViewState;
    } else if (viewState && editor.getModel() === tstModel) {
      testsState = viewState as monaco.editor.ICodeEditorViewState;
    } else if (viewState && 'original' in viewState) {
      diffState = viewState;
    }

    if (detail === EditorTab.DIFF) {
      editor.dispose();

      selectedTab = detail;
      editor = monaco.editor.createDiffEditor(editor.getContainerDomNode(), {
        theme: themeName ? `vs-${themeName}` : 'vs-light',
        automaticLayout: true,
        enableSplitViewResizing: false,
      });
    } else if (selectedTab === EditorTab.DIFF) {
      editor.dispose();

      selectedTab = detail;
      editor = monaco.editor.create(editor.getContainerDomNode(), {
        theme: themeName ? `vs-${themeName}` : 'vs-light',
        automaticLayout: true,
        wordBasedSuggestions: false,
      });
    }

    if (detail === EditorTab.DIFF) {
      const diffEditor = editor as monacoApi.editor.IStandaloneDiffEditor;

      diffEditor.setModel(diffModel);
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

    editor.updateOptions({
      readOnly: detail !== EditorTab.HDL && readOnlyAssignment,
    });

    editor.focus();
  }
</script>

<svelte:window
  on:keydown={(e) => {
    if (e.ctrlKey && e.key === 's') {
      // Don't open default Save dialog
      e.preventDefault();
      save();
    }
  }}
/>

<div class="grid grid-cols-1 md:grid-cols-2 flex-grow">
  <div>
    <TabGroup class="flex flex-col h-full" manual on:change={onTabChange}>
      <TabList class="w-full">
        <Tab
          class={({ selected }) =>
            `p-3 text-sm font-semibold ${selected ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}>HDL</Tab
        >
        <Tab
          class={({ selected }) =>
            `p-3 text-sm font-semibold ${selected ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}
          >Tests {#if testStats?.passed}
            <div
              class="badge gap-2"
              class:badge-success={testStats.passed === testStats.total}
              class:badge-error={testStats.passed < testStats.total}
            >
              {testStats.passed} / {testStats.total}
            </div>
          {/if}
        </Tab>
        <Tab
          class={({ selected }) =>
            `p-3 text-sm font-semibold ${selected ? 'bg-zinc-100 dark:bg-zinc-900' : ''}`}
          >Output</Tab
        >
      </TabList>

      {#if selectedTab === EditorTab.DIFF}
        <div class="bg-zinc-100 dark:bg-zinc-900 flex justify-around" aria-hidden="true">
          {#if readOnlyAssignment}
            <span class="px-3 py-1">Actual output</span>
          {:else}
            <span class="px-3 py-1">Actual output - read-only</span>
          {/if}

          {#if readOnlyAssignment}
            <span class="px-3 py-1">Expected output</span>
          {:else}
            <span class="px-3 py-1">Expected output - editable</span>
          {/if}
        </div>
      {/if}

      <div use:monacoEditor class="grow" aria-label={`${tabDescription[selectedTab]} editor`} />
    </TabGroup>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 content-start">
    <div class="flex justify-between items-center p-4 md:col-span-3">
      <input
        class={`bg-inherit text-lg font-bold grow rounded-sm${
          controls ? ' hover:outline hover:outline-2 hover:outline-base-content' : ''
        }`}
        bind:value={name}
        on:change={checkIsDirty}
        disabled={!controls}
        title="Experiment name"
        aria-label="Experiment name"
      />

      {#if controls}
        <div class="mt-5 flex lg:mt-0 lg:ml-4 gap-2">
          <div class="join">
            <button
              class="btn btn-sm btn-outline rounded-r-none join-item"
              class:btn-warning={savingState === 'UNSAVED'}
              on:click={save}
              disabled={savingState === 'SAVING'}
              aria-live={savingState === 'SAVING' ? 'assertive' : 'off'}
              title={savingState === 'UNSAVED'
                ? 'You have unsaved changes'
                : savingState === 'SAVING'
                ? 'Saving changes...'
                : 'All changes are saved'}
            >
              {#if savingState === 'SAVED'}
                <Icon src={CheckCircle} class="-ml-1 mr-2 h-5 w-5" />

                Save
              {:else if savingState === 'SAVING'}
                <Icon src={EllipsisHorizontalCircle} class="-ml-1 mr-2 h-5 w-5" />

                Saving...
              {:else if savingState === 'UNSAVED'}
                <Icon src={ExclamationCircle} class="-ml-1 mr-2 h-5 w-5" />

                Save
              {:else}
                Save
              {/if}
            </button>

            <Menu>
              <MenuButton
                as="button"
                use={[popperRef]}
                class="btn btn-square btn-sm btn-outline rounded-none border-l-0 join-item"
                title="Open/New"
                aria-label="Open/New"
              >
                <Icon src={DocumentText} class="h-5" />
              </MenuButton>

              <MenuItems
                as="ul"
                use={[[popperContent, popperOptions]]}
                class="menu menu-compact bg-base-100 dark:bg-neutral w-56 p-1.5 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
              >
                {#await getUserExperiments()}
                  <MenuItem as="li" class="menu-title" aria-live="polite" aria-busy="true">
                    <span class="!text-base-content/60">Loading Your Experiments...</span></MenuItem
                  >
                {:then savedExperiments}
                  <MenuItem as="li" class="menu-title" aria-live="polite" aria-busy="false">
                    <span class="!text-base-content/60">Your Experiments</span>
                  </MenuItem>

                  {#each savedExperiments as saved}
                    <MenuItem as="li" let:active>
                      <a href="/experiment/hardware-ide/{saved.id}" class:active>{saved.name}</a>
                    </MenuItem>
                  {/each}
                {:catch error}
                  <MenuItem as="li" aria-live="polite" aria-busy="false"
                    ><span class="text-error">Loading failed: {error.message}</span></MenuItem
                  >
                {/await}

                <MenuItem as="li" let:active>
                  <button on:click={openNewExperiment} class:active
                    ><Icon src={Plus} class="h-5 w-5 text-primary dark:text-base-content" />Open new</button
                  >
                </MenuItem>

                <MenuItem as="li" class="menu-title">
                  <span class="!text-base-content/60">Examples</span>
                </MenuItem>
                {#each examples as example (example.id)}
                  <MenuItem as="li" let:active>
                    <a href="/experiment/hardware-ide/{example.id}" class:active>{example.name}</a>
                  </MenuItem>
                {/each}
              </MenuItems>
            </Menu>

            <Popover>
              <PopoverButton
                as="button"
                use={[popperRef]}
                class="btn btn-square btn-sm btn-outline rounded-none border-l-0 join-item"
                title="Share"
                aria-label="Share"
              >
                <Icon src={Share} class="h-5" />
              </PopoverButton>

              <PopoverPanel
                use={[[popperContent, popperOptions]]}
                class="bg-base-100 dark:bg-neutral rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 min-w-[20rem] p-4"
              >
                <div class="form-control">
                  <label class="label cursor-pointer">
                    <span class="label-text">Anyone with a link can view</span>
                    <input
                      type="checkbox"
                      class="toggle"
                      checked={visibility === 'PUBLIC'}
                      on:change={() => {
                        visibility = visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
                        checkIsDirty();
                      }}
                    />
                  </label>
                </div>

                <div class="input-group input-group-sm w-full">
                  <input
                    type="text"
                    readonly
                    class="input input-bordered input-sm"
                    value={location.href}
                  />
                  <button
                    class="btn btn-square btn-sm w-fit px-2"
                    on:click={() => navigator.clipboard.writeText(location.href)}>Copy link</button
                  >
                </div>
              </PopoverPanel>
            </Popover>

            <Menu>
              <MenuButton
                use={[popperRef]}
                class="btn btn-square btn-sm btn-outline rounded-l-none border-l-0 join-item"
                title="More actions"
                aria-label="More actions"
              >
                <Icon src={EllipsisVertical} class="h-5" />
              </MenuButton>

              <MenuItems
                as="ul"
                use={[[popperContent, popperOptions]]}
                class="menu menu-compact bg-base-100 dark:bg-neutral w-56 p-1.5 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
              >
                <MenuItem as="li" let:active>
                  <a href="data:" class:active on:click={download}>
                    <Icon
                      src={ArchiveBoxArrowDown}
                      class="h-5 w-5 text-primary dark:text-base-content"
                    /> Download</a
                  >
                </MenuItem>
                <!-- <MenuItem as="li" disabled let:active>
                <button type="button" class:active
                  ><Icon src={Cog} class="h-5 w-5 text-primary dark:text-base-content" /> Settings</button
                >
              </MenuItem> -->
                <MenuItem as="li" let:active>
                  <button
                    type="button"
                    class:active
                    on:click={remove}
                    disabled={removingState}
                    aria-live={removingState ? 'assertive' : 'off'}
                    ><Icon src={Trash} class="h-5 w-5 text-primary dark:text-base-content" />
                    {removingState ? 'Deleting...' : 'Delete'}</button
                  >
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      {/if}
    </div>

    {#if error}
      <div role="alert" class="self-stretch col-span-3 px-4">
        <div class="alert alert-error py-0 pr-0">
          <Icon src={ExclamationCircle} class="h-5 w-5" />
          <div class="sr-only">Error:</div>

          {error}

          <button
            class="btn btn-ghost btn-circle"
            on:click={() => (error = '')}
            title="Dismiss"
            aria-label="Dismiss"
          >
            <Icon src={XMark} class="h-5 w-5" />
          </button>
        </div>
      </div>
    {/if}

    {#if chip}
      <!-- TODO: Consider proper controls - run here is useless as it's done automatically -->
      {#if controls && 1 === Math.round(3)}
        <div class="flex justify-between items-center p-4 md:col-span-3">
          <div class="col-span-2">Chip {chip?.name}</div>

          <div class="col-span-2">
            <span class="sm:ml-3">
              <div class="join">
                <button class="btn btn-sm btn-outline btn-primary" on:click={run}>
                  <div class="sr-only">Run</div>

                  <Icon src={Play} theme="solid" class="h-5 w-5" />
                </button>
              </div></span
            >
          </div>
        </div>
      {/if}

      <div class="self-stretch pt-4 md:pl-4 md:pt-0">
        <table class="table-auto w-full">
          <thead>
            <tr>
              <th class="bg-base-200 border-base-200 rounded-t-md" colspan="2">Input Pins</th>
            </tr>
            <tr
              ><th class="border border-base-200 py-1 px-2">Name</th><th
                class="border border-base-200">Value</th
              ></tr
            >
          </thead>
          <tbody>
            {#each inputPins as pin}
              <tr>
                <td class="border border-base-200 py-1 px-2">{pin.name}</td>
                <td class="border border-base-200"
                  ><input
                    type="number"
                    bind:value={pin.value}
                    on:change={() => run()}
                    min="0"
                    max="1"
                    class="block w-full border-none py-1 px-2 bg-inherit hover:outline focus-visible:outline outline-base-content outline-2"
                  /></td
                >
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="self-stretch pt-4 md:pl-4 md:pt-0">
        <table class="table-auto w-full">
          <thead>
            <tr>
              <th class="bg-base-200 border-base-200 rounded-t-md" colspan="2">Internal Pins</th>
            </tr>
            <tr
              ><th class="border border-base-200 py-1 px-2">Name</th><th
                class="border border-base-200">Value</th
              ></tr
            >
          </thead>
          <tbody>
            {#each internalPins as pin}
              <tr>
                <td class="border border-base-200 py-1 px-2">{pin.name}</td>
                <td class="border border-base-200 py-1 px-2">{pin.value ? '1' : '0'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="self-stretch pt-4 pr-4 md:pl-4 md:pt-0">
        <table class="table-auto w-full">
          <thead>
            <tr>
              <th class="bg-base-200 border-base-200 rounded-t-md" colspan="2">Output Pins</th>
            </tr>
            <tr
              ><th class="border border-base-200 py-1 px-2">Name</th><th
                class="border border-base-200 py-1 px-2">Value</th
              ></tr
            >
          </thead>
          <tbody>
            {#each outputPins as pin}
              <tr>
                <td class="border border-base-200 py-1 px-2">{pin.name}</td>
                <td class="border border-base-200 py-1 px-2">{pin.value ? '1' : '0'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else if controls}
      <div class="italic md:col-span-3 p-4">
        Add CHIP to start or check one of the examples like the <a
          href="/experiment/hardware-ide/{examples.find((e) => e.name === 'XOR Gate')?.id}"
          class="link">XOR Gate</a
        >.
      </div>
    {/if}
  </div>
</div>

<style>
  :global(.monaco-line-decoration) {
    @apply !w-1 ml-1;
  }
</style>

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import BenchMachine from './BenchMachine.svelte';
  import NandDiscovery from './NandDiscovery.svelte';
  import { getMission, truthTable, type GateKind } from './missions';
  import {
    availableSources,
    createCircuit,
    fromHDL,
    toHDLDraft,
    gatePins,
    isCircuitDraft,
    simulateCircuit,
    testCircuit,
    type Circuit,
  } from './circuit';

  export let missionId: string;
  export let completed: string[] = [];
  export let oncomplete: (id: string) => void;
  export let onclose: () => void;

  const mission = getMission(missionId);
  const scenarios = truthTable(mission);
  const draftKey = `chipsandcode:workbench:draft:${missionId}:v2`;
  const legacyDraftKey = `chipsandcode:signal-isles:draft:${missionId}:v1`;
  type EditorMode = 'visual' | 'split' | 'code';
  let editorMode: EditorMode = 'visual';
  let code =
    missionId === 'nand'
      ? 'CHIP Nand {\n    IN a, b;\n    OUT out;\n\n    // Supplied primitive. Other chips are built from parts.\n    BUILTIN Nand;\n}'
      : toHDLDraft(mission, createCircuit(mission));
  let codeError = '';
  let codeScroll = 0;
  let undoCode = '';
  let undoCodeError = '';
  let circuit: Circuit = createCircuit(mission);
  let inputValues: Record<string, boolean> = Object.fromEntries(
    mission.inputs.map((pin) => [pin, false]),
  );
  let report: ReturnType<typeof testCircuit> | null = null;
  let reportError = '';
  let hintCount = 0;
  let showGuide = false;
  let remembered = false;
  let saveNotice = '';
  let restoreReady = false;
  let copied = false;
  let selectedSource = '';
  let wiringMessage = 'Choose a source dot, then a destination pin to connect them.';
  let undoCircuit: Circuit | null = null;
  let missionHeading: HTMLHeadingElement;
  let continueButton: HTMLButtonElement | undefined = undefined;
  $: guidedInstruction = nextBuildInstruction(
    circuit,
    selectedSource,
    report?.success === true,
    !!live.result,
    live.error,
    codeError,
    wiringMessage,
  );

  function nextBuildInstruction(
    value: Circuit,
    source: string,
    passed: boolean,
    runnable: boolean,
    simulationError: string,
    sourceError: string,
    currentWiringMessage: string,
  ) {
    if (sourceError) return 'Fix the HDL error above to resume the circuit.';
    const outputsConnected = mission.outputs.every((pin) => !!value.outputs[pin]);
    if (outputsConnected) {
      for (const [index, gate] of value.gates.entries()) {
        const missingPin = gatePins(gate.type).find((pin) => !gate.inputs[pin]);
        if (missingPin)
          return `Part ${index + 1} (${gate.type}) still needs input ${missingPin}. Connect it, or remove that part in Connections.`;
      }
      if (!runnable && simulationError) return `Check the connections: ${simulationError}`;
    }
    if (missionId !== 'not' || completed.includes('not')) return currentWiringMessage;
    if (passed) return 'Both input values work. Your first circuit is ready.';
    if (!value.gates.length) return 'Start by adding one NAND gate above.';
    const part = value.gates[0];
    if (!part.inputs.a)
      return source === 'in'
        ? 'Now select pin a on the left of the NAND gate.'
        : 'Select the dot beside input in. It is the source of your signal.';
    if (!part.inputs.b)
      return source === 'in'
        ? 'Connect that same input to pin b. One source can feed both pins.'
        : 'Select input in again, then connect it to pin b on the NAND gate.';
    if (!value.outputs.out)
      return source === part.id
        ? 'Now select the output circle on the right to finish the connection.'
        : 'Select the output dot on the right of the NAND gate.';
    if (!runnable)
      return simulationError
        ? `Check the connections: ${simulationError}`
        : 'Complete every connection before testing.';
    return 'The circuit is connected. Test it with both possible input values.';
  }

  $: live = codeError
    ? { result: null, error: 'Fix the HDL error to resume the simulation.' }
    : inspect(circuit, inputValues);
  $: liveSignals = live.result?.signals ?? { ...inputValues };
  $: schematicRows = Math.max(1, Math.ceil(circuit.gates.length / 3));
  $: schematicHeight = Math.max(330, 155 + schematicRows * 172);
  $: restoreReady = !codeError && report?.success === true;

  onMount(() => {
    try {
      const preferred = localStorage.getItem('chipsandcode:workbench:mode');
      if (preferred === 'visual' || preferred === 'split' || preferred === 'code')
        editorMode = preferred;
      const saved = localStorage.getItem(draftKey);
      if (saved && missionId !== 'nand') {
        const candidate = JSON.parse(saved);
        if (
          candidate?.version === 2 &&
          isCircuitDraft(mission, candidate.circuit) &&
          typeof candidate.source === 'string' &&
          candidate.source.length < 100000
        ) {
          circuit = candidate.circuit;
          code = candidate.source;
          try {
            const parsed = fromHDL(mission, code);
            if (code !== toHDLDraft(mission, circuit)) circuit = parsed;
          } catch (error) {
            codeError = error instanceof Error ? error.message : 'Check your HDL syntax.';
          }
        }
      } else if (missionId !== 'nand') {
        const legacy = localStorage.getItem(legacyDraftKey);
        if (legacy) {
          const candidate: unknown = JSON.parse(legacy);
          if (isCircuitDraft(mission, candidate)) {
            circuit = candidate;
            code = toHDLDraft(mission, circuit);
          }
        }
      }
    } catch {
      saveNotice = 'Draft storage is unavailable. Your work is kept for this session.';
    }
    remembered = true;
    missionHeading?.focus();
  });

  function setMode(mode: EditorMode) {
    editorMode = mode;
    try {
      localStorage.setItem('chipsandcode:workbench:mode', mode);
    } catch {
      /* Editor preference is optional. */
    }
  }

  function editCode(source: string) {
    code = source;
    report = null;
    reportError = '';
    copied = false;
    undoCircuit = null;
    selectedSource = '';
    try {
      circuit = fromHDL(mission, source);
      codeError = '';
    } catch (error) {
      codeError = error instanceof Error ? error.message : 'Check your HDL syntax.';
    }
    save();
  }

  function useLastCircuit() {
    code = toHDLDraft(mission, circuit);
    codeError = '';
    report = null;
    reportError = '';
    save();
  }

  function inspect(value: Circuit, inputs: Record<string, boolean>) {
    try {
      return { result: simulateCircuit(mission, value, inputs), error: '' };
    } catch (error) {
      return {
        result: null,
        error:
          error instanceof Error ? error.message : 'Complete the connections to see a live signal.',
      };
    }
  }

  function save() {
    if (!remembered || missionId === 'nand') return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ version: 2, circuit, source: code }));
      saveNotice = 'Draft saved on this device';
    } catch {
      saveNotice = 'This draft could not be saved. Keep this page open to continue.';
    }
  }

  function changed(keepUndo = false) {
    circuit = { ...circuit, gates: [...circuit.gates], outputs: { ...circuit.outputs } };
    if (!keepUndo) undoCircuit = null;
    report = null;
    reportError = '';
    codeError = '';
    copied = false;
    code = toHDLDraft(mission, circuit);
    save();
  }

  function addGate(type: GateKind) {
    if (codeError || circuit.gates.length >= 24) return;
    let number = 1;
    while (circuit.gates.some((gate) => gate.id === `g${number}`)) number++;
    circuit.gates.push({
      id: `g${number}`,
      type,
      inputs: Object.fromEntries(gatePins(type).map((pin) => [pin, ''])),
    });
    changed();
  }

  function removeGate(id: string) {
    if (codeError) return;
    if (selectedSource === id) selectedSource = '';
    circuit.gates = circuit.gates
      .filter((gate) => gate.id !== id)
      .map((gate) => ({
        ...gate,
        inputs: Object.fromEntries(
          Object.entries(gate.inputs).map(([pin, source]) => [pin, source === id ? '' : source]),
        ),
      }));
    circuit.outputs = Object.fromEntries(
      Object.entries(circuit.outputs).map(([pin, source]) => [pin, source === id ? '' : source]),
    );
    changed();
  }

  function setConnection(gateId: string, pin: string, source: string) {
    if (codeError) return;
    const gate = circuit.gates.find((part) => part.id === gateId);
    if (gate) gate.inputs[pin] = source;
    changed();
  }

  function setOutput(pin: string, source: string) {
    if (codeError) return;
    circuit.outputs[pin] = source;
    changed();
  }

  function toggleInput(pin: string) {
    inputValues = { ...inputValues, [pin]: !inputValues[pin] };
  }

  function sourceLabel(source: string) {
    if (mission.inputs.includes(source)) return `Input ${source}`;
    const index = circuit.gates.findIndex((gate) => gate.id === source);
    return index >= 0 ? `${index + 1}. ${circuit.gates[index].type} output` : source;
  }

  function gatePosition(index: number) {
    return { x: 210 + (index % 3) * 206, y: 102 + Math.floor(index / 3) * 172 };
  }

  function sourcePosition(source: string) {
    const inputIndex = mission.inputs.indexOf(source);
    if (inputIndex >= 0) return { x: 76, y: 105 + inputIndex * 76 };
    const gateIndex = circuit.gates.findIndex((gate) => gate.id === source);
    const position = gatePosition(Math.max(gateIndex, 0));
    return { x: position.x + 132, y: position.y + 55 };
  }

  function wire(source: string, x: number, y: number) {
    const from = sourcePosition(source);
    const bend = Math.max(30, Math.abs(x - from.x) * 0.45);
    return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${x - bend} ${y}, ${x} ${y}`;
  }

  function signal(source: string, signals: Record<string, boolean>): boolean | null {
    return signals[source] ?? null;
  }

  function selectSource(source: string) {
    if (codeError) return;
    if (missionId === 'nand') {
      if (mission.inputs.includes(source)) toggleInput(source);
      return;
    }
    selectedSource = selectedSource === source ? '' : source;
    wiringMessage = selectedSource
      ? `${sourceLabel(source)} selected. Choose a part’s input pin or a chip output.`
      : 'Choose a source dot, then a destination pin to connect them.';
  }

  function connectPin(gateId: string, pin: string) {
    if (codeError) return;
    if (!selectedSource) {
      wiringMessage = 'First choose an input source or the dot on the right of a part.';
      return;
    }
    if (!availableSources(mission, circuit, gateId).includes(selectedSource)) {
      wiringMessage = 'Signals travel forward. Choose a chip input or a part earlier on the board.';
      return;
    }
    setConnection(gateId, pin, selectedSource);
    wiringMessage = `${sourceLabel(selectedSource)} connected to ${sourceLabel(gateId).replace(' output', '')}, pin ${pin}. You can connect it to another pin, too.`;
  }

  function connectOutput(pin: string) {
    if (codeError) return;
    if (missionId === 'nand') return;
    if (!selectedSource) {
      wiringMessage = 'Choose an input source or a part’s output dot first, then the chip output.';
      return;
    }
    setOutput(pin, selectedSource);
    wiringMessage = `${sourceLabel(selectedSource)} now feeds chip output ${pin}. Try a signal or test your circuit.`;
  }

  async function runTests() {
    reportError = '';
    if (codeError) {
      reportError = codeError;
      report = null;
      return;
    }
    try {
      report = testCircuit(mission, circuit);
      if (report.success) {
        await tick();
        continueButton?.focus();
      }
      if (!report.success) {
        const firstFailure = report.rows.find((row) => !row.passed);
        if (firstFailure) inputValues = { ...firstFailure.inputs };
      }
    } catch (error) {
      report = null;
      reportError =
        error instanceof Error
          ? error.message
          : 'Some connections are missing. Inspect the board and try again.';
    }
  }

  function resetBoard() {
    undoCircuit = JSON.parse(JSON.stringify(circuit)) as Circuit;
    undoCode = code;
    undoCodeError = codeError;
    circuit = createCircuit(mission);
    report = null;
    reportError = '';
    selectedSource = '';
    changed(true);
  }

  function undoClear() {
    if (!undoCircuit) return;
    circuit = undoCircuit;
    code = undoCode;
    codeError = undoCodeError;
    undoCircuit = null;
    report = null;
    reportError = '';
    selectedSource = '';
    copied = false;
    save();
  }

  async function copyHDL() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
    } catch {
      copied = false;
    }
  }
</script>

{#if missionId === 'nand'}
  <NandDiscovery oncomplete={() => oncomplete(missionId)} {onclose} />
{:else}
  <section class="bench" aria-label={`${mission.chip} workbench`}>
    <header class="bench-header">
      <button class="world-back" on:click={onclose}><span aria-hidden="true">←</span> Home</button>
      <button
        class="notes-trigger"
        aria-expanded={showGuide}
        on:click={() => (showGuide = !showGuide)}>Help</button
      >
    </header>

    {#if showGuide}<section class="field-guide">
        <div class="instrument-heading">
          <span class="eyebrow">REFERENCE</span><button
            aria-label="Close reference"
            on:click={() => (showGuide = false)}>×</button
          >
        </div>
        <h2>{mission.chip}, under the hood.</h2>
        <p>{mission.explanation}</p>
        <a href="/learn/reference/boolean-logic/background"
          >Read the full background <span aria-hidden="true">↗</span></a
        ><a href="/learn/reference/boolean-logic/project"
          >Gate specifications <span aria-hidden="true">↗</span></a
        >
      </section>{/if}

    <div class="mission-title-row">
      <div>
        <p class="eyebrow">
          CHALLENGE {String(mission.number).padStart(2, '0')} <span> / </span>
          {mission.location}
        </p>
        <h1 tabindex="-1" bind:this={missionHeading}>{mission.title}</h1>
        <p class="mission-brief">{mission.goal}</p>
      </div>
    </div>

    {#if live.result}
      <div class="signal-inputs" aria-label="Live input switches">
        <span class="switch-label">INPUT SIGNALS</span>
        {#each mission.inputs as pin}
          <button
            class:input-on={inputValues[pin]}
            class="input-switch"
            aria-pressed={inputValues[pin]}
            on:click={() => toggleInput(pin)}
            ><span>{pin}</span><span class="switch-track"><i></i></span><strong
              >{Number(inputValues[pin])}</strong
            ></button
          >
        {/each}
      </div>
    {/if}
    <div class="editor-toolbar">
      <label class="view-choice">
        <span class="sr-only">Editor view</span>
        <select
          aria-label="Editor view"
          value={editorMode}
          on:change={(event) => setMode(event.currentTarget.value as EditorMode)}
        >
          <option value="visual">Visual</option>
          <option value="code">Code</option>
          <option value="split">Split</option>
        </select>
      </label>
      <div class="toolbar-actions">
        {#if codeError || reportError || report}
          <span
            class="toolbar-status"
            class:status-error={!!codeError ||
              !!reportError ||
              (report !== null && !report.success)}
            aria-live="polite"
          >
            {codeError
              ? 'Check the code'
              : reportError
                ? 'Check the connections'
                : report
                  ? `${report.passed} / ${report.total} pass`
                  : ''}
          </span>
        {/if}
        {#if restoreReady}
          <button
            class="toolbar-save"
            bind:this={continueButton}
            on:click={() => oncomplete(missionId)}
            >Continue <span aria-hidden="true">→</span></button
          >
        {:else if live.result || codeError || reportError}
          <button class="test-button" disabled={!!codeError || !live.result} on:click={runTests}
            >Test circuit</button
          >
        {/if}
      </div>
    </div>
    {#if codeError}
      <div class="code-error" role="alert">
        <div>
          <strong>HDL could not be applied.</strong>
          <p>{codeError}</p>
          <span>Your source is preserved. Simulation is paused until it compiles.</span>
        </div>
        <button on:click={useLastCircuit}>Use last valid circuit</button>
      </div>
    {/if}
    <div class="bench-layout">
      <div class="workspace" class:split-view={editorMode === 'split'}>
        {#if editorMode !== 'code'}
          <div class="visual-workspace" class:paused={!!codeError}>
            <div class="board-shell">
              <div class="board-heading">
                <span>Circuit</span>
                <div class="part-buttons">
                  {#each mission.availableParts as type}<button
                      on:click={() => addGate(type)}
                      disabled={!!codeError || circuit.gates.length >= 24}
                      ><span aria-hidden="true">＋</span><strong>{type}</strong></button
                    >{/each}
                </div>
              </div>

              {#if missionId !== 'nand'}
                <div class="wiring-instruction">
                  <span aria-hidden="true">⌁</span>
                  <p aria-live="polite">{guidedInstruction}</p>
                  {#if selectedSource}<button
                      on:click={() => {
                        selectedSource = '';
                        wiringMessage =
                          'Choose a source dot, then a destination pin to connect them.';
                      }}>Cancel wire</button
                    >{/if}
                </div>
              {/if}
              <div class="circuit-viewport">
                <svg
                  class="circuit-svg"
                  viewBox={`0 0 900 ${schematicHeight}`}
                  role="group"
                  aria-label={`Interactive circuit with ${circuit.gates.length} parts. Select a source dot, then a destination input pin. Connection menus are also available below.`}
                >
                  <defs>
                    <pattern id="bench-grid" width="22" height="22" patternUnits="userSpaceOnUse"
                      ><circle cx="2" cy="2" r="1" fill="#70758c" opacity=".35" /></pattern
                    >
                    <filter id="bench-glow"><feGaussianBlur stdDeviation="4" /></filter>
                  </defs>
                  <rect x="0" y="0" width="900" height={schematicHeight} fill="url(#bench-grid)" />
                  <text x="35" y="35" class="diagram-label">INPUT</text>
                  <text x="767" y="35" class="diagram-label">OUTPUT</text>
                  {#each circuit.gates as gate, index}
                    {@const position = gatePosition(index)}
                    {#each gatePins(gate.type) as pin, pinIndex}
                      {#if gate.inputs[pin]}
                        <path
                          d={wire(gate.inputs[pin], position.x, position.y + 25 + pinIndex * 60)}
                          class="circuit-wire"
                          class:wire-on={signal(gate.inputs[pin], liveSignals) === true}
                        />
                      {/if}
                    {/each}
                  {/each}
                  {#each mission.outputs as pin, index}
                    {#if circuit.outputs[pin]}
                      <path
                        d={wire(circuit.outputs[pin], 795, 125 + index * 106)}
                        class="circuit-wire"
                        class:wire-on={signal(circuit.outputs[pin], liveSignals) === true}
                      />
                    {/if}
                  {/each}
                  {#each mission.inputs as pin, index}
                    <g transform={`translate(38, ${85 + index * 76})`}>
                      <rect
                        width="38"
                        height="40"
                        rx="8"
                        fill={inputValues[pin] ? '#4f46e5' : '#242735'}
                        stroke={inputValues[pin] ? '#a39bff' : '#50566d'}
                      />
                      <text
                        x="19"
                        y="26"
                        text-anchor="middle"
                        fill={inputValues[pin] ? '#fff' : '#adb1c3'}
                        font-family="monospace"
                        font-size="20">{Number(inputValues[pin])}</text
                      >
                      <text x="19" y="58" text-anchor="middle" class="diagram-label">{pin}</text>
                      <circle cx="38" cy="20" r="4" fill="#8b83ff" />
                      <foreignObject x="10" y="-8" width="56" height="56">
                        <button
                          class="svg-pin-button source-pin"
                          class:source-selected={selectedSource === pin}
                          aria-pressed={missionId === 'nand'
                            ? inputValues[pin]
                            : selectedSource === pin}
                          aria-label={missionId === 'nand'
                            ? `Toggle input ${pin}`
                            : `Select source input ${pin}`}
                          on:click={() => selectSource(pin)}><span></span></button
                        >
                      </foreignObject>
                    </g>
                  {/each}
                  {#each circuit.gates as gate, index}
                    {@const position = gatePosition(index)}
                    <g transform={`translate(${position.x}, ${position.y})`}>
                      <rect
                        x="0"
                        y="5"
                        width="132"
                        height="110"
                        rx="9"
                        fill="#07080e"
                        opacity=".12"
                      />
                      <rect width="132" height="110" rx="9" fill="#1d2031" stroke="#5c568d" />
                      <path
                        d="M 14 -6 v 6 M 34 -6 v 6 M 54 -6 v 6 M 74 -6 v 6 M 94 -6 v 6 M 114 -6 v 6 M 14 110 v 6 M 34 110 v 6 M 54 110 v 6 M 74 110 v 6 M 94 110 v 6 M 114 110 v 6"
                        stroke="#8b83ff"
                        stroke-width="4"
                      />
                      <text
                        x="66"
                        y="46"
                        text-anchor="middle"
                        fill="#f0eefc"
                        font-size="20"
                        font-weight="700"
                        font-family="monospace">{gate.type.toUpperCase()}</text
                      >
                      <text
                        x="66"
                        y="65"
                        text-anchor="middle"
                        fill="#a1a5b6"
                        font-size="14"
                        font-family="monospace">PART {String(index + 1).padStart(2, '0')}</text
                      >
                      {#each gatePins(gate.type) as pin, pinIndex}
                        <circle
                          cx="0"
                          cy={25 + pinIndex * 60}
                          r="4"
                          fill={signal(gate.inputs[pin], liveSignals) === true
                            ? '#b4acff'
                            : '#8b83ff'}
                        />
                        <text x="12" y={29 + pinIndex * 60} class="diagram-pin gate-pin-label"
                          >{pin}</text
                        >
                        {#if missionId !== 'nand'}
                          <foreignObject x="-28" y={pinIndex * 60 - 3} width="56" height="56">
                            <button
                              class="svg-pin-button target-pin"
                              class:target-ready={!!selectedSource &&
                                availableSources(mission, circuit, gate.id).includes(
                                  selectedSource,
                                )}
                              aria-label={`Connect to part ${index + 1} ${gate.type} input ${pin}`}
                              on:click={() => connectPin(gate.id, pin)}><span></span></button
                            >
                          </foreignObject>
                        {/if}
                      {/each}
                      <circle
                        cx="132"
                        cy="55"
                        r="4"
                        fill={signal(gate.id, liveSignals) === true ? '#b4acff' : '#8b83ff'}
                      />
                      <text x="148" y="59" class="diagram-pin"
                        >{signal(gate.id, liveSignals) === null
                          ? '·'
                          : Number(signal(gate.id, liveSignals))}</text
                      >
                      {#if missionId !== 'nand'}
                        <foreignObject x="104" y="27" width="56" height="56">
                          <button
                            class="svg-pin-button source-pin"
                            class:source-selected={selectedSource === gate.id}
                            aria-pressed={selectedSource === gate.id}
                            aria-label={`Select source part ${index + 1} ${gate.type} output`}
                            on:click={() => selectSource(gate.id)}><span></span></button
                          >
                        </foreignObject>
                      {/if}
                    </g>
                  {/each}
                  {#if circuit.gates.length === 0}
                    <g transform="translate(390, 110)">
                      <rect
                        x="-35"
                        y="-23"
                        width="140"
                        height="90"
                        rx="13"
                        fill="#171a26"
                        stroke="#4f5369"
                        stroke-dasharray="5 5"
                      />
                      <text
                        x="35"
                        y="17"
                        text-anchor="middle"
                        fill="#b8b2e5"
                        font-family="monospace"
                        font-size="27">+</text
                      >
                      <text x="35" y="41" text-anchor="middle" class="diagram-label"
                        >YOUR CIRCUIT</text
                      >
                    </g>
                    <text x="425" y="231" text-anchor="middle" fill="#a1a5b6" font-size="13"
                      >Add a gate above to start your circuit.</text
                    >
                  {/if}
                  {#each mission.outputs as pin, index}
                    {@const outputValue = live.result?.outputs[pin]}
                    <g transform={`translate(795, ${125 + index * 106})`}>
                      {#if outputValue}<circle
                          cx="25"
                          cy="0"
                          r="29"
                          fill="#8b83ff"
                          opacity=".32"
                          filter="url(#bench-glow)"
                        />{/if}
                      <circle
                        cx="25"
                        cy="0"
                        r="24"
                        fill={outputValue === true ? '#a399ff' : '#262a3b'}
                        stroke={outputValue === true ? '#4f46e5' : '#555b73'}
                        stroke-width="3"
                      />
                      <text
                        x="25"
                        y="7"
                        text-anchor="middle"
                        fill="#fff"
                        font-family="monospace"
                        font-size="21"
                        font-weight="700"
                        >{outputValue === undefined ? '?' : Number(outputValue)}</text
                      >
                      <text x="25" y="44" text-anchor="middle" class="diagram-label">{pin}</text>
                      {#if missionId !== 'nand'}
                        <foreignObject x="-3" y="-28" width="56" height="56">
                          <button
                            class="svg-pin-button output-pin"
                            class:target-ready={!!selectedSource}
                            aria-label={`Connect chip output ${pin}`}
                            on:click={() => connectOutput(pin)}><span></span></button
                          >
                        </foreignObject>
                      {/if}
                    </g>
                  {/each}
                </svg>
              </div>
              <p class="sr-only" aria-live="polite">
                {live.result
                  ? `Live output: ${Object.entries(live.result.outputs)
                      .map(([pin, value]) => `${pin} ${Number(value)}`)
                      .join(', ')}`
                  : 'Circuit is not yet fully connected.'}
              </p>
            </div>

            {#if missionId !== 'nand'}
              <section class="parts-bay" aria-label="Circuit parts and connections">
                <details class="connections-disclosure">
                  <summary>Connections</summary>
                  <div class="clear-actions">
                    {#if undoCircuit}<button class="reset-button undo-clear" on:click={undoClear}
                        >Undo clear</button
                      >{/if}<button
                      class="reset-button"
                      on:click={resetBoard}
                      disabled={circuit.gates.length === 0 &&
                        mission.outputs.every((pin) => !circuit.outputs[pin])}>Clear circuit</button
                    >
                  </div>

                  {#if circuit.gates.length > 0}
                    <div class="gate-controls">
                      {#each circuit.gates as gate, index (gate.id)}
                        <div class="gate-control">
                          <div class="gate-control-heading">
                            <span class="part-index">{String(index + 1).padStart(2, '0')}</span
                            ><strong>{gate.type}</strong><button
                              disabled={!!codeError}
                              aria-label={`Remove part ${index + 1}, ${gate.type}`}
                              on:click={() => removeGate(gate.id)}>×</button
                            >
                          </div>
                          {#each gatePins(gate.type) as pin}
                            <label
                              ><span>Pin <b>{pin}</b></span><select
                                disabled={!!codeError}
                                aria-label={`Part ${index + 1} ${gate.type} input ${pin}`}
                                value={gate.inputs[pin] ?? ''}
                                on:change={(event) =>
                                  setConnection(gate.id, pin, event.currentTarget.value)}
                                ><option value="">Choose source…</option
                                >{#each availableSources(mission, circuit, gate.id) as source}<option
                                    value={source}>{sourceLabel(source)}</option
                                  >{/each}</select
                              ></label
                            >
                          {/each}
                        </div>
                      {/each}
                    </div>
                  {/if}
                  <div class="output-connections">
                    <span class="output-title">CHIP OUTPUTS</span
                    >{#each mission.outputs as pin}<label
                        ><span>Output <b>{pin}</b></span><select
                          disabled={!!codeError}
                          aria-label={`Chip output ${pin}`}
                          value={circuit.outputs[pin] ?? ''}
                          on:change={(event) => setOutput(pin, event.currentTarget.value)}
                          ><option value="">Choose source…</option
                          >{#each availableSources(mission, circuit) as source}<option
                              value={source}>{sourceLabel(source)}</option
                            >{/each}</select
                        ></label
                      >{/each}
                  </div>
                </details>
              </section>
            {/if}
          </div>
        {/if}
        {#if editorMode !== 'visual'}
          <section class="hdl-panel" aria-label="HDL code editor">
            <div class="code-heading">
              <span><b aria-hidden="true">&lt;/&gt;</b> {mission.chip}.hdl</span><button
                on:click={copyHDL}
                disabled={!code}>{copied ? 'Copied' : 'Copy code'}</button
              >
            </div>
            {#if editorMode === 'code' && !live.result && !codeError && mission.outputs.every((pin) => !!circuit.outputs[pin])}
              <div class="wiring-instruction"><p aria-live="polite">{guidedInstruction}</p></div>
            {/if}
            <div class="code-editor" class:has-error={!!codeError}>
              <div class="line-numbers" aria-hidden="true">
                <div style={`transform: translateY(-${codeScroll}px)`}>
                  {#each code.split('\n') as _, index}<span>{index + 1}</span>{/each}
                </div>
              </div>
              <textarea
                aria-label="HDL source"
                aria-describedby="hdl-help"
                value={code}
                spellcheck="false"
                autocapitalize="off"
                autocomplete="off"
                readonly={missionId === 'nand'}
                on:input={(event) => editCode(event.currentTarget.value)}
                on:scroll={(event) => (codeScroll = event.currentTarget.scrollTop)}
              ></textarea>
            </div>
            <div class="code-status">
              <span>{codeError ? 'HDL ERROR' : live.result ? 'COMPILED' : 'DRAFT'}</span><span
                >HDL · {code.split('\n').length} lines</span
              >
            </div>
            <p id="hdl-help">
              {missionId === 'nand'
                ? 'NAND is supplied by the simulator; its HDL is read-only.'
                : 'Edit either view. Visual edits rewrite the HDL.'}
            </p>
            <a href="/tools/hardware-simulator"
              >Open Hardware simulator <span aria-hidden="true">↗</span></a
            >
          </section>
        {/if}
      </div>

      <p class="draft-status">{saveNotice || 'Drafts are saved on this device.'}</p>
      <aside class="mission-instruments" aria-label="Signal analysis and test results">
        <details class="analyzer-panel">
          <summary>Signal history</summary>
          <BenchMachine
            {missionId}
            outputs={live.result?.outputs ?? null}
            inputs={inputValues}
            certified={restoreReady}
          />
        </details>

        {#if report || reportError}
          <details id="circuit-results" class="test-panel" open={!report?.success}>
            <summary>Test results</summary>
            <div class="instrument-heading">
              <span class="eyebrow">PROVE YOUR CIRCUIT</span><span class="case-count"
                >{scenarios.length} CASES</span
              >
            </div>
            {#if reportError}<div class="test-error" role="alert">
                <strong>Circuit cannot run.</strong>
                <p>{reportError}</p>
              </div>{/if}
            {#if report}
              <div class="test-summary" class:all-pass={report.success} aria-live="polite">
                <strong>{report.success ? 'Signal confirmed.' : 'Specification mismatch.'}</strong
                ><span>{report.passed} of {report.total} combinations work.</span>
              </div>
              <div class="truth-table-wrap">
                <table class="truth-table">
                  <caption>Click a case to inspect its live signal.</caption><thead
                    ><tr
                      >{#each mission.inputs as pin}<th scope="col">{pin}</th>{/each}<th scope="col"
                        >Wanted {mission.outputs.length > 1 ? mission.outputs.join('/') : ''}</th
                      ><th scope="col"
                        >Yours {mission.outputs.length > 1 ? mission.outputs.join('/') : ''}</th
                      ><th scope="col"><span class="sr-only">Result</span></th></tr
                    ></thead
                  ><tbody
                    >{#each report.rows as row, index}<tr class:row-failed={!row.passed}
                        >{#each mission.inputs as pin}<td>{Number(row.inputs[pin])}</td>{/each}<td
                          >{mission.outputs.map((pin) => Number(row.expected[pin])).join(' / ')}</td
                        ><td>{mission.outputs.map((pin) => Number(row.actual[pin])).join(' / ')}</td
                        ><td
                          ><button
                            on:click={() => {
                              inputValues = { ...row.inputs };
                            }}
                            aria-label={`Inspect case ${index + 1}, ${row.passed ? 'passes' : 'needs work'}`}
                            >{row.passed ? '✓' : '↗'}</button
                          ></td
                        ></tr
                      >{/each}</tbody
                  >
                </table>
              </div>
              {#if !report.success}<p class="test-clue">
                  The board is showing the first mismatching input. Follow its signal and change a
                  connection.
                </p>{/if}
            {/if}
          </details>
        {/if}

        <details class="hint-panel">
          <summary>Need a hint?</summary>
          {#if hintCount > 0}<ol>
              {#each mission.hints.slice(0, hintCount) as hint}<li>{hint}</li>{/each}
            </ol>{/if}
          <button
            on:click={() => (hintCount = Math.min(mission.hints.length, hintCount + 1))}
            disabled={hintCount >= mission.hints.length}
          >
            {hintCount === 0
              ? 'Reveal a hint'
              : hintCount >= mission.hints.length
                ? 'All hints revealed'
                : 'Next hint'}
          </button>
        </details>
      </aside>
    </div>
  </section>
{/if}

<style>
  .bench {
    --surface: #12151f;
    --edge: #303446;
    --text: #f0f0f7;
    --muted-text: #a1a5b6;
    --accent: #a69cff;
    color: var(--text);
    background: #090b12;
    min-height: 100vh;
    padding: 0 clamp(16px, 3vw, 48px) 64px;
    font-family: inherit;
  }
  .bench *,
  .bench *::before,
  .bench *::after {
    box-sizing: border-box;
  }
  .bench button,
  .bench select,
  .bench textarea {
    font: inherit;
  }
  .bench button {
    cursor: pointer;
  }
  .bench button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .bench button:focus-visible,
  .bench select:focus-visible,
  .bench textarea:focus-visible,
  .bench a:focus-visible {
    outline: 2px solid #aaa0ff !important;
    outline-offset: 4px;
  }
  .bench-header,
  .mission-title-row,
  .editor-toolbar,
  .signal-inputs,
  .bench-layout,
  .code-error {
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }
  .bench-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 64px;
    gap: 16px;
    border-bottom: 1px solid #252938;
  }
  .world-back {
    display: flex;
    gap: 12px;
    align-items: center;
    color: #c8cad9;
    border: 0;
    background: none;
    padding: 12px 0;
    font-size: 12px !important;
  }
  .world-back span {
    font-size: 19px;
  }

  .notes-trigger {
    display: flex;
    gap: 9px;
    align-items: center;
    background: #141722;
    border: 1px solid var(--edge);
    color: #cacbda;
    border-radius: 4px;
    padding: 9px 12px;
    font-size: 12px !important;
  }
  .mission-title-row {
    display: flex;
    gap: 24px;
    align-items: center;
    justify-content: space-between;
    padding: 28px 0 22px;
  }
  .eyebrow {
    color: #b5adf1;
    font: 12px/1.6 monospace;
    letter-spacing: 1.4px;
    margin: 0 0 10px;
    text-transform: uppercase;
  }
  .eyebrow span {
    color: #636983;
    margin: 0 5px;
  }
  h1 {
    font-size: clamp(27px, 3vw, 40px);
    font-weight: 550;
    line-height: 1.12;
    letter-spacing: -1.4px;
    margin: 0 0 12px;
  }
  .mission-brief {
    font-size: 13px;
    line-height: 1.75;
    color: var(--muted-text);
    max-width: 760px;
    margin: 0;
  }
  .signal-inputs {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    padding: 14px 0 18px;
  }
  .switch-label {
    font: 12px monospace;
    letter-spacing: 1px;
    color: #a5a9bc;
    margin-right: 12px;
  }
  .input-switch {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    min-height: 38px;
    border: 1px solid #383d51;
    background: #151824;
    color: #d3d5e2;
    border-radius: 4px;
  }
  .input-switch > span:first-child {
    font: 12px monospace;
    min-width: 18px;
  }
  .input-switch strong {
    font: 13px monospace;
  }
  .switch-track {
    width: 28px;
    height: 14px;
    background: #3a3f55;
    border-radius: 3px;
    position: relative;
  }
  .switch-track i {
    position: absolute;
    width: 8px;
    height: 8px;
    left: 3px;
    top: 3px;
    border-radius: 1px;
    background: #b2b6c9;
    transition: transform 0.15s;
  }
  .input-on {
    border-color: #665db3;
    background: #211d3a;
  }
  .input-on .switch-track {
    background: #6657d4;
  }
  .input-on .switch-track i {
    transform: translateX(14px);
    background: #fff;
  }
  .editor-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px 16px;
    padding: 10px 0;
    border-top: 1px solid #252938;
    background: #090b12;
  }
  .toolbar-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 9px 14px;
    margin-left: auto;
    min-width: 0;
  }
  .toolbar-status {
    font: 12px/1.5 monospace;
    color: #beb5db;
  }
  .toolbar-status.status-error {
    color: #f4abac;
  }
  .toolbar-save {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 38px;
    padding: 9px 12px;
    border: 1px solid #b5a6ed;
    border-radius: 4px;
    background: #a99be1;
    color: #171126;
    font-size: 12px !important;
    font-weight: 600 !important;
  }
  .workspace {
    min-width: 0;
  }
  .workspace.split-view {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    gap: 12px;
    align-items: stretch;
  }
  .visual-workspace {
    min-width: 0;
  }
  .board-shell {
    border: 1px solid #34364e;
    background: #111420;
    border-radius: 5px;
    overflow: hidden;
  }
  .board-heading,
  .code-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 17px;
    border-bottom: 1px solid #2a2e40;
    color: #b6b9ca;
    font: 12px monospace;
    letter-spacing: 1px;
    min-height: 45px;
    background: #171a27;
  }

  .wiring-instruction {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 9px 15px 0;
    min-height: 42px;
    color: #a7abbe;
  }
  .wiring-instruction > span {
    font: 25px monospace;
    color: #aba0ff;
  }
  .wiring-instruction p {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    flex: 1;
  }
  .wiring-instruction button {
    padding: 8px 0;
    font-size: 12px;
    color: #c6bfff;
    background: none;
    border: 0;
    white-space: nowrap;
  }
  .circuit-viewport {
    overflow-x: auto;
  }
  .circuit-svg {
    display: block;
    width: 100%;
    min-width: 660px;
  }
  .diagram-label {
    fill: #a5aabe;
    font: 16px monospace;
    letter-spacing: 1px;
  }
  .diagram-pin {
    fill: #b0b2c5;
    font: 16px monospace;
  }
  .gate-pin-label {
    fill: #bcb8df;
  }
  .circuit-wire {
    fill: none;
    stroke: #4d506c;
    stroke-width: 2;
    stroke-linecap: round;
    transition: stroke 0.15s;
  }
  .circuit-wire.wire-on {
    stroke: #a599ff;
    stroke-width: 2.5;
    filter: drop-shadow(0 0 3px #8e7cff55);
  }
  .bench .svg-pin-button {
    display: grid;
    place-items: center;
    height: 56px;
    width: 56px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    padding: 0;
  }
  .svg-pin-button span {
    width: 12px;
    height: 12px;
    border: 2px solid #161928;
    background: #a194f7;
    border-radius: 50%;
    box-shadow: 0 0 0 1px #a194f7;
  }
  .svg-pin-button:hover,
  .svg-pin-button.source-selected {
    background: #9382ff28;
  }
  .svg-pin-button.source-selected span {
    background: #fff;
    box-shadow: 0 0 0 5px #9382ff50;
  }
  .svg-pin-button.target-ready span {
    background: #d1caff;
    box-shadow: 0 0 0 4px #9382ff35;
  }
  .bench .output-pin span {
    height: 42px;
    width: 42px;
    background: transparent;
    border: 2px dashed #8078b4;
    box-shadow: none;
  }
  .bench .output-pin.target-ready span {
    background: #aba0ff26;
    border-color: #e1dcff;
  }
  .paused .circuit-viewport {
    opacity: 0.5;
  }
  .parts-bay {
    padding: 18px 0 0;
  }
  .clear-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .reset-button {
    background: none;
    border: 0;
    color: #aeb2c5;
    padding: 8px 0;
    font-size: 12px !important;
  }
  .undo-clear {
    color: #c4baff;
  }
  .part-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
  }
  .part-buttons button {
    border: 1px solid #41405c;
    background: #1d1c2e;
    color: #e1def3;
    display: flex;
    gap: 10px;
    align-items: center;
    min-height: 42px;
    border-radius: 4px;
    padding: 8px 12px;
  }
  .part-buttons button:hover:not(:disabled) {
    background: #2d2647;
    border-color: #8e7fd7;
  }
  .part-buttons strong {
    font: 12px monospace;
  }
  .part-buttons button > span:first-child {
    color: #b3a5ff;
    font-size: 18px;
  }
  .gate-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr));
    gap: 10px;
  }
  .gate-control {
    border: 1px solid #31354a;
    border-radius: 4px;
    background: #141722;
    padding: 12px;
    min-width: 0;
  }
  .gate-control-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .gate-control-heading strong {
    font: 12px monospace;
  }
  .part-index {
    font: 12px monospace;
    color: #b4a9eb;
    border-right: 1px solid #47405f;
    padding-right: 8px;
  }
  .gate-control-heading button {
    margin-left: auto;
    padding: 0;
    border: 0;
    background: none;
    color: #c2c4d4;
    width: 30px;
    height: 28px;
    font-size: 20px !important;
  }
  .gate-control label,
  .output-connections label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
    color: #a1a6bc;
    font-size: 12px;
  }
  .gate-control label span {
    min-width: 40px;
  }
  .gate-control label b,
  .output-connections label b {
    font: 12px monospace;
    color: #dedfeb;
  }
  .gate-control select,
  .output-connections select {
    flex: 1;
    min-width: 0;
    max-width: 240px;
    min-height: 36px;
    background: #0e111c;
    border: 1px solid #41465d;
    color: #d9dbe9;
    border-radius: 3px;
    padding: 8px;
    font-size: 12px !important;
  }
  .output-connections {
    display: flex;
    gap: 12px 20px;
    flex-wrap: wrap;
    align-items: center;
    border: 1px solid #3f385e;
    border-radius: 4px;
    padding: 12px;
    margin-top: 10px;
    background: #181626;
  }
  .output-title {
    font: 12px monospace;
    letter-spacing: 1px;
    color: #b4a8e9;
  }
  .output-connections label {
    flex: 1;
    min-width: 160px;
    margin: 0;
  }
  .draft-status {
    color: #969db3;
    font: 12px/1.7 monospace;
    padding: 13px 0 20px;
    margin: 0;
  }
  .hdl-panel {
    display: flex;
    flex-direction: column;
    background: #0c0e17;
    border: 1px solid #35334c;
    border-radius: 5px;
    overflow: hidden;
    min-width: 0;
  }
  .code-heading {
    justify-content: space-between;
    gap: 12px;
    padding-top: 7px;
    padding-bottom: 7px;
  }
  .code-heading > span {
    font: 12px monospace;
    letter-spacing: 0;
  }
  .code-heading b {
    color: #b6a8ff;
    padding-right: 8px;
    font-weight: 400;
  }
  .code-heading button {
    background: #252235;
    border: 1px solid #44405e;
    padding: 6px 9px;
    color: #c4bddb;
    border-radius: 3px;
    font-size: 12px;
    white-space: nowrap;
  }
  .code-editor {
    display: flex;
    flex: 1;
    min-height: 380px;
    position: relative;
  }
  .line-numbers {
    width: 45px;
    flex-shrink: 0;
    padding: 22px 10px 22px 0;
    color: #737a93;
    text-align: right;
    background: #10121d;
    overflow: hidden;
    font:
      13px/1.9 ui-monospace,
      SFMono-Regular,
      Menlo,
      Consolas,
      monospace;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    user-select: none;
  }
  .line-numbers span {
    display: block;
  }
  .code-editor textarea {
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #d1c9fb;
    width: 100%;
    resize: vertical;
    padding: 22px 16px 22px 58px;
    min-height: 380px;
    white-space: pre;
    overflow: auto;
    font:
      13px/1.9 ui-monospace,
      SFMono-Regular,
      Menlo,
      Consolas,
      monospace;
    tab-size: 4;
    caret-color: #d4c6ff;
  }
  .code-editor textarea:focus {
    outline: 0 !important;
    box-shadow: inset 0 0 0 1px #7163ba;
  }
  .has-error textarea {
    box-shadow: inset 0 0 0 1px #a76370;
  }
  .code-status {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 11px 15px;
    border-top: 1px solid #2c2940;
    font: 12px monospace;
    color: #aca1db;
    letter-spacing: 0.7px;
    background: #171323;
  }
  .hdl-panel > p {
    font-size: 12px;
    line-height: 1.8;
    color: #a1a4b7;
    padding: 0 16px;
    margin: 14px 0 6px;
  }
  .hdl-panel > a {
    font-size: 12px;
    color: #c1b7ed;
    padding: 8px 16px 16px;
  }
  .code-error {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border: 1px solid #754b60;
    background: #261823;
    color: #f4c8d5;
    padding: 15px;
    margin-top: 4px;
    margin-bottom: 14px;
    border-radius: 4px;
  }
  .code-error strong {
    font-size: 12px;
  }
  .code-error p {
    font: 12px/1.6 monospace;
    max-height: 140px;
    overflow: auto;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    margin: 7px 0;
  }
  .code-error span {
    font-size: 12px;
    color: #ceaeba;
  }
  .code-error button {
    flex-shrink: 0;
    border: 1px solid #775669;
    background: #412b3d;
    color: #f1d3df;
    border-radius: 3px;
    font-size: 12px;
    padding: 10px;
  }
  .mission-instruments {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    align-items: start;
  }
  .analyzer-panel,
  .test-panel,
  .hint-panel,
  .field-guide {
    min-width: 0;
    padding: 22px;
    background: #12151f;
    border: 1px solid #303446;
    border-radius: 5px;
  }
  .analyzer-panel {
    grid-column: 1;
  }

  .test-panel {
    scroll-margin-top: 24px;
    grid-column: 1 / -1;
    grid-row: 1;
    border-color: #49405f;
    background: #171422;
  }
  .instrument-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .test-panel .eyebrow {
    margin: 0;
    font-size: 12px;
    color: #b3a8d5;
  }
  .case-count {
    font: 12px monospace;
    color: #b8afcf;
    white-space: nowrap;
  }
  .test-panel > p {
    font-size: 12px;
    line-height: 1.8;
    color: #a8a4bb;
    margin: 0 0 16px;
  }
  .test-button {
    display: flex;
    align-items: center;
    gap: 9px;
    border: 1px solid #8875e9;
    background: #6852c9;
    color: #fff;
    border-radius: 4px;
    font-size: 12px !important;
    padding: 9px 13px;
    min-height: 38px;
  }
  .test-error {
    background: #332333;
    border-left: 2px solid #d68eac;
    padding: 13px;
    margin-top: 15px;
    overflow-wrap: anywhere;
  }
  .test-error strong {
    color: #edbfce;
    font-size: 12px;
  }
  .test-error p {
    color: #d7b5c3;
    font-size: 12px;
    line-height: 1.7;
    margin: 5px 0 0;
  }
  .test-summary {
    display: grid;
    gap: 5px;
    padding-left: 12px;
    border-left: 2px solid #d595a9;
    margin-top: 18px;
  }
  .test-summary strong {
    font-size: 12px;
    color: #e0d7f0;
  }
  .test-summary span {
    font-size: 12px;
    color: #bcb3cb;
  }
  .test-summary.all-pass {
    border-color: #a799ed;
  }
  .truth-table-wrap {
    overflow-x: auto;
    margin-top: 14px;
  }
  .truth-table {
    width: 100%;
    border-collapse: collapse;
    font: 12px monospace;
  }
  .truth-table th {
    font-size: 12px;
    font-weight: 400;
    color: #aaa3ba;
    border-bottom: 1px solid #4b415b;
    text-align: center;
    padding: 8px 4px;
  }
  .truth-table td {
    border-bottom: 1px solid #302939;
    text-align: center;
    padding: 7px 4px;
    color: #d3c7e6;
  }
  .truth-table caption {
    text-align: left;
    caption-side: bottom;
    font-size: 12px;
    line-height: 1.6;
    color: #aea4c0;
    padding-top: 10px;
  }
  .truth-table button {
    border: 1px solid #51446e;
    background: #332744;
    color: #d0bcf0;
    border-radius: 3px;
    min-height: 28px;
    min-width: 29px;
  }
  .truth-table .row-failed td {
    color: #e5acbb;
    background: #342331;
  }
  .test-clue {
    font-size: 12px !important;
    margin: 13px 0 0 !important;
  }
  .hint-panel {
    grid-column: 2;
  }

  .hint-panel button {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    border: 0;
    background: none;
    color: #beb2ee;
    padding: 16px 0 0;
    font-size: 12px;
    min-height: 40px;
  }
  .hint-panel ol {
    margin: 16px 0 0;
    padding-left: 15px;
  }
  .hint-panel li {
    font-size: 12px;
    color: #bfc0ce;
    line-height: 1.8;
    margin-bottom: 10px;
  }
  .field-guide {
    border-color: #47415b;
  }
  .field-guide .eyebrow {
    margin: 0;
    font-size: 12px;
  }
  .field-guide button {
    border: 0;
    background: none;
    color: #c1b8d8;
    font-size: 21px;
  }
  .field-guide h2 {
    font-size: 18px;
    font-weight: 500;
    line-height: 1.5;
    margin: 13px 0;
  }
  .field-guide p {
    font-size: 12px;
    color: #b9b3c8;
    line-height: 1.85;
  }
  .field-guide a {
    display: block;
    font-size: 12px;
    line-height: 1.7;
    color: #c9bdf1;
    padding-top: 12px;
  }
  .eyebrow,
  .switch-label,
  .board-heading,
  .part-index,
  .output-title,
  .code-status,
  .test-panel .eyebrow,
  .case-count,
  .field-guide .eyebrow {
    font-size: 10px;
  }
  .toolbar-status {
    font-size: 12px;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  @media (min-width: 1500px) {
    .workspace.split-view {
      grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    }
    .circuit-svg {
      min-height: 390px;
    }
  }
  @media (max-width: 1000px) {
    .mission-instruments {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
    }

    .workspace.split-view {
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    }
  }
  @media (max-width: 760px) {
    .workspace.split-view {
      grid-template-columns: minmax(0, 1fr);
    }
    .mission-title-row {
      gap: 15px;
    }
    .code-editor,
    .code-editor textarea {
      min-height: 300px;
    }
    .hdl-panel {
      margin-top: 4px;
    }
    .code-error {
      align-items: start;
      flex-direction: column;
    }
  }
  @media (max-width: 520px) {
    .bench {
      padding: 0 16px 40px;
    }
    .mission-title-row {
      padding-top: 25px;
    }
    h1 {
      font-size: 30px;
    }
    .mission-brief {
      font-size: 12px;
    }
    .switch-label {
      width: 100%;
    }
    .signal-inputs {
      padding-top: 4px;
      gap: 8px;
    }
    .editor-toolbar {
      align-items: stretch;
      flex-direction: column;
      gap: 9px;
    }
    .toolbar-actions {
      width: 100%;
      margin-left: 0;
      gap: 9px 10px;
    }
    .toolbar-status {
      flex: 1;
      min-width: 0;
      font-size: 12px;
    }
    .toolbar-save {
      margin-left: auto;
    }
    .mission-instruments {
      grid-template-columns: minmax(0, 1fr);
    }
    .analyzer-panel,
    .test-panel,
    .hint-panel,
    .field-guide {
      grid-row: auto;
      grid-column: auto;
      padding: 18px;
    }
    .gate-controls {
      grid-template-columns: minmax(0, 1fr);
    }
    .gate-control select,
    .output-connections select {
      min-height: 41px;
    }
    .output-connections {
      display: block;
    }
    .output-title {
      display: block;
      margin-bottom: 12px;
    }
    .output-connections label {
      margin-top: 10px;
    }
    .test-button,
    .truth-table button {
      min-height: 38px;
    }
    .truth-table button {
      min-width: 38px;
    }
    .circuit-svg {
      min-width: 660px;
    }
    .clear-actions {
      gap: 2px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bench * {
      transition: none !important;
      animation: none !important;
    }
  }

  .view-choice select {
    min-height: 42px;
    min-width: 120px;
    padding: 9px 34px 9px 12px;
    color: #d4d4e5;
    background: #11141e;
    border: 1px solid #36394d;
    border-radius: 4px;
    font-size: 13px;
  }
  .bench summary {
    cursor: pointer;
    color: #c6c4da;
    font-size: 13px;
    line-height: 1.5;
    min-height: 32px;
  }
  .bench summary:focus-visible {
    outline: 2px solid #aaa0ff;
    outline-offset: 4px;
  }
  .connections-disclosure {
    padding: 10px 0;
    border-bottom: 1px solid #292d3d;
  }
  .connections-disclosure[open] > summary {
    margin-bottom: 10px;
  }
  .board-heading {
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .field-guide {
    max-width: 1200px;
    margin: 14px auto;
  }
  .analyzer-panel,
  .hint-panel {
    padding: 12px 0;
    background: transparent;
    border: 0;
    border-top: 1px solid #292d3d;
    border-radius: 0;
  }
  .test-panel[open] > summary {
    margin-bottom: 18px;
  }
  @media (max-width: 700px) {
    .editor-toolbar {
      flex-direction: row;
      align-items: center;
    }
    .toolbar-actions {
      width: auto;
      margin-left: auto;
      max-width: 60%;
    }
    .toolbar-status {
      font-size: 11px;
    }
    .view-choice select {
      min-width: 104px;
    }
    .mission-instruments {
      display: block;
    }
    .mission-instruments > * {
      margin-top: 10px;
    }
  }
</style>

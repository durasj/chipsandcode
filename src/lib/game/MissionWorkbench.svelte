<script lang="ts">
  import { onMount } from 'svelte';
  import BenchMachine from './BenchMachine.svelte';
  import { getMission, truthTable, type GateKind } from './missions';
  import {
    availableSources,
    createCircuit,
    gatePins,
    isCircuitDraft,
    simulateCircuit,
    testCircuit,
    toHDL,
    type Circuit,
  } from './circuit';

  export let missionId: string;
  export let completed: string[] = [];
  export let oncomplete: (id: string) => void;
  export let onclose: () => void;

  const mission = getMission(missionId);
  const scenarios = truthTable(mission);
  const draftKey = `chipsandcode:signal-isles:draft:${missionId}:v1`;
  let circuit: Circuit = createCircuit(mission);
  let inputValues: Record<string, boolean> = Object.fromEntries(
    mission.inputs.map((pin) => [pin, false]),
  );
  let report: ReturnType<typeof testCircuit> | null = null;
  let reportError = '';
  let hintCount = 0;
  let showGuide = false;
  let showHDL = false;
  let remembered = false;
  let saveNotice = '';
  let predictions: number[] = [];
  let predictionMessage = '';
  let selectedScenario = 0;
  let restoreReady = false;
  let copied = false;
  let selectedSource = '';
  let wiringMessage = 'Choose a source dot, then a destination pin to connect them.';
  let undoCircuit: Circuit | null = null;
  let missionHeading: HTMLHeadingElement;

  $: live = inspect(circuit, inputValues);
  $: liveSignals = live.result?.signals ?? { ...inputValues };
  $: schematicRows = Math.max(1, Math.ceil(circuit.gates.length / 3));
  $: schematicHeight = Math.max(330, 155 + schematicRows * 172);
  $: hdl = makeHDL(circuit);
  $: allPredicted = predictions.length === scenarios.length;
  $: restoreReady = missionId === 'nand' ? allPredicted : report?.success === true;

  onMount(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved && missionId !== 'nand') {
        const candidate: unknown = JSON.parse(saved);
        if (isCircuitDraft(mission, candidate)) circuit = candidate;
      }
    } catch {
      saveNotice = 'Draft storage is unavailable. You can still build and play.';
    }
    remembered = true;
    missionHeading?.focus();
  });

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

  function makeHDL(value: Circuit) {
    try {
      return toHDL(mission, value);
    } catch {
      return '';
    }
  }

  function save() {
    if (!remembered || missionId === 'nand') return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(circuit));
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
    copied = false;
    save();
  }

  function addGate(type: GateKind) {
    if (circuit.gates.length >= 24) return;
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
    const gate = circuit.gates.find((part) => part.id === gateId);
    if (gate) gate.inputs[pin] = source;
    changed();
  }

  function setOutput(pin: string, source: string) {
    circuit.outputs[pin] = source;
    changed();
  }

  function toggleInput(pin: string) {
    inputValues = { ...inputValues, [pin]: !inputValues[pin] };
    selectedScenario = scenarios.findIndex((scenario) =>
      mission.inputs.every((input) => scenario.inputs[input] === inputValues[input]),
    );
    predictionMessage = '';
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
    if (missionId === 'nand') {
      if (mission.inputs.includes(source)) toggleInput(source);
      return;
    }
    selectedSource = selectedSource === source ? '' : source;
    wiringMessage = selectedSource
      ? `${sourceLabel(source)} selected. Choose a part’s input pin or a machine output.`
      : 'Choose a source dot, then a destination pin to connect them.';
  }

  function connectPin(gateId: string, pin: string) {
    if (!selectedSource) {
      wiringMessage = 'First choose an input source or the dot on the right of a part.';
      return;
    }
    if (!availableSources(mission, circuit, gateId).includes(selectedSource)) {
      wiringMessage =
        'Signals travel forward. Choose a world input or a part earlier on the board.';
      return;
    }
    setConnection(gateId, pin, selectedSource);
    wiringMessage = `${sourceLabel(selectedSource)} connected to ${sourceLabel(gateId).replace(' output', '')}, pin ${pin}. You can connect it to another pin, too.`;
  }

  function connectOutput(pin: string) {
    if (missionId === 'nand') return;
    if (!selectedSource) {
      wiringMessage =
        'Choose an input source or a part’s output dot first, then the machine output.';
      return;
    }
    setOutput(pin, selectedSource);
    wiringMessage = `${sourceLabel(selectedSource)} now feeds machine output ${pin}. Try a signal or test your circuit.`;
  }

  function runTests() {
    reportError = '';
    try {
      report = testCircuit(mission, circuit);
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

  function predict(value: boolean) {
    const index = scenarios.findIndex((scenario) =>
      mission.inputs.every((pin) => scenario.inputs[pin] === inputValues[pin]),
    );
    const expected = live.result?.outputs[mission.outputs[0]];
    if (expected === undefined) return;
    if (value !== expected) {
      predictionMessage = `The NAND output is ${Number(expected)} here. Try this combination again: it is off only when both inputs are on.`;
      return;
    }
    predictions = [...new Set([...predictions, index])];
    selectedScenario = index;
    predictionMessage = `Exactly. ${mission.inputs.map((pin) => `${pin}=${Number(inputValues[pin])}`).join(', ')} produces ${Number(expected)}.`;
  }

  function nextPrediction() {
    const index = scenarios.findIndex((_, row) => !predictions.includes(row));
    if (index < 0) return;
    selectedScenario = index;
    inputValues = { ...scenarios[index].inputs };
    predictionMessage = '';
  }

  function resetBoard() {
    undoCircuit = JSON.parse(JSON.stringify(circuit)) as Circuit;
    circuit = createCircuit(mission);
    report = null;
    reportError = '';
    predictions = [];
    predictionMessage = '';
    selectedSource = '';
    changed(true);
  }

  function undoClear() {
    if (!undoCircuit) return;
    circuit = undoCircuit;
    undoCircuit = null;
    changed();
  }

  async function copyHDL() {
    if (!hdl) return;
    try {
      await navigator.clipboard.writeText(hdl);
      copied = true;
    } catch {
      copied = false;
    }
  }
</script>

<section class="bench" aria-label={`${mission.chip} workshop`}>
  <header class="bench-header">
    <button class="world-back" on:click={onclose}
      ><span aria-hidden="true">←</span> World map</button
    >
    <div class="bench-identity">
      <span class="identity-light"></span> CHIPS <span class="identity-and">&</span> CODE
      <span class="slash">/</span> FIELD WORKSHOP
    </div>
    <button
      class="notes-trigger"
      aria-expanded={showGuide}
      on:click={() => (showGuide = !showGuide)}
      ><span aria-hidden="true">▤</span> Field notes</button
    >
  </header>

  <div class="mission-title-row">
    <div>
      <p class="eyebrow">
        STATION {String(mission.number).padStart(2, '0')} <span> / </span>
        {mission.location}
      </p>
      <h1 tabindex="-1" bind:this={missionHeading}>{mission.title}</h1>
      <p class="mission-brief">{mission.brief}</p>
    </div>
    <div class="chip-stamp">
      <span>BUILD SPEC</span><strong>{mission.chip}</strong><span
        >{completed.includes(missionId) ? 'RESTORED · REPLAY' : 'AWAITING SIGNAL'}</span
      >
    </div>
  </div>

  <div class="bench-layout">
    <div class="workspace">
      <div class="board-shell">
        <div class="board-heading">
          <span class="small-light"></span><span>CIRCUIT WORKBENCH</span><span class="board-number"
            >MK. 01 / {mission.chip.toUpperCase()}</span
          >
        </div>
        <div class="signal-inputs" aria-label="Live input switches">
          <span class="switch-label">TRY A SIGNAL</span>
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

        {#if missionId !== 'nand'}
          <div class="wiring-instruction">
            <span aria-hidden="true">⌁</span>
            <p aria-live="polite">{wiringMessage}</p>
            {#if selectedSource}<button
                on:click={() => {
                  selectedSource = '';
                  wiringMessage = 'Choose a source dot, then a destination pin to connect them.';
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
                ><circle cx="2" cy="2" r="1" fill="#b8c0b2" opacity=".35" /></pattern
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
                  fill={inputValues[pin] ? '#246957' : '#e4dece'}
                  stroke={inputValues[pin] ? '#79d9b4' : '#c8c3b5'}
                />
                <text
                  x="19"
                  y="26"
                  text-anchor="middle"
                  fill={inputValues[pin] ? '#dbfff0' : '#647167'}
                  font-family="monospace"
                  font-size="20">{Number(inputValues[pin])}</text
                >
                <text x="19" y="58" text-anchor="middle" class="diagram-label">{pin}</text>
                <circle cx="38" cy="20" r="4" fill="#bd8653" />
                <foreignObject x="10" y="-8" width="56" height="56">
                  <button
                    class="svg-pin-button source-pin"
                    class:source-selected={selectedSource === pin}
                    aria-pressed={missionId === 'nand' ? inputValues[pin] : selectedSource === pin}
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
                <rect x="0" y="5" width="132" height="110" rx="9" fill="#172e39" opacity=".12" />
                <rect width="132" height="110" rx="9" fill="#203b43" stroke="#5c7671" />
                <path
                  d="M 14 -6 v 6 M 34 -6 v 6 M 54 -6 v 6 M 74 -6 v 6 M 94 -6 v 6 M 114 -6 v 6 M 14 110 v 6 M 34 110 v 6 M 54 110 v 6 M 74 110 v 6 M 94 110 v 6 M 114 110 v 6"
                  stroke="#bd8653"
                  stroke-width="4"
                />
                <text
                  x="66"
                  y="46"
                  text-anchor="middle"
                  fill="#f1ecd9"
                  font-size="18"
                  font-weight="700"
                  font-family="monospace">{gate.type.toUpperCase()}</text
                >
                <text
                  x="66"
                  y="65"
                  text-anchor="middle"
                  fill="#a6b7ac"
                  font-size="10"
                  font-family="monospace">PART {String(index + 1).padStart(2, '0')}</text
                >
                {#each gatePins(gate.type) as pin, pinIndex}
                  <circle
                    cx="0"
                    cy={25 + pinIndex * 60}
                    r="4"
                    fill={signal(gate.inputs[pin], liveSignals) === true ? '#7bd9b5' : '#bd8653'}
                  />
                  <text x="12" y={29 + pinIndex * 60} class="diagram-pin gate-pin-label">{pin}</text
                  >
                  {#if missionId !== 'nand'}
                    <foreignObject x="-28" y={pinIndex * 60 - 3} width="56" height="56">
                      <button
                        class="svg-pin-button target-pin"
                        class:target-ready={!!selectedSource &&
                          availableSources(mission, circuit, gate.id).includes(selectedSource)}
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
                  fill={signal(gate.id, liveSignals) === true ? '#7bd9b5' : '#bd8653'}
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
                  fill="#eee8d8"
                  stroke="#b9bcac"
                  stroke-dasharray="5 5"
                />
                <text
                  x="35"
                  y="17"
                  text-anchor="middle"
                  fill="#728074"
                  font-family="monospace"
                  font-size="27">+</text
                >
                <text x="35" y="41" text-anchor="middle" class="diagram-label">YOUR INVENTION</text>
              </g>
              <text x="425" y="231" text-anchor="middle" fill="#6d786f" font-size="13"
                >Pick a part below. Make something work.</text
              >
            {/if}
            {#each mission.outputs as pin, index}
              {@const outputValue = live.result?.outputs[pin]}
              <g transform={`translate(795, ${125 + index * 106})`}>
                {#if outputValue}<circle
                    cx="25"
                    cy="0"
                    r="29"
                    fill="#67d9a8"
                    opacity=".32"
                    filter="url(#bench-glow)"
                  />{/if}
                <circle
                  cx="25"
                  cy="0"
                  r="24"
                  fill={outputValue === true ? '#8bdfb6' : '#d3d6c7'}
                  stroke={outputValue === true ? '#246957' : '#9eaa9a'}
                  stroke-width="3"
                />
                <text
                  x="25"
                  y="7"
                  text-anchor="middle"
                  fill="#244b3c"
                  font-family="monospace"
                  font-size="21"
                  font-weight="700">{outputValue === undefined ? '?' : Number(outputValue)}</text
                >
                <text x="25" y="44" text-anchor="middle" class="diagram-label">{pin}</text>
                {#if missionId !== 'nand'}
                  <foreignObject x="-3" y="-28" width="56" height="56">
                    <button
                      class="svg-pin-button output-pin"
                      class:target-ready={!!selectedSource}
                      aria-label={`Connect machine output ${pin}`}
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
        <div class="board-footer">
          <span><span class="signal-key"></span> Live signal = 1</span><span
            >{circuit.gates.length} {circuit.gates.length === 1 ? 'part' : 'parts'} on board</span
          ><button on:click={() => (showHDL = !showHDL)} aria-expanded={showHDL}
            >{showHDL ? 'Hide' : 'View'} HDL <span aria-hidden="true">↗</span></button
          >
        </div>
      </div>

      {#if missionId !== 'nand'}
        <section class="parts-bay" aria-label="Circuit parts and connections">
          <div class="parts-heading">
            <div>
              <p class="eyebrow">SUPPLIED PARTS</p>
              <h2>A little logic. Endless possibility.</h2>
            </div>
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
          </div>
          <div class="part-buttons">
            {#each mission.availableParts as type}<button
                on:click={() => addGate(type)}
                disabled={circuit.gates.length >= 24}
                ><span aria-hidden="true">＋</span><strong>{type}</strong><span
                  class="part-pin-count">{gatePins(type).length} IN / 1 OUT</span
                ></button
              >{/each}
          </div>
          <p class="connection-help">
            Add a part, then wire its pins on the board or with the menus below. Earlier chips are
            supplied as reference components; your collection tracks the ones you have built.
          </p>
          {#if circuit.gates.length > 0}
            <div class="gate-controls">
              {#each circuit.gates as gate, index (gate.id)}
                <div class="gate-control">
                  <div class="gate-control-heading">
                    <span class="part-index">{String(index + 1).padStart(2, '0')}</span><strong
                      >{gate.type}</strong
                    ><button
                      aria-label={`Remove part ${index + 1}, ${gate.type}`}
                      on:click={() => removeGate(gate.id)}>×</button
                    >
                  </div>
                  {#each gatePins(gate.type) as pin}
                    <label
                      ><span>Pin <b>{pin}</b></span><select
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
            <span class="output-title">CONNECT THE MACHINE</span
            >{#each mission.outputs as pin}<label
                ><span>Output <b>{pin}</b></span><select
                  aria-label={`Machine output ${pin}`}
                  value={circuit.outputs[pin] ?? ''}
                  on:change={(event) => setOutput(pin, event.currentTarget.value)}
                  ><option value="">Choose source…</option
                  >{#each availableSources(mission, circuit) as source}<option value={source}
                      >{sourceLabel(source)}</option
                    >{/each}</select
                ></label
              >{/each}
          </div>
          <p class="draft-status">
            {saveNotice || 'Your invention stays in this browser as you build.'}
          </p>
        </section>
      {/if}

      {#if showHDL}
        <section class="hdl-panel" aria-label="Generated hardware description language">
          <div>
            <h2>The same circuit, written in HDL.</h2>
            <button on:click={copyHDL} disabled={!hdl}>{copied ? 'Copied' : 'Copy code'}</button>
          </div>
          {#if hdl}<pre><code>{hdl}</code></pre>{:else}<p>
              Connect every part and output to reveal the HDL for your design.
            </p>{/if}<a href="/experiment/hardware-ide"
            >Open the full hardware IDE <span aria-hidden="true">↗</span></a
          >
        </section>
      {/if}
    </div>

    <aside class="mission-instruments" aria-label="Mission goal and test instruments">
      <div class="goal-panel">
        <p class="eyebrow">THE JOB</p>
        <h2>{mission.goal}</h2>
        <BenchMachine
          {missionId}
          outputs={live.result?.outputs ?? null}
          inputs={inputValues}
          certified={restoreReady}
        />
        <p class="reward-copy"><span aria-hidden="true">↳</span> {mission.reward}</p>
      </div>

      {#if missionId === 'nand'}
        <section class="test-panel" aria-label="Discover NAND">
          <div class="instrument-heading">
            <span class="eyebrow">SIGNAL DISCOVERY</span><span class="case-count"
              >{predictions.length} / {scenarios.length}</span
            >
          </div>
          <h2>What comes out?</h2>
          <p>
            NAND is your first supplied part. Switch the inputs and predict its output. It switches
            off only when both inputs are on.
          </p>
          <div class="prediction-buttons">
            <button on:click={() => predict(false)}>Predict <strong>0</strong></button><button
              on:click={() => predict(true)}>Predict <strong>1</strong></button
            >
          </div>
          <p class="prediction-feedback" aria-live="polite">
            {predictionMessage ||
              `Try a=${Number(inputValues.a)}, b=${Number(inputValues.b)}. What will NAND send?`}
          </p>
          <div class="discovery-cases">
            {#each scenarios as scenario, index}<button
                class:case-discovered={predictions.includes(index)}
                class:case-selected={selectedScenario === index}
                on:click={() => {
                  inputValues = { ...scenario.inputs };
                  selectedScenario = index;
                  predictionMessage = '';
                }}
                aria-label={`Try input ${mission.inputs.map((pin) => `${pin} ${Number(scenario.inputs[pin])}`).join(', ')}${predictions.includes(index) ? ', discovered' : ''}`}
                >{mission.inputs.map((pin) => Number(scenario.inputs[pin])).join(' ')}<span
                  >{predictions.includes(index) ? '✓' : '·'}</span
                ></button
              >{/each}
          </div>
          {#if !allPredicted}<button class="next-case" on:click={nextPrediction}
              >Next undiscovered signal <span aria-hidden="true">→</span></button
            >{/if}
        </section>
      {:else}
        <section class="test-panel" aria-label="Circuit test instrument">
          <div class="instrument-heading">
            <span class="eyebrow">PROVE YOUR INVENTION</span><span class="case-count"
              >{scenarios.length} CASES</span
            >
          </div>
          <h2>Every signal matters.</h2>
          <p>
            One working combination is a start. Test every input before bringing the station online.
          </p>
          <button class="test-button" on:click={runTests}
            ><span aria-hidden="true">▷</span> Test circuit
            <span>{scenarios.length} input combinations</span></button
          >
          {#if reportError}<div class="test-error" role="alert">
              <strong>There’s an open connection.</strong>
              <p>{reportError}</p>
            </div>{/if}
          {#if report}
            <div class="test-summary" class:all-pass={report.success} aria-live="polite">
              <strong>{report.success ? 'Signal confirmed.' : 'A clue from the machine.'}</strong
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
          {:else if !reportError}<div class="waiting-signal">
              <span aria-hidden="true">⌁</span>
              <p>
                {live.result
                  ? 'Live circuit connected. Ready to test.'
                  : 'Connect your parts to begin testing.'}
              </p>
            </div>{/if}
        </section>
      {/if}

      {#if restoreReady}<section class="restore-panel" aria-live="polite">
          <span class="restore-check" aria-hidden="true">✓</span>
          <h2>
            {completed.includes(missionId)
              ? 'Still a working invention.'
              : 'You brought it to life.'}
          </h2>
          <p>
            {missionId === 'nand'
              ? 'Every NAND combination discovered. This tiny part can become every other logic gate.'
              : `Your ${mission.chip} works for every possible input.`}
          </p>
          <button class="restore-button" on:click={() => oncomplete(missionId)}
            >{completed.includes(missionId) ? 'Return to the world' : 'Bring station online'}
            <span aria-hidden="true">→</span></button
          >
        </section>{/if}

      <section class="hint-panel">
        <div>
          <h2>Stuck? Follow a clue.</h2>
          <span>No penalties. Stay curious.</span>
        </div>
        {#if hintCount > 0}<ol>
            {#each mission.hints.slice(0, hintCount) as hint}<li>{hint}</li>{/each}
          </ol>{/if}<button
          on:click={() => {
            hintCount = Math.min(mission.hints.length, hintCount + 1);
          }}
          disabled={hintCount >= mission.hints.length}
          >{hintCount === 0
            ? 'Give me a nudge'
            : hintCount >= mission.hints.length
              ? 'All clues revealed'
              : 'Another clue'} <span aria-hidden="true">↗</span></button
        >
      </section>
      {#if showGuide}<section class="field-guide">
          <div class="instrument-heading">
            <span class="eyebrow">FROM YOUR FIELD NOTES</span><button
              aria-label="Close field notes"
              on:click={() => (showGuide = false)}>×</button
            >
          </div>
          <h2>{mission.chip}, under the hood.</h2>
          <p>{mission.explanation}</p>
          <a href="/learn/hardware/boolean-logic/background"
            >Read the full background <span aria-hidden="true">↗</span></a
          ><a href="/learn/hardware/boolean-logic/project"
            >Original gate specifications <span aria-hidden="true">↗</span></a
          >
        </section>{/if}
    </aside>
  </div>
</section>

<style>
  .wiring-instruction {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 22px 0;
    color: #65745e;
    min-height: 48px;
  }
  .wiring-instruction > span {
    font: 28px monospace;
    color: #b17f4e;
  }
  .wiring-instruction p {
    font:
      11px/1.6 Arial,
      sans-serif;
    flex: 1;
    margin: 0;
  }
  .wiring-instruction button {
    font:
      10px Arial,
      sans-serif;
    white-space: nowrap;
    border: 0;
    background: none;
    color: #806a47;
    padding: 10px 0;
  }
  .bench .svg-pin-button {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #a98255;
    padding: 0;
    font: 12px monospace;
    transition: background 0.16s;
  }
  .svg-pin-button span {
    width: 13px;
    height: 13px;
    border: 2px solid #efe6d1;
    border-radius: 50%;
    background: #b78c57;
    box-shadow: 0 0 0 1px #b78c57;
  }
  .svg-pin-button:hover,
  .svg-pin-button.source-selected {
    background: #eda26538;
  }
  .svg-pin-button.source-selected span {
    background: #e78b45;
    box-shadow: 0 0 0 5px #ed985033;
  }
  .svg-pin-button.target-ready {
    background: #8ec59d20;
  }
  .svg-pin-button.target-ready span {
    background: #619779;
    box-shadow: 0 0 0 3px #8ec59d33;
  }
  .bench .output-pin span {
    width: 42px;
    height: 42px;
    background: transparent;
    border: 2px dashed #749270;
    box-shadow: none;
  }
  .bench .output-pin.target-ready span {
    background: #7fb4842b;
    border-color: #417357;
  }
  .clear-actions {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .undo-clear {
    color: #e3aa7c !important;
  }
  .bench {
    --bench-sea: #101e2b;
    --bench-panel: #f4eedf;
    --bench-ink: #20313a;
    --bench-muted: #a1b1b4;
    --bench-orange: #ed915b;
    --bench-signal: #7bd9b5;
    background: var(--bench-sea);
    color: #f4eedf;
    min-height: 100vh;
    padding: 0 42px 60px;
    font-family: Arial, Helvetica, sans-serif;
    isolation: isolate;
  }
  .bench button,
  .bench select {
    font: inherit;
  }
  .bench button {
    cursor: pointer;
  }
  .bench button:disabled {
    cursor: default;
    opacity: 0.45;
  }
  .bench button:focus-visible,
  .bench select:focus-visible,
  .bench a:focus-visible {
    outline: 3px solid #ee9255 !important;
    outline-offset: 4px;
  }
  .bench-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    max-width: 1500px;
    margin: 0 auto;
    border-bottom: 1px solid #ffffff18;
    min-height: 82px;
  }
  .world-back {
    display: flex;
    gap: 12px;
    align-items: center;
    background: none;
    border: 0;
    color: #eee8dc;
    font-size: 14px;
    font-weight: 600;
    padding: 12px 0;
  }
  .world-back span {
    font-size: 22px;
  }
  .bench-identity {
    font: 10px monospace;
    letter-spacing: 2px;
    display: flex;
    align-items: center;
    gap: 9px;
    color: #a9b7b8;
  }
  .identity-light,
  .small-light {
    width: 7px;
    height: 7px;
    background: #79d9b4;
    display: inline-block;
    border-radius: 50%;
  }
  .identity-and {
    color: #ee9255;
  }
  .slash {
    margin: 0 13px;
    color: #64777c;
  }
  .notes-trigger {
    background: #ffffff08;
    border: 1px solid #ffffff20;
    border-radius: 7px;
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 14px;
    font-size: 12px;
    color: #e6e2d7;
  }
  .mission-title-row {
    max-width: 1500px;
    margin: 36px auto 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
  }
  .eyebrow {
    font: 10px/1.5 monospace;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--bench-orange);
    margin: 0 0 11px;
  }
  .eyebrow span {
    color: #536e76;
    margin: 0 8px;
  }
  h1 {
    font-size: clamp(30px, 3.7vw, 53px);
    line-height: 1.08;
    letter-spacing: -1.8px;
    font-weight: 650;
    margin: 0 0 14px;
    max-width: 950px;
  }
  .mission-brief {
    max-width: 740px;
    color: #a8b8bb;
    font-size: 14px;
    line-height: 1.75;
    margin: 0;
  }
  .chip-stamp {
    border: 1px solid #c4d0cc2b;
    border-radius: 9px;
    min-width: 145px;
    padding: 17px 22px;
    display: grid;
    gap: 9px;
    transform: rotate(3deg);
    background: #ffffff03;
    flex-shrink: 0;
  }
  .chip-stamp span {
    font: 8px monospace;
    color: #829a9e;
    letter-spacing: 1.5px;
  }
  .chip-stamp strong {
    font: 30px monospace;
    color: #e9b382;
  }
  .bench-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 325px;
    gap: 25px;
    max-width: 1500px;
    margin: 0 auto;
    align-items: start;
  }
  .workspace {
    min-width: 0;
  }
  .board-shell {
    background: #ebe9dc;
    border-radius: 15px;
    overflow: hidden;
    border: 1px solid #c2c6b6;
    box-shadow: 0 16px 45px #0002;
    color: var(--bench-ink);
  }
  .board-heading {
    display: flex;
    align-items: center;
    gap: 9px;
    font: 9px monospace;
    letter-spacing: 1.8px;
    padding: 18px 22px;
    border-bottom: 1px solid #647a6e26;
    background: #e5e4d7;
  }
  .board-heading .small-light {
    background: #6c7d70;
    width: 6px;
    height: 6px;
  }
  .board-number {
    margin-left: auto;
    color: #7c897a;
    font-size: 8px;
  }
  .signal-inputs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    padding: 19px 22px 3px;
  }
  .switch-label {
    font: 9px monospace;
    color: #6c7b6e;
    letter-spacing: 1.3px;
    margin-right: 4px;
  }
  .input-switch {
    border: 1px solid #bfc5b4;
    border-radius: 7px;
    display: flex;
    gap: 12px;
    align-items: center;
    color: #3c5146;
    background: #f3f1e5;
    padding: 8px 10px;
    font-size: 12px;
    min-height: 39px;
  }
  .input-switch > span:first-child {
    font: 13px monospace;
    min-width: 15px;
  }
  .input-switch strong {
    font: 14px monospace;
  }
  .switch-track {
    height: 16px;
    width: 29px;
    background: #bbc4b4;
    border-radius: 10px;
    position: relative;
  }
  .switch-track i {
    position: absolute;
    left: 3px;
    top: 3px;
    width: 10px;
    height: 10px;
    background: #f7f5e8;
    border-radius: 50%;
    transition: transform 0.15s;
  }
  .input-on .switch-track {
    background: #27745b;
  }
  .input-on .switch-track i {
    transform: translateX(13px);
  }
  .input-on {
    border-color: #80b79a;
    background: #e8f0e1;
  }
  .circuit-viewport {
    overflow-x: auto;
  }
  .circuit-svg {
    width: 100%;
    min-width: 720px;
    display: block;
  }
  .diagram-label {
    font: 10px monospace;
    letter-spacing: 1px;
    fill: #687a6c;
  }
  .diagram-pin.gate-pin-label {
    fill: #9cafa1;
  }
  .diagram-pin {
    font: 10px monospace;
    fill: #64766b;
  }
  .circuit-wire {
    stroke: #bab19a;
    stroke-width: 2.6;
    fill: none;
    stroke-linecap: round;
    transition: stroke 0.2s;
  }
  .circuit-wire.wire-on {
    stroke: #459879;
    stroke-width: 3;
  }
  .board-footer {
    padding: 13px 20px;
    border-top: 1px solid #647a6e26;
    display: flex;
    align-items: center;
    gap: 20px;
    font: 9px monospace;
    color: #6c7c6d;
    letter-spacing: 0.3px;
  }
  .board-footer > span:first-child {
    display: flex;
    gap: 7px;
    align-items: center;
  }
  .signal-key {
    height: 6px;
    width: 6px;
    background: #459879;
    border-radius: 50%;
  }
  .board-footer button {
    margin-left: auto;
    border: 0;
    background: none;
    color: #516e5e;
    padding: 3px;
  }
  .parts-bay {
    padding-top: 27px;
  }
  .parts-heading {
    display: flex;
    justify-content: space-between;
    gap: 15px;
    align-items: center;
  }
  .parts-heading .eyebrow {
    color: #8ba3a6;
    margin-bottom: 5px;
    font-size: 9px;
  }
  .parts-heading h2 {
    font-size: 19px;
    font-weight: 500;
    letter-spacing: -0.4px;
    margin: 0;
  }
  .reset-button {
    background: none;
    border: 0;
    color: #9aafb0;
    font-size: 11px;
    padding: 8px 0;
  }
  .part-buttons {
    display: flex;
    gap: 10px;
    margin-top: 18px;
    flex-wrap: wrap;
  }
  .part-buttons button {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid #48626a;
    background: #203541;
    border-radius: 8px;
    min-height: 49px;
    color: #ede7d9;
    padding: 9px 13px;
    transition:
      border-color 0.16s,
      transform 0.16s;
  }
  .part-buttons button:hover:not(:disabled) {
    border-color: #ed915b;
    transform: translateY(-2px);
  }
  .part-buttons button > span:first-child {
    color: #eda36f;
    font-size: 21px;
  }
  .part-buttons strong {
    font: 13px monospace;
  }
  .part-pin-count {
    font: 8px monospace;
    color: #819ca1;
    letter-spacing: 0.5px;
  }
  .connection-help {
    font-size: 11px;
    line-height: 1.65;
    color: #8da5a9;
    margin: 12px 0 16px;
  }
  .gate-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 215px), 1fr));
    gap: 11px;
  }
  .gate-control {
    background: #192d39;
    border: 1px solid #334e59;
    border-radius: 9px;
    padding: 13px;
    min-width: 0;
  }
  .gate-control-heading {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 12px;
  }
  .part-index {
    font: 9px monospace;
    color: #e5a878;
    background: #e7945720;
    border-radius: 4px;
    padding: 5px;
  }
  .gate-control-heading strong {
    font: 14px monospace;
  }
  .gate-control-heading button {
    margin-left: auto;
    background: none;
    border: 0;
    color: #95a7a9;
    font-size: 19px;
    width: 27px;
    height: 27px;
  }
  .gate-control label,
  .output-connections label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 9px;
    font-size: 10px;
    color: #9bb1b4;
  }
  .gate-control label > span {
    min-width: 32px;
  }
  .gate-control label b,
  .output-connections label b {
    color: #e6e3d6;
    font: 11px monospace;
  }
  .gate-control select,
  .output-connections select {
    min-width: 0;
    flex: 1;
    max-width: 195px;
    border: 1px solid #3d5962;
    background: #122330;
    color: #e2e6da;
    border-radius: 5px;
    padding: 9px 7px;
    font-size: 11px;
    min-height: 34px;
  }
  .output-connections {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 22px;
    align-items: center;
    border: 1px dashed #4b655f;
    border-radius: 9px;
    padding: 13px 15px;
    margin-top: 14px;
    background: #1a302f77;
  }
  .output-title {
    font: 9px monospace;
    letter-spacing: 1px;
    color: #89b69e;
  }
  .output-connections label {
    margin: 0;
    flex: 1;
    min-width: 170px;
  }
  .draft-status {
    font: 9px/1.6 monospace;
    color: #728d94;
    margin-top: 12px;
  }
  .mission-instruments {
    display: grid;
    gap: 15px;
    min-width: 0;
  }
  .goal-panel {
    padding: 23px 23px 19px;
    border: 1px solid #35505a;
    background: #172c38;
    border-radius: 12px;
    overflow: hidden;
  }
  .goal-panel .eyebrow {
    font-size: 9px;
  }
  .goal-panel h2 {
    font-size: 20px;
    line-height: 1.4;
    letter-spacing: -0.4px;
    margin: 0;
    font-weight: 500;
    color: #eee9d8;
  }
  .reward-copy {
    font-size: 11px;
    line-height: 1.7;
    color: #a6bab7;
    display: flex;
    gap: 8px;
    margin: 16px 0 0;
  }
  .reward-copy span {
    color: #d39e70;
  }
  .test-panel {
    background: #f4eedf;
    color: #203b3c;
    border-radius: 12px;
    padding: 23px;
  }
  .instrument-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .test-panel .eyebrow {
    color: #797666;
    font-size: 8px;
    letter-spacing: 1.3px;
    margin: 0;
  }
  .case-count {
    font: 9px monospace;
    color: #8a7862;
    white-space: nowrap;
  }
  .test-panel h2 {
    font-size: 22px;
    font-weight: 550;
    letter-spacing: -0.7px;
    margin: 14px 0 10px;
  }
  .test-panel > p {
    font-size: 12px;
    line-height: 1.7;
    color: #6b736b;
    margin: 0 0 16px;
  }
  .test-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    flex-wrap: wrap;
    background: #e88e57;
    color: #172e32;
    border: 1px solid #ce7a49;
    border-radius: 7px;
    padding: 13px 10px;
    width: 100%;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 3px 0 #ad663b;
  }
  .test-button > span:first-child {
    font-size: 22px;
    line-height: 0.8;
  }
  .test-button > span:last-child {
    width: 100%;
    font: 8px monospace;
    letter-spacing: 0.7px;
    color: #674f39;
  }
  .waiting-signal {
    display: flex;
    gap: 9px;
    align-items: center;
    margin-top: 18px;
    color: #91917d;
  }
  .waiting-signal > span {
    font: 27px monospace;
  }
  .waiting-signal p {
    font: 9px/1.65 monospace;
    margin: 0;
  }
  .test-error {
    margin-top: 20px;
    padding: 13px;
    border-left: 3px solid #b77954;
    background: #e8dfcc;
  }
  .test-error strong {
    font-size: 12px;
  }
  .test-error p {
    font-size: 11px;
    line-height: 1.6;
    overflow-wrap: anywhere;
    margin: 6px 0 0;
  }
  .test-summary {
    margin-top: 20px;
    border-left: 3px solid #c38d54;
    padding-left: 11px;
    display: grid;
    gap: 6px;
  }
  .test-summary strong {
    font-size: 13px;
  }
  .test-summary span {
    font-size: 11px;
    color: #7b7866;
  }
  .all-pass {
    border-color: #3b8c66;
  }
  .truth-table-wrap {
    margin-top: 16px;
    overflow-x: auto;
  }
  .truth-table {
    width: 100%;
    font: 10px monospace;
    border-collapse: collapse;
  }
  .truth-table th {
    font-weight: 400;
    color: #6b7b6e;
    text-align: center;
    padding: 8px 3px;
    border-bottom: 1px solid #b7bfab;
  }
  .truth-table td {
    padding: 7px 3px;
    text-align: center;
    color: #3c5d4d;
    border-bottom: 1px solid #d3d4c3;
  }
  .truth-table caption {
    text-align: left;
    caption-side: bottom;
    font:
      9px/1.5 Arial,
      sans-serif;
    color: #84917c;
    padding-top: 9px;
  }
  .truth-table button {
    height: 24px;
    min-width: 27px;
    background: #d8e4ce;
    color: #31654b;
    border: 0;
    border-radius: 4px;
    font-size: 13px;
  }
  .truth-table .row-failed td {
    color: #985532;
    background: #e9e2ce;
  }
  .row-failed button {
    background: #d8b99b;
    color: #644027;
  }
  .test-clue {
    font-size: 10px !important;
    margin: 13px 0 0 !important;
    line-height: 1.7 !important;
  }
  .prediction-buttons {
    display: flex;
    gap: 9px;
  }
  .prediction-buttons button {
    flex: 1;
    border: 1px solid #bfc4b0;
    border-radius: 7px;
    background: #e7e5d6;
    padding: 12px 9px;
    color: #526553;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-size: 12px;
  }
  .prediction-buttons strong {
    font: 23px monospace;
    color: #233e3b;
  }
  .prediction-feedback {
    font-size: 11px !important;
    margin: 14px 0 !important;
    min-height: 38px;
  }
  .discovery-cases {
    display: flex;
    gap: 6px;
  }
  .discovery-cases button {
    font: 11px monospace;
    background: #e9e5d5;
    border: 1px solid #c7c6b3;
    color: #7e806c;
    border-radius: 5px;
    padding: 9px 8px;
    flex: 1;
    display: grid;
    gap: 5px;
  }
  .discovery-cases .case-discovered {
    background: #d2e4ce;
    border-color: #9bb998;
    color: #39684f;
  }
  .discovery-cases .case-selected {
    box-shadow: inset 0 0 0 1px #687a5f;
  }
  .next-case {
    background: none;
    border: 0;
    margin: 14px 0 0;
    padding: 4px 0;
    display: flex;
    justify-content: space-between;
    width: 100%;
    color: #486b53;
    font-size: 10px;
  }
  .hint-panel {
    padding: 21px 22px;
    border: 1px solid #344e59;
    border-radius: 11px;
    background: #132734;
  }
  .hint-panel h2 {
    font-size: 13px;
    margin: 0 0 6px;
    color: #dedfcf;
  }
  .hint-panel > div > span {
    font-size: 10px;
    color: #7f9a9f;
  }
  .hint-panel button {
    border: 0;
    background: none;
    padding: 13px 0 0;
    color: #e7b184;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
  .hint-panel ol {
    padding-left: 16px;
    margin: 15px 0 0;
  }
  .hint-panel li {
    font-size: 11px;
    line-height: 1.75;
    color: #b3c3c1;
    margin-bottom: 9px;
    padding-left: 4px;
  }
  .restore-panel {
    padding: 25px 22px;
    border: 1px solid #4a8a6c;
    background: #1b3d35;
    border-radius: 12px;
    text-align: center;
  }
  .restore-check {
    display: grid;
    place-items: center;
    margin: 0 auto 12px;
    border: 1px solid #80d4a0;
    background: #3f6850;
    color: #c5efb7;
    border-radius: 50%;
    width: 33px;
    height: 33px;
  }
  .restore-panel h2 {
    font-size: 19px;
    letter-spacing: -0.4px;
    margin: 0 0 10px;
    color: #dcedd5;
  }
  .restore-panel p {
    font-size: 11px;
    color: #a1c5ae;
    line-height: 1.75;
    margin: 0 0 17px;
  }
  .restore-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: #b6dfa3;
    border: 0;
    border-bottom: 3px solid #81a376;
    border-radius: 7px;
    color: #254536;
    font-size: 12px;
    font-weight: 700;
    width: 100%;
    padding: 14px;
  }
  .field-guide {
    border: 1px solid #9b8a68;
    border-radius: 11px;
    background: #e9e1ca;
    color: #3f5046;
    padding: 22px;
  }
  .field-guide .eyebrow {
    color: #7e725c;
    font-size: 8px;
    letter-spacing: 1px;
    margin: 0;
  }
  .field-guide button {
    background: none;
    border: 0;
    font-size: 21px;
    color: #7e725c;
  }
  .field-guide h2 {
    font-size: 20px;
    line-height: 1.3;
    margin: 12px 0;
  }
  .field-guide p {
    font-size: 12px;
    line-height: 1.9;
  }
  .field-guide a {
    display: block;
    color: #6a7655;
    font-size: 10px;
    padding-top: 12px;
  }
  .hdl-panel {
    background: #122430;
    border: 1px solid #36545b;
    border-radius: 11px;
    padding: 22px;
    margin-top: 22px;
  }
  .hdl-panel > div {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
  }
  .hdl-panel h2 {
    font-size: 15px;
    font-weight: 400;
    margin: 0;
    color: #c9d7d0;
  }
  .hdl-panel button {
    background: #28433f;
    border: 1px solid #527166;
    border-radius: 5px;
    padding: 7px 11px;
    color: #b0ceb7;
    font-size: 11px;
    white-space: nowrap;
  }
  .hdl-panel pre {
    font: 12px/1.8 monospace;
    color: #aacbb7;
    overflow: auto;
    padding: 18px 0;
    max-height: 350px;
  }
  .hdl-panel p {
    font-size: 12px;
    color: #8fa8ab;
    line-height: 1.8;
    padding: 15px 0;
  }
  .hdl-panel a {
    font-size: 11px;
    color: #d4a178;
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
  @media (min-width: 1600px) {
    .bench-layout {
      grid-template-columns: minmax(0, 1fr) 350px;
      gap: 30px;
    }
  }
  @media (max-width: 1100px) {
    .bench {
      padding: 0 24px 45px;
    }
    .bench-layout {
      grid-template-columns: minmax(0, 1fr) 290px;
      gap: 18px;
    }
    .test-panel,
    .goal-panel {
      padding: 19px;
    }
    .board-number {
      display: none;
    }
    .board-footer {
      gap: 12px;
      font-size: 8px;
    }
    .bench-identity {
      font-size: 8px;
      letter-spacing: 1px;
    }
    .bench-identity .slash {
      margin: 0 6px;
    }
    .part-pin-count {
      display: none;
    }
    .mission-title-row {
      margin-top: 28px;
    }
    .chip-stamp {
      min-width: 125px;
      padding: 15px;
    }
    .gate-controls {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
    }
  }
  @media (max-width: 850px) {
    .bench-layout {
      grid-template-columns: minmax(0, 1fr);
    }
    .mission-instruments {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
    .goal-panel {
      grid-column: 1;
    }
    .test-panel {
      grid-column: 2;
      grid-row: 1 / span 3;
    }
    .hint-panel,
    .restore-panel,
    .field-guide {
      grid-column: 1;
    }
    .bench-identity {
      display: none;
    }
    .chip-stamp {
      display: none;
    }
    .mission-title-row {
      margin-bottom: 23px;
    }
    .signal-inputs {
      padding-top: 16px;
    }
    .circuit-svg {
      min-width: 720px;
    }
    .bench-header {
      min-height: 68px;
    }
    .mission-brief {
      max-width: 650px;
    }
  }
  @media (max-width: 550px) {
    .bench {
      padding: 0 16px 32px;
    }
    .bench-header {
      min-height: 65px;
      gap: 12px;
    }
    .world-back {
      font-size: 12px;
    }
    .notes-trigger {
      padding: 9px 10px;
      font-size: 11px;
    }
    .mission-title-row {
      margin-top: 25px;
    }
    .eyebrow {
      font-size: 8px;
      letter-spacing: 1.5px;
    }
    h1 {
      font-size: 35px;
      letter-spacing: -1px;
    }
    .mission-brief {
      font-size: 12px;
      line-height: 1.8;
    }
    .bench-layout {
      gap: 24px;
    }
    .board-heading {
      padding: 14px 16px;
      font-size: 8px;
    }
    .signal-inputs {
      padding: 14px 15px 3px;
      gap: 9px;
    }
    .switch-label {
      width: 100%;
      font-size: 8px;
    }
    .input-switch {
      gap: 10px;
      min-height: 40px;
    }
    .circuit-svg {
      min-width: 720px;
    }
    .board-footer {
      padding: 13px 14px;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 8px;
    }
    .board-footer > span:nth-child(2) {
      display: none;
    }
    .parts-heading h2 {
      font-size: 17px;
      max-width: 200px;
      line-height: 1.4;
    }
    .parts-heading .eyebrow {
      font-size: 8px;
    }
    .parts-bay {
      padding-top: 23px;
    }
    .part-buttons {
      gap: 8px;
    }
    .part-buttons button {
      padding: 8px 11px;
      gap: 9px;
      min-height: 44px;
    }
    .gate-controls {
      grid-template-columns: minmax(0, 1fr);
    }
    .gate-control {
      padding: 15px;
    }
    .gate-control label {
      font-size: 11px;
    }
    .gate-control select {
      max-width: 235px;
      font-size: 12px;
      min-height: 41px;
    }
    .gate-control-heading button {
      width: 35px;
      height: 35px;
    }
    .output-connections {
      gap: 12px;
      display: block;
    }
    .output-title {
      display: block;
      margin-bottom: 13px;
    }
    .output-connections label {
      margin-top: 11px;
      gap: 15px;
    }
    .output-connections select {
      max-width: 230px;
      min-height: 41px;
      font-size: 12px;
    }
    .mission-instruments {
      grid-template-columns: 1fr;
      gap: 15px;
    }
    .goal-panel {
      grid-column: auto;
      grid-row: auto;
      display: grid;
      grid-template-columns: 1fr 110px;
      column-gap: 5px;
      padding: 20px;
    }
    .goal-panel .eyebrow {
      grid-column: 1;
    }
    .goal-panel h2 {
      font-size: 20px;
      grid-column: 1;
      grid-row: 2;
    }

    .goal-panel :global(.bench-machine) {
      grid-column: 2;
      grid-row: 1 / span 3;
    }
    .reward-copy {
      grid-column: 1;
      font-size: 10px;
    }
    .test-panel,
    .hint-panel,
    .restore-panel,
    .field-guide {
      grid-column: auto;
      grid-row: auto;
    }
    .test-panel {
      padding: 22px;
    }
    .test-button {
      min-height: 54px;
    }
    .truth-table {
      font-size: 12px;
    }
    .truth-table td {
      padding: 8px 5px;
    }
    .truth-table button {
      height: 36px;
      min-width: 36px;
    }
    .truth-table caption {
      font-size: 10px;
    }
    .hint-panel button {
      min-height: 42px;
    }
    .prediction-buttons button {
      min-height: 53px;
    }
    .discovery-cases button {
      min-height: 53px;
    }
    .next-case {
      min-height: 40px;
      align-items: center;
    }
    .hdl-panel {
      padding: 17px;
    }
    .hdl-panel > div {
      align-items: start;
    }
    .hdl-panel h2 {
      font-size: 13px;
      line-height: 1.5;
    }
    .hdl-panel pre {
      font-size: 11px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bench * {
      transition: none !important;
      animation: none !important;
    }
  }
</style>

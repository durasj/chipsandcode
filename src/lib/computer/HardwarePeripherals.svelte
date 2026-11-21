<script lang="ts">
  import type { HDLCircuit } from './hdl.js';
  import { assemble, parseHack } from './hack.js';

  export let circuit: HDLCircuit | undefined;
  export let revision = 0;
  export let onupdate: () => void = () => {};

  let romSource = '@7\nD=A\n@R0\nM=D\n';
  let romFormat = 'assembly';
  let keyboardValue = '0';
  let inspectAddress = '0';
  let memoryValue: number | null = null;
  let inspectingMemory = false;
  let peripheralError = '';
  let memoryError = '';
  let status = '';
  let previousCircuit: HDLCircuit | undefined;

  // The runtime mutates in place. Revision lets manual steps and test runs
  // refresh this inspector without replacing the compiled circuit.
  $: synchronize(circuit, revision);

  function synchronize(current: HDLCircuit | undefined, _revision: number) {
    if (current !== previousCircuit) {
      previousCircuit = current;
      inspectingMemory = false;
      memoryValue = null;
      memoryError = '';
      peripheralError = '';
      status = '';
    }
    keyboardValue = String(current?.readMemory(24576) ?? 0);
    if (inspectingMemory) inspectMemory();
  }

  function loadProgram() {
    if (!circuit) return;
    peripheralError = '';
    status = '';
    try {
      const words = romFormat === 'assembly' ? assemble(romSource).words : parseHack(romSource);
      if (!words.length) throw new Error('Add at least one program instruction.');
      circuit.loadROM(words);
      status = `${words.length} instructions loaded into ROM. Advance the clock to execute them.`;
      onupdate();
      if (inspectingMemory) inspectMemory();
    } catch (problem) {
      peripheralError = problem instanceof Error ? problem.message : String(problem);
    }
  }

  function setKeyboard() {
    if (!circuit) return;
    peripheralError = '';
    status = '';
    const value = Number(keyboardValue);
    if (!keyboardValue.trim() || !Number.isInteger(value) || value < 0 || value > 32767) {
      peripheralError = 'Keyboard code must be an integer from 0 to 32767.';
      return;
    }
    try {
      circuit.setKeyboard(value);
      status = `Keyboard code set to ${value}.`;
      onupdate();
      if (inspectingMemory) inspectMemory();
    } catch (problem) {
      peripheralError = problem instanceof Error ? problem.message : String(problem);
    }
  }

  function inspectMemory() {
    memoryError = '';
    memoryValue = null;
    if (!circuit) return;
    try {
      const address = Number(inspectAddress);
      if (!inspectAddress.trim() || !Number.isInteger(address) || address < 0 || address > 24576)
        throw new Error('Choose a mapped memory address from 0 to 24576.');
      memoryValue = circuit.readMemory(address);
      inspectingMemory = true;
    } catch (problem) {
      inspectingMemory = false;
      memoryError = problem instanceof Error ? problem.message : String(problem);
    }
  }
</script>

<details class="hardware-peripherals">
  <summary>ROM and keyboard</summary>
  <p>
    Supply a program for ROM32K or Computer, set the keyboard value, and inspect the memory inside
    your circuit.
  </p>
  <div class="field-row">
    <label
      >Program format<select bind:value={romFormat}
        ><option value="assembly">Hack assembly</option><option value="binary">Binary .hack</option
        ></select
      ></label
    ><button type="button" on:click={loadProgram} disabled={!circuit}>Load ROM</button>
  </div>
  <label
    >ROM program<textarea
      bind:value={romSource}
      spellcheck="false"
      autocapitalize="off"
      aria-label="ROM program"
    ></textarea></label
  >
  <div class="field-row">
    <label>Keyboard code<input type="text" inputmode="numeric" bind:value={keyboardValue} /></label
    ><button type="button" on:click={setKeyboard} disabled={!circuit}>Set keyboard</button>
  </div>
  {#if status}<p role="status">{status}</p>{/if}
  {#if peripheralError}<p class="error" role="alert">{peripheralError}</p>{/if}
  <h3>Inspect memory</h3>
  <p>The selected word updates as you advance the clock or run tests.</p>
  <div class="field-row">
    <label
      >Memory address<input
        type="text"
        inputmode="numeric"
        bind:value={inspectAddress}
        on:input={() => {
          inspectingMemory = false;
          memoryValue = null;
          memoryError = '';
        }}
      /></label
    ><button type="button" on:click={inspectMemory} disabled={!circuit}>Inspect memory</button>
  </div>
  <p>Memory word: <output data-testid="chip-memory-word">{memoryValue ?? '—'}</output></p>
  {#if memoryError}<p class="error" role="alert">{memoryError}</p>{/if}
</details>

<style>
  .hardware-peripherals {
    padding: 20px 22px;
    border-top: 1px solid #414960;
    color: #edf0fc;
    min-width: 0;
  }
  summary {
    cursor: pointer;
    min-height: 24px;
    font-size: 16px;
  }
  p {
    color: #bdc4da;
    font-size: 14px;
    line-height: 1.7;
    margin: 14px 0;
    overflow-wrap: anywhere;
  }
  h3 {
    margin: 26px 0 12px;
    font-size: 16px;
    font-weight: 500;
  }
  .field-row {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 12px;
    margin: 18px 0;
  }
  label {
    display: grid;
    gap: 8px;
    min-width: 0;
    color: #c9cee0;
    font-size: 14px;
  }
  .field-row label {
    flex: 1 1 170px;
    max-width: 360px;
  }
  input,
  select,
  textarea,
  button {
    box-sizing: border-box;
    min-height: 44px;
    border: 1px solid #77829c;
    border-radius: 4px;
    background: #151a2a;
    color: #edf0fc;
    font: inherit;
    padding: 10px 12px;
  }
  input,
  select,
  textarea {
    width: 100%;
    min-width: 0;
  }
  textarea {
    min-height: 180px;
    resize: vertical;
    background: #10131f;
    font:
      14px/1.6 ui-monospace,
      monospace;
    tab-size: 2;
  }
  button {
    cursor: pointer;
    font-size: 14px;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  :is(summary, input, select, textarea, button):focus-visible {
    outline: 2px solid #d0c7ff;
    outline-offset: 3px;
  }
  output {
    color: #eeeaff;
    font-family: ui-monospace, monospace;
  }
  .error {
    color: #ffb7b7;
  }
  @media (max-width: 520px) {
    .hardware-peripherals {
      padding: 16px;
    }
  }
</style>

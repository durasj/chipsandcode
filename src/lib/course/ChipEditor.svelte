<script lang="ts">
  import { builtinContracts } from '#lib/computer/hdl.js';
  import { permittedParts, type CourseTask } from './data.js';
  export let task: CourseTask;
  export let source: string;
  export let mode: 'visual' | 'code' | 'split' = 'visual';
  type Part = { type: string; connections: Record<string, string> };
  let slicePin = '';
  let sliceWire = '';
  let parts: Part[] = [];
  let selected = 0;
  let nextPart = 'Not';
  let readable = true;
  let lastWritten = '';
  $: choices = permittedParts(task).filter((name) => builtinContracts[name]);
  $: if (!choices.includes(nextPart)) nextPart = choices[0] ?? 'Nand';
  $: if (source !== lastWritten) parse(source);
  function parse(text: string) {
    const clean = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    const body = clean.split(/PARTS\s*:/)[1]?.replace(/}\s*$/, '');
    if (body === undefined) {
      readable = false;
      return;
    }
    const parsed: Part[] = [];
    let rest = body;
    for (const match of body.matchAll(/(\w+)\s*\(([^)]*)\)\s*;/g)) {
      const connections: Record<string, string> = {};
      for (const pair of match[2].split(',').filter((p) => p.trim())) {
        const binding = pair.split('=');
        if (binding.length !== 2) {
          readable = false;
          return;
        }
        if (binding[0].trim() in connections) {
          readable = false;
          return;
        }
        connections[binding[0].trim()] = binding[1].trim();
      }
      parsed.push({ type: match[1], connections });
      rest = rest.replace(match[0], '');
    }
    readable = !rest.trim();
    if (readable) {
      parts = parsed;
      selected = Math.min(selected, Math.max(0, parts.length - 1));
    }
  }
  function write() {
    const declarations = (values: Record<string, number>) =>
      Object.entries(values)
        .map(([name, width]) => name + (width > 1 ? `[${width}]` : ''))
        .join(', ');
    source = `CHIP ${task.chip} {\n${Object.keys(task.inputs ?? {}).length ? `    IN ${declarations(task.inputs!)};\n` : ''}${Object.keys(task.outputs ?? {}).length ? `    OUT ${declarations(task.outputs!)};\n` : ''}\n    PARTS:\n${parts
      .map(
        (part) =>
          `    ${part.type}(${Object.entries(part.connections)
            .map(([pin, wire]) => `${pin}=${wire}`)
            .join(', ')});`,
      )
      .join('\n')}\n}\n`;
    lastWritten = source;
  }
  function add() {
    const contract = builtinContracts[nextPart];
    parts = [
      ...parts,
      {
        type: nextPart,
        connections: Object.fromEntries(
          [...Object.keys(contract.inputs), ...Object.keys(contract.outputs)].map((pin) => [
            pin,
            '',
          ]),
        ),
      },
    ];
    selected = parts.length - 1;
    write();
  }
  function connect(pin: string, value: string) {
    parts[selected].connections[pin] = value;
    parts = [...parts];
    write();
  }
  function connectSlice() {
    if (!/^[A-Za-z_][A-Za-z0-9_]*(?:\[\d+(?:\.\.\d+)?\])?$/.test(slicePin) || !sliceWire.trim())
      return;
    const base = slicePin.split('[')[0];
    if (slicePin !== base) delete parts[selected].connections[base];
    parts[selected].connections[slicePin] = sliceWire.trim();
    parts = [...parts];
    slicePin = '';
    sliceWire = '';
    write();
  }
  function remove() {
    parts = parts.filter((_, i) => i !== selected);
    selected = Math.max(0, selected - 1);
    write();
  }
</script>

<div class="construction" class:split={mode === 'split'}>
  {#if mode !== 'code'}
    <section class="visual-construction" aria-label="Visual circuit construction">
      {#if !readable}<p class="course-warning">
          This code uses incomplete syntax or repeated pin bindings. Edit it in Code view; the
          visual editor preserves your source.
        </p>
      {:else}
        <div class="part-controls">
          <label
            >Part<select aria-label="Part to add" bind:value={nextPart}
              >{#each choices as name (name)}<option value={name}>{name}</option>{/each}</select
            ></label
          ><button class="secondary" on:click={add}>Add part</button>
        </div>
        {#if !parts.length}<p class="construction-empty">
            Add a part, then connect its pins to inputs, outputs, or named internal wires.
          </p>{/if}
        <div class="part-strip" aria-label="Circuit parts">
          {#each parts as part, index (index)}<button
              class:selected={selected === index}
              aria-pressed={selected === index}
              on:click={() => (selected = index)}><span>{index + 1}</span> {part.type}</button
            >{/each}
        </div>
        {#if parts[selected]}
          {@const part = parts[selected]}
          <div class="part-connections">
            <div class="part-title">
              <h2>{part.type} <span>Part {selected + 1}</span></h2>
              <button class="text-action" on:click={remove}>Remove part</button>
            </div>
            {#each Object.entries(part.connections) as [pin, wire] (pin)}<label
                class="connection-row"
                ><span
                  >{pin}<small
                    >{builtinContracts[part.type]?.inputs[pin] ? 'input' : 'output'}</small
                  ></span
                ><span aria-hidden="true">→</span><input
                  aria-label={`Part ${selected + 1} pin ${pin} ${builtinContracts[part.type]?.inputs[pin] ? 'input' : 'output'}`}
                  value={wire}
                  placeholder="wire or pin[0..7]"
                  spellcheck="false"
                  on:input={(event) => connect(pin, event.currentTarget.value)}
                /></label
              >{/each}
            <details class="pin-slices">
              <summary>Connect part pin slices</summary>
              <p class="muted">
                Split a bus pin into slices when different wires supply different bits. Connecting a
                slice replaces that pin’s whole-bus binding.
              </p>
              <label
                >Part pin or slice<input
                  bind:value={slicePin}
                  placeholder="b[0]"
                  aria-label="Part pin or slice"
                /></label
              ><label
                >Connect to<input
                  bind:value={sliceWire}
                  placeholder="true"
                  aria-label="Connect to"
                /></label
              ><button class="secondary" on:click={connectSlice}>Connect slice</button>
            </details>
            <p class="muted">
              Examples: <code>in[0]</code>, <code>out[0..7]</code>, <code>carry</code>,
              <code>true</code>. An output creates an internal wire when you give it a new name.
            </p>
          </div>
        {/if}
      {/if}
    </section>
  {/if}
  {#if mode !== 'visual'}<label class="source-editor"
      >HDL source<textarea
        aria-label="HDL source"
        bind:value={source}
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
      ></textarea></label
    >{/if}
</div>

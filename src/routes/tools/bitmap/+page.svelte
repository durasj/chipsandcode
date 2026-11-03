<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import '#lib/tools/lab.css';
  import '#lib/computer/workspace.css';
  import { bitmapWords, bitmapJack, bitmapAssembly } from '#lib/computer/bitmap.js';
  let width = 16,
    height = 16,
    draftWidth = '16',
    draftHeight = '16';
  let pixels = Array<boolean>(256).fill(false);
  let x = '0',
    y = '0';
  let pixelSize = 24;
  let focusIndex = 0;
  let paint = false;
  let painting = false;
  let outputMode = 'jack';
  let ready = false,
    error = '',
    notice = '';
  let pixelGrid: HTMLDivElement;
  let fileInput: HTMLInputElement;
  $: bitmap = { width, height, pixels };
  $: generated = generate(bitmap, x, y, outputMode);
  function generate(
    drawing: { width: number; height: number; pixels: boolean[] },
    positionX: string,
    positionY: string,
    format: string,
  ) {
    try {
      const px = Number(positionX),
        py = Number(positionY);
      if (!positionX.trim() || !positionY.trim()) throw new Error('Choose a screen position.');
      const words = bitmapWords(drawing, px, py);
      return {
        code:
          format === 'jack'
            ? bitmapJack(drawing, px, py)
            : format === 'assembly'
              ? bitmapAssembly(drawing, px, py)
              : words.map((word) => `${word.address}: ${word.value}`).join('\n'),
        error: '',
      };
    } catch (problem) {
      return { code: '', error: problem instanceof Error ? problem.message : String(problem) };
    }
  }
  onMount(() => {
    try {
      const value = JSON.parse(localStorage.getItem('chipsandcode.bitmap.v1') || 'null');
      if (value) load(value);
    } catch {
      notice = 'Your drawing can only be kept for this session.';
    }
    ready = true;
  });
  function save() {
    try {
      localStorage.setItem('chipsandcode.bitmap.v1', JSON.stringify({ width, height, pixels }));
    } catch {
      notice = 'Your drawing can only be kept for this session.';
    }
  }
  function toggle(index: number) {
    pixels = pixels.map((value, i) => (i === index ? !value : value));
    focusIndex = index;
    save();
  }
  function begin(index: number, event: PointerEvent) {
    if (event.button !== 0) return;
    painting = true;
    // Capture on the whole grid so touch dragging can cross individual buttons.
    try {
      pixelGrid.setPointerCapture(event.pointerId);
    } catch {
      /* Synthetic pointers can lack an active capture target. */
    }
    paint = !pixels[index];
    pixels = pixels.map((value, i) => (i === index ? paint : value));
    focusIndex = index;
    save();
  }
  function drag(index: number, event: PointerEvent) {
    if (!painting || event.buttons !== 1) return;
    pixels = pixels.map((value, i) => (i === index ? paint : value));
    save();
  }
  function pointerMove(event: PointerEvent) {
    if (!painting || (event.buttons !== 1 && event.pressure === 0)) return;
    const rect = pixelGrid.getBoundingClientRect();
    const column = Math.floor((event.clientX - rect.left) / (pixelSize + 1));
    const row = Math.floor((event.clientY - rect.top) / (pixelSize + 1));
    if (column < 0 || column >= width || row < 0 || row >= height) return;
    const index = row * width + column;
    if (pixels[index] !== paint) {
      pixels = pixels.map((value, i) => (i === index ? paint : value));
      save();
    }
  }
  function move(index: number, event: KeyboardEvent) {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -width,
      ArrowDown: width,
    };
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggle(index);
      return;
    }
    if (!(event.key in offsets)) return;
    event.preventDefault();
    focusIndex = Math.max(0, Math.min(pixels.length - 1, index + offsets[event.key]));
    pixelGrid.querySelector<HTMLButtonElement>(`[data-index="${focusIndex}"]`)?.focus();
  }
  function resize() {
    const w = Number(draftWidth),
      h = Number(draftHeight);
    error = '';
    if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 64 || h > 64) {
      error = 'Width and height must be integers from 1 to 64.';
      return;
    }
    const previous = pixels,
      oldWidth = width,
      oldHeight = height;
    pixels = Array.from({ length: w * h }, (_, i) =>
      Math.floor(i / w) < oldHeight && i % w < oldWidth
        ? previous[Math.floor(i / w) * oldWidth + (i % w)]
        : false,
    );
    width = w;
    height = h;
    focusIndex = 0;
    save();
  }
  function load(value: unknown) {
    if (
      !value ||
      typeof value !== 'object' ||
      !('width' in value) ||
      !('height' in value) ||
      !('pixels' in value) ||
      typeof value.width !== 'number' ||
      typeof value.height !== 'number' ||
      !Array.isArray(value.pixels) ||
      !value.pixels.every((pixel: unknown) => typeof pixel === 'boolean')
    )
      throw new Error('Choose a bitmap JSON file with width, height, and boolean pixels.');
    bitmapWords({ width: value.width, height: value.height, pixels: value.pixels });
    width = value.width;
    height = value.height;
    pixels = value.pixels;
    draftWidth = String(width);
    draftHeight = String(height);
    focusIndex = 0;
  }
  async function importFile(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    error = '';
    try {
      if (file.size > 100000) throw new Error('Choose a bitmap file smaller than 100 KB.');
      load(JSON.parse(await file.text()));
      save();
    } catch (problem) {
      error = problem instanceof Error ? problem.message : String(problem);
    }
    fileInput.value = '';
  }
  function download(text: string, name: string) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head><title>Bitmap editor · Tools · Chips and Code</title></svelte:head>
<main class="logic-lab machine-lab" data-ready={ready} aria-labelledby="bitmap-title">
  <a class="back-link" href={resolve('/tools')}>← Tools</a>
  <header class="tool-heading">
    <p class="eyebrow">Pixels become memory</p>
    <h1 id="bitmap-title">Bitmap editor</h1>
    <p class="tool-intro">Draw a sprite. See the screen words and code that create it.</p>
  </header>
  <div class="workspace-toolbar">
    <button
      class="action"
      on:click={() => {
        pixels = pixels.map(() => false);
        save();
      }}>Clear</button
    ><button
      class="action"
      on:click={() => {
        pixels = pixels.map((value) => !value);
        save();
      }}>Invert</button
    ><label
      >Pixel size<select bind:value={pixelSize}
        ><option value={16}>Small</option><option value={24}>Medium</option><option value={32}
          >Large</option
        ></select
      ></label
    >
  </div>
  <div class="machine-grid">
    <section aria-label="Drawing">
      <div class="pixel-scroll">
        <div
          class="pixel-grid"
          bind:this={pixelGrid}
          on:pointermove={pointerMove}
          on:pointerup={() => (painting = false)}
          on:pointercancel={() => (painting = false)}
          style={`grid-template-columns:repeat(${width},${pixelSize}px)`}
          role="group"
          aria-label="Bitmap pixels. Arrow keys move; Space toggles a pixel."
        >
          {#each pixels as on, index (index)}<button
              class="pixel"
              class:on
              data-index={index}
              style={`width:${pixelSize}px;height:${pixelSize}px`}
              tabindex={index === focusIndex ? 0 : -1}
              aria-label={`Pixel ${index % width}, ${Math.floor(index / width)} ${on ? 'on' : 'off'}`}
              aria-pressed={on}
              on:pointerdown={(event) => begin(index, event)}
              on:pointerenter={(event) => drag(index, event)}
              on:keydown={(event) => move(index, event)}
              on:click={(event) => {
                if (event.detail === 0) toggle(index);
              }}
            ></button>{/each}
        </div>
      </div>
      <p class="hint">
        Click or drag to paint. Use arrow keys to move and Space to toggle. {width} × {height} pixels.
      </p>
      <details>
        <summary>Canvas and files</summary>
        <div class="field-row">
          <label>Width<input type="text" inputmode="numeric" bind:value={draftWidth} /></label
          ><label>Height<input type="text" inputmode="numeric" bind:value={draftHeight} /></label
          ><button class="action" on:click={resize}>Resize</button>
        </div>
        <p class="hint">
          Sprites can be up to 64 × 64 pixels. Resizing keeps the overlapping part.
        </p>
        <div class="field-row">
          <button class="action" on:click={() => download(JSON.stringify(bitmap), 'sprite.json')}
            >Save drawing</button
          ><label
            >Open drawing<input
              bind:this={fileInput}
              type="file"
              accept=".json,application/json"
              on:change={importFile}
            /></label
          >
        </div>
      </details>
    </section>
    <section aria-label="Generated sprite code">
      <div class="field-row">
        <label
          >Export<select bind:value={outputMode}
            ><option value="jack">Jack</option><option value="assembly">Hack assembly</option
            ><option value="words">Screen words</option></select
          ></label
        >
      </div>
      <label
        >Generated bitmap code<textarea
          readonly
          value={generated.code}
          aria-label="Generated bitmap code"
          spellcheck="false"
        ></textarea></label
      ><button
        class="text-button"
        disabled={!generated.code}
        on:click={() =>
          download(
            generated.code,
            outputMode === 'jack'
              ? 'Sprite.jack'
              : outputMode === 'assembly'
                ? 'Sprite.asm'
                : 'sprite-words.txt',
          )}>Download code</button
      >
      <p class="hint">
        Writes whole touched words, clearing blank and edge pixels in those words. Bit 0 is the
        leftmost pixel.
      </p>
      <details>
        <summary>Screen position</summary>
        <div class="field-row">
          <label>X<input type="text" inputmode="numeric" bind:value={x} /></label><label
            >Y<input type="text" inputmode="numeric" bind:value={y} /></label
          >
        </div>
        <p class="hint">The complete sprite must fit within 512 × 256 pixels.</p>
      </details>
      {#if generated.error}<p class="error" role="alert">{generated.error}</p>{/if}
    </section>
  </div>
  {#if error}<p class="error" role="alert">{error}</p>{/if}{#if notice}<p
      class="notice"
      role="status"
    >
      {notice}
    </p>{/if}
  <div class="more-reading">
    <a href={resolve('/tools/computer')}>Run assembly on the computer ↗</a><a
      href={resolve('/tools/compiler')}>Compile Jack ↗</a
    ><a
      href={resolve('/learn/reference/[...path]#screen-and-keyboard', { path: 'machine-language' })}
      >Screen memory explained ↗</a
    >
  </div>
</main>

<style>
  .pixel-scroll {
    max-width: 100%;
    overflow: auto;
    max-height: 650px;
    border: 1px solid #77829c;
    padding: 8px;
  }
  .pixel-grid {
    display: grid;
    width: max-content;
    gap: 1px;
  }
  .pixel {
    padding: 0;
    min-width: 0;
    border: 1px solid #737e98;
    background: #eeeff7;
    touch-action: none;
  }
  .pixel.on {
    background: #151827;
  }
  .pixel:focus-visible {
    outline: 3px solid #7b67df !important;
    outline-offset: -4px !important;
    position: relative;
    z-index: 1;
  }
</style>

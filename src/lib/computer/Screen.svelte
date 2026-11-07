<script lang="ts">
  import { onMount } from 'svelte';
  export let words: Uint16Array | number[] = [];
  let canvas: HTMLCanvasElement;
  let mounted = false;
  onMount(() => {
    mounted = true;
  });
  $: if (mounted && canvas) draw(words);
  function draw(memory: Uint16Array | number[]) {
    const context = canvas.getContext('2d');
    if (!context) return;
    const frame = context.createImageData(512, 256);
    for (let pixel = 0; pixel < 512 * 256; pixel++) {
      const word = memory[pixel >>> 4] ?? 0;
      const on = (word & (1 << (pixel & 15))) !== 0;
      const value = on ? 23 : 238;
      const p = pixel * 4;
      frame.data[p] = value;
      frame.data[p + 1] = on ? 25 : 239;
      frame.data[p + 2] = on ? 36 : 247;
      frame.data[p + 3] = 255;
    }
    context.putImageData(frame, 0, 0);
  }
</script>

<div
  class="hack-screen"
  role="img"
  aria-label="Hack computer display, 512 by 256 monochrome pixels. Inspect its words in the memory view."
>
  <canvas bind:this={canvas} width="512" height="256" aria-hidden="true"></canvas>
  <p>512 × 256 pixels · each memory word controls 16 pixels</p>
</div>

<style>
  .hack-screen {
    margin: 0;
    min-width: 0;
  }
  canvas {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 2;
    image-rendering: pixelated;
    border: 1px solid #77829c;
    background: #eeeff7;
  }
  p {
    color: #b8bbd0;
    font:
      11px/1.6 ui-monospace,
      monospace;
    margin-top: 10px;
  }
</style>

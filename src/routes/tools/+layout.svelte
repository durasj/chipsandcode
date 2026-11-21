<script lang="ts">
  import { onMount } from 'svelte';

  const preferenceKey = 'chipsandcode.tools.full-width.v1';
  let fullWidth = false;
  let ready = false;

  onMount(() => {
    try {
      fullWidth = localStorage.getItem(preferenceKey) === 'true';
    } catch {
      // The display preference still works when browser storage is unavailable.
    }
    ready = true;
  });

  function toggleWidth() {
    fullWidth = !fullWidth;
    try {
      localStorage.setItem(preferenceKey, String(fullWidth));
    } catch {
      // Keep the choice for this visit even if it cannot be saved.
    }
  }
</script>

<div class="tools-shell" class:full-width={fullWidth} data-width-ready={ready}>
  <aside class="display-controls" aria-label="Tool display">
    <button
      type="button"
      aria-pressed={fullWidth}
      on:click={toggleWidth}
      title={fullWidth ? 'Return to the 1200px workspace' : 'Use the full window width'}
      >Full width</button
    >
  </aside>
  <slot />
</div>

<style>
  .tools-shell {
    --tool-editor-height: clamp(320px, calc(100dvh - 390px), 1000px);
    width: calc(100% - 32px);
    max-width: 1200px;
    min-height: calc(100svh - 180px);
    margin: 0 auto;
    padding-bottom: 32px;
  }
  .tools-shell.full-width {
    max-width: none;
  }
  .display-controls {
    display: flex;
    justify-content: flex-end;
    padding: 8px 0;
  }
  button {
    min-height: 44px;
    padding: 8px 14px;
    border: 1px solid #77829c;
    border-radius: 4px;
    background: #151a2a;
    color: #edf0fc;
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }
  button[aria-pressed='true'] {
    background: #b5a6f2;
    border-color: #cabdff;
    color: #10121c;
  }
  button:focus-visible {
    outline: 2px solid #d0c7ff;
    outline-offset: 3px;
  }
  .tools-shell :global(.tool-heading) {
    margin: 8px 0 20px;
  }
  .tools-shell :global(.tool-heading .eyebrow) {
    display: none;
  }
  .tools-shell :global(.tool-heading h1) {
    font-size: clamp(28px, 3vw, 36px);
  }
  .tools-shell :global(.tool-intro) {
    margin-top: 8px;
  }
  .tools-shell :global(textarea.workspace-editor) {
    min-height: var(--tool-editor-height);
  }
  @media (max-width: 820px) {
    .tools-shell {
      --tool-editor-height: 320px;
    }
  }
</style>

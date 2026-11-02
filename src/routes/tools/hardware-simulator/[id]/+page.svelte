<script lang="ts">
  import type { Experiment } from '#src/lib/shared.js';
  import HardwareIDE from '#lib/components/HardwareIDE.svelte';
  import api from '#lib/api.js';
  import type { PageData } from './$types';
  import examples from '#lib/hardware-simulator/examples/index.js';
  export let data: PageData;
  $: experiment = (async () => {
    const example = examples.find(({ id }) => id === data.id);
    if (example) return example;
    const response = await api<{ experiment: Experiment }>(
      `/experiments/${encodeURIComponent(data.id)}`,
    );
    return response.experiment;
  })();
</script>

<svelte:head><title>Hardware simulator — Chips and Code</title></svelte:head>
<main class="hardware-tool-page">
  <header class="tool-introduction">
    <a href="/tools">← Tools</a>
    <h1>Hardware simulator</h1>
    <p>Describe the circuit. Test its behavior. Follow every signal.</p>
  </header>
  {#key data.id}
    {#await experiment}
      <p class="load-state" role="status">Loading experiment…</p>
    {:then loaded}
      <HardwareIDE experiment={loaded} />
    {:catch cause}
      <div class="load-error" role="alert">
        <h2>This experiment could not be opened.</h2>
        <p>{cause instanceof Error ? cause.message : 'The link may be unavailable.'}</p>
        <a href="/tools/hardware-simulator">Start a new experiment →</a>
      </div>
    {/await}
  {/key}
</main>

<style>
  .hardware-tool-page {
    width: min(100%, 1480px);
    margin: 0 auto;
    padding: 32px 4% 70px;
    color: #edf0fc;
  }
  .tool-introduction {
    margin-bottom: 30px;
  }
  .tool-introduction a,
  .load-error a {
    color: #c5baff;
    font-size: 12px;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  h1 {
    margin: 27px 0 13px;
    font-size: clamp(30px, 4vw, 46px);
    line-height: 1.12;
    font-weight: 500;
    letter-spacing: -0.04em;
  }
  p {
    color: #bdc4da;
    font-size: 15px;
    line-height: 1.7;
    margin: 0;
  }
  .load-state,
  .load-error {
    min-height: 200px;
    padding: 30px;
    border: 1px solid #555f7a;
    background: #111624;
    border-radius: 5px;
  }
  .load-error h2 {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 16px;
  }
  .load-error p {
    margin-bottom: 20px;
  }
  @media (max-width: 520px) {
    .hardware-tool-page {
      padding: 24px 16px 50px;
    }
  }
</style>

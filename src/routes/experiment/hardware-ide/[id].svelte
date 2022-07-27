<script lang="ts">
  import type { Experiment } from 'src/backend/endpoints/experiment';
  import HardwareIDE from 'src/components/HardwareIDE.svelte';

  export let experiment: Experiment;
</script>

<svelte:head>
  {#await experiment}
    <title>New Experiment - Hardware IDE - Chips and Code</title>
  {:then experiment}
    <title>{experiment.name} - Hardware IDE - Chips and Code</title>
  {:catch}
    <title>Invalid Experiment - Hardware IDE - Chips and Code</title>
  {/await}
</svelte:head>

<main class="flex flex-grow" aria-live="polite" aria-busy="false">
  <HardwareIDE {experiment} />
</main>

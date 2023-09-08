<script lang="ts">
  import type { Experiment } from 'src/lib/shared';
  import Problem from '$lib/components/Problem.svelte';
  import HardwareIDE from '$lib/components/HardwareIDE.svelte';
  import api from '$lib/api';
  import Loading from '$lib/components/Loading.svelte';
  import Header from 'src/lib/components/Header.svelte';
  import type { PageData } from './$types';
  import examples from 'src/lib/hardware-simulator/examples';

  export let data: PageData;

  $: experiment = (async () => {
    const example = examples.find(({ id: exampleId }) => exampleId === data.id);
    if (example) return example;

    try {
      const response = await api<{ experiment: Experiment }>(`/experiments/${data.id}`);
      return response.experiment;
    } catch (e) {
      if (e instanceof Error && e.message) {
        throw new Error(`Loading failed: ${e.message}`);
      } else {
        throw new Error('Unable to load experiment');
      }
    }
  })();
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

<Header />

<main class="flex flex-grow border-t border-base-200" aria-live="polite">
  {#await experiment}
    <h1 class="sr-only">New Experiment - Hardware IDE</h1>
  {:then experiment}
    <h1 class="sr-only">{experiment.name} - Hardware IDE</h1>
  {:catch}
    <h1 class="sr-only">Invalid Experiment - Hardware IDE</h1>
  {/await}

  {#await experiment}
    <Loading name="Experiment" />
  {:then experiment}
    <HardwareIDE {experiment} />
  {:catch error}
    <Problem message={error.message} />
  {/await}
</main>

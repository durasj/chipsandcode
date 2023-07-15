<script lang="ts">
  import type { Experiment } from 'src/lib/server/endpoints/experiment';
  import Problem from '$lib/components/Problem.svelte';
  import HardwareIDE from '$lib/components/HardwareIDE.svelte';
  import api from '$lib/api';
  import Loading from '$lib/components/Loading.svelte';
  import Header from 'src/lib/components/Header.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  console.log('Id is', data.id);

  $: experiment = (async () => {
    try {
      const response = await api<{ experiment: Experiment }>(`/experiment/${data.id}`);
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

{#await experiment}
  <main class="flex flex-grow" aria-live="polite" aria-busy="true">
    <Loading name="Experiment" />
  </main>
{:then experiment}
  <main class="flex flex-grow" aria-live="polite" aria-busy="false">
    <HardwareIDE {experiment} />
  </main>
{:catch error}
  <main class="flex flex-grow" aria-live="polite" aria-busy="false">
    <Problem message={error.message} />
  </main>
{/await}
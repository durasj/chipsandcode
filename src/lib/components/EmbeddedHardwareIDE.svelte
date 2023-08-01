<script lang="ts">
  import type { Experiment } from 'src/lib/shared';
  import Problem from '$lib/components/Problem.svelte';
  import HardwareIDE from '$lib/components/HardwareIDE.svelte';
  import api from '$lib/api';
  import Loading from '$lib/components/Loading.svelte';

  export let id: string;

  $: experiment = (async () => {
    try {
      const response = await api<{ experiment: Experiment }>(`/experiments/${id}`);

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

<main
  class="not-prose relative flex flex-grow -left-80 w-[calc(100%+40rem)] z-10 my-12"
  aria-live="polite"
>
  {#await experiment}
    <Loading name="Experiment" />
  {:then experiment}
    <HardwareIDE {experiment} controls={false} />
  {:catch error}
    <Problem message={error.message} />
  {/await}
</main>

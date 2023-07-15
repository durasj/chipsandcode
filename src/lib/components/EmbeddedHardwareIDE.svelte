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

{#await experiment}
  <main
    class="not-prose relative flex flex-grow -left-80 w-[calc(100%+40rem)] z-10"
    aria-live="polite"
    aria-busy="true"
  >
    <Loading name="Experiment" />
  </main>
{:then experiment}
  <main
    class="not-prose relative flex flex-grow -left-80 w-[calc(100%+40rem)] z-10"
    aria-live="polite"
    aria-busy="false"
  >
    <HardwareIDE {experiment} />
  </main>
{:catch error}
  <main
    class="not-prose relative flex flex-grow -left-80 w-[calc(100%+40rem)] z-10"
    aria-live="polite"
    aria-busy="false"
  >
    <Problem message={error.message} />
  </main>
{/await}

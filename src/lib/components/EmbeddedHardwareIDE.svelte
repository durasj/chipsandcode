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

<div
  class="not-prose relative flex flex-grow w-full 2xl:w-[260%] 2xl:-left-[80%] xl:w-[220%] xl:-left-[60%] lg:w-[174%] lg:-left-[37%] md:w-[120%] md:-left-[10%] min-h-[24rem] z-10 my-12"
  aria-live="polite"
>
  {#await experiment}
    <Loading name="Experiment" />
  {:then experiment}
    <HardwareIDE
      {experiment}
      controls={false}
      autoSaveHdlLocally={true}
      readOnlyAssignment={true}
    />
  {:catch error}
    <Problem message={error.message} />
  {/await}
</div>

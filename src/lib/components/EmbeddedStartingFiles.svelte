<script lang="ts">
  import type { Experiment } from 'src/lib/shared';
  import Problem from '$lib/components/Problem.svelte';
  import api from '$lib/api';
  import Loading from '$lib/components/Loading.svelte';

  export let id: string;
  export let name: string;

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
  class="not-prose relative flex flex-grow w-full 2xl:w-[260%] 2xl:-left-[80%] xl:w-[220%] xl:-left-[60%] lg:w-[174%] lg:-left-[37%] md:w-[120%] md:-left-[10%] h-[24rem] z-10 my-12"
  aria-live="polite"
>
  {#await experiment}
    <Loading name="Files" />
  {:then experiment}
    <div class="flex flex-row w-full gap-2">
      <div class="flex-1">
        {name}.hdl
        <textarea
          class="block w-full h-full font-mono whitespace-pre overflow-x-auto bg-base-200"
          readonly>{experiment.code}</textarea
        >
      </div>

      <div class="flex-1">
        {name}.tst
        <textarea
          class="block w-full h-full font-mono whitespace-pre overflow-x-auto bg-base-200"
          readonly
          >load {name}.hdl,{'\n'}output-file {name}.out,{'\n'}compare-to {name}.cmp,{'\n'}{experiment.tests}</textarea
        >
      </div>

      <div class="flex-1">
        {name}.cmp
        <textarea
          class="block w-full h-full font-mono whitespace-pre overflow-x-auto bg-base-200"
          readonly>{experiment.compare}</textarea
        >
      </div>
    </div>
  {:catch error}
    <Problem message={error.message} />
  {/await}
</main>

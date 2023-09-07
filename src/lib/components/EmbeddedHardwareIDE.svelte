<script lang="ts">
  import Problem from '$lib/components/Problem.svelte';
  import HardwareIDE from '$lib/components/HardwareIDE.svelte';
  import examples from '../hardware-simulator/examples';

  export let id: string;
  export let celebrate: boolean;

  $: experiment = examples.find(({ id: exampleId }) => exampleId === id);
</script>

<div
  class="not-prose relative flex flex-grow w-full 2xl:w-[260%] 2xl:-left-[80%] xl:w-[220%] xl:-left-[60%] lg:w-[174%] lg:-left-[37%] md:w-[120%] md:-left-[10%] min-h-[24rem] z-10 my-12"
>
  {#if experiment}
    <HardwareIDE
      {experiment}
      controls={false}
      autoSaveHdlLocally={true}
      readOnlyAssignment={true}
      celebrateTestsPass={celebrate}
    />
  {:else}
    <Problem message="Unknown Experiment" />
  {/if}
</div>

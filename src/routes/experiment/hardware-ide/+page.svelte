<script lang="ts">
  import HardwareIDE from '$lib/components/HardwareIDE.svelte';
  import Header from 'src/lib/components/Header.svelte';
</script>

<svelte:head>
  <title>New Experiment - Hardware IDE - Chips and Code</title>
</svelte:head>

<Header />

<main class="flex flex-grow border-t border-base-200" aria-live="polite" aria-busy="false">
  <HardwareIDE />
</main>

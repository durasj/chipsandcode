<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Landing from '#lib/game/Landing.svelte';
  import IntroVideo from '#lib/game/IntroVideo.svelte';
  let ready = false;
  let continuing = false;
  let introOpen = false;
  onMount(() => {
    try {
      const progress = JSON.parse(
        localStorage.getItem('chipsandcode.progress.v1') ??
          localStorage.getItem('chipsandcode.signal-isles.progress.v1') ??
          '[]',
      );
      continuing =
        localStorage.getItem('chipsandcode.signal-intro.v1') === 'complete' ||
        (Array.isArray(progress) && progress.includes('nand'));
    } catch {
      /* Learning still works when device storage is unavailable. */
    }
    ready = true;
  });
</script>

<svelte:head>
  <title>Break down the magic of computers — Chips and Code</title>
  <meta
    name="description"
    content="Break down the magic of computers by building your own. Start with a signal, explore simple gates, and build from chips to code. Free in your browser."
  />
</svelte:head>
<main class="landing-page" data-ready={ready}>
  <Landing {continuing} onstart={() => goto('/learn')} onwatch={() => (introOpen = true)} />
</main>
{#if introOpen}<IntroVideo onclose={() => (introOpen = false)} />{/if}

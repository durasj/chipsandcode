<script lang="ts">
  import { onMount } from 'svelte';
  import { pwaInfo } from 'virtual:pwa-info';

  import '#src/app.css';
  import SiteHeader from '#lib/components/SiteHeader.svelte';
  import SiteFooter from '#lib/components/SiteFooter.svelte';

  onMount(async () => {
    // @ts-ignore TODO: Any way to do this without polluting the bundle?
    const isInCypress = window.Cypress;

    if (pwaInfo && !isInCypress) {
      const { registerSW } = await import('virtual:pwa-register');
      registerSW({
        immediate: true,
        onRegistered() {
          console.log(`SW was registered`);
        },
        onRegisterError(error: Error) {
          console.error('SW could not be registered', error);
        },
      });
    }
  });
</script>

<svelte:head>
  {#if pwaInfo}<link rel="manifest" href="/manifest.webmanifest" />{/if}
</svelte:head>

<div class="app-shell">
  <SiteHeader />
  <div id="page-content" tabindex="-1"><slot /></div>
  <SiteFooter />
</div>

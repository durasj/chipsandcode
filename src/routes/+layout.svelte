<script lang="ts">
  import { onMount } from 'svelte';
  import { pwaInfo } from 'virtual:pwa-info';

  import 'src/app.css';
  import { theme } from 'src/stores';

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

  $: webManifest = pwaInfo ? pwaInfo.webManifest.linkTag : '';

  theme.subscribe((name) => {
    if (typeof document === 'undefined') return;

    document.documentElement.setAttribute('data-theme', name);
    if (name === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
</script>

<svelte:head>
  {@html webManifest}
</svelte:head>

<div class="flex flex-col min-h-screen">
  <slot />
</div>

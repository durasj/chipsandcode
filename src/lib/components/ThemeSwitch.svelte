<script lang="ts">
  import { onMount } from 'svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { Moon, Sun } from '@steeze-ui/heroicons';

  import { theme } from 'src/stores';

  onMount(() => {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      theme.set(e.matches ? 'dark' : 'light');
    });
  });
  const toggleMode = (e: Event) => {
    const choseLight = (e.target as HTMLInputElement).checked;
    const name = choseLight ? 'light' : 'dark';
    theme.set(name);
    localStorage.setItem('theme', name);
  };

  let themeName: 'dark' | 'light';
  theme.subscribe((name) => (themeName = name));
</script>

<label class="btn btn-ghost btn-circle swap swap-rotate" title="Switch color theme">
  <div class="sr-only">Color theme switch</div>

  <input type="checkbox" checked={themeName === 'light'} on:change={toggleMode} />

  <Icon src={Sun} class="swap-on w-7 h-7" />

  <Icon src={Moon} class="swap-off w-7 h-7" />
</label>

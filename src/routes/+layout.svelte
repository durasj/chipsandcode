<script lang="ts">
  import 'src/app.css';
  import { theme } from 'src/stores';

  theme.subscribe((name) => {
    if (typeof document === 'undefined') return;

    document.documentElement.setAttribute('data-theme', name);
    if (name === 'dark') {
      document.documentElement.classList.add('dark');
    }
  });
</script>

<div class="flex flex-col min-h-screen">
  <slot />
</div>

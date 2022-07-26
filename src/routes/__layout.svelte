<script lang="ts">
  import 'src/app.css';
  import { theme } from 'src/stores';

  let themeName: 'dark' | 'light';
  theme.subscribe((name) => {
    themeName = name;
  });
</script>

<div
  data-theme={themeName}
  class="flex flex-col min-h-screen transition-colors"
  class:dark={themeName === 'dark'}
>
  <slot />
</div>

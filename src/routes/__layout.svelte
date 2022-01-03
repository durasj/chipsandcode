<script lang="ts">
  import Header from 'src/components/Header.svelte';

  import 'src/app.css';
</script>

<div class="flex flex-col h-screen">
  <Header />

  <main class="flex-grow">
    <slot />
  </main>

  <footer class="w-full text-center border-t border-grey p-4 pin-b">
    <p class="text-sm">
      © 2021 <a href="https://duras.me" target="_blank" rel="external">Jakub Duras</a>. Code
      available under MIT License at
      <a href="https://github.com/durasj/chipsandcode" target="_blank" rel="external">Github</a>.
    </p>
  </footer>
</div>

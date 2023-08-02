<script lang="ts">
  import ThemeSwitch from 'src/lib/components/ThemeSwitch.svelte';
  import Elements from './learn/hardware/[...path]/Elements.svelte';
  import sideA from './sideA.md';
  import 'katex/dist/katex.css';

  const { content } = sideA;
  const elements =
    content &&
    typeof content === 'object' &&
    'children' in content &&
    Array.isArray(content.children)
      ? content.children
      : undefined;
</script>

<svelte:head>
  <title>Side A - Chips and Code: Learning what our computers are made of</title>
</svelte:head>

<main class="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-x-8 pt-6 pb-16 max-w-7xl mx-auto">
  <div class="flex content-center prose dark:prose-invert px-4 mb-8 sm:px-6 lg:px-8 lg:col-span-4">
    <h1 class="mb-0">Boolean Gates</h1>

    <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
      <ThemeSwitch />
    </div>
  </div>

  <article class="prose dark:prose-invert px-4 sm:px-6 lg:px-8 lg:col-span-4">
    <Elements children={elements} />
  </article>

  <div class="text-xs break-words lg:col-span-4 mt-14 text-center">
    Adapted by <a href="https://jan.duras.me" class="link">Jan Duras</a> from
    <a href="https://www.nand2tetris.org/license" class="link">Nand to Tetris</a>
    by Shimon Schocken and Noam Nisan.
    <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" class="link">CC BY-NC-SA 3.0</a>
  </div>
</main>

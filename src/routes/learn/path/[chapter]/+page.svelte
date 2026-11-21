<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { chapterById } from '#lib/course/data.js';
  import Chapter from '#lib/course/Chapter.svelte';
  const chapter = $derived(chapterById(page.params.chapter ?? ''));
</script>

{#if chapter}{#key chapter.id}<Chapter {chapter} />{/key}{:else}<main class="page-prose">
    <h1>Chapter not found</h1>
    <a href={resolve('/learn/path')}>Return to the computer path</a>
  </main>{/if}

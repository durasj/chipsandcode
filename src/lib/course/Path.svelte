<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { courseChapters, courseProgressKey, taskKey } from './data.js';
  import './course.css';
  let completed: string[] = [];
  let ready = false;
  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(courseProgressKey) ?? '[]');
      if (Array.isArray(saved))
        completed = saved.filter((id: unknown): id is string => typeof id === 'string');
    } catch {
      /* A fresh path is usable even when storage is unavailable. */
    }
    ready = true;
  });
  $: next = courseChapters.find((chapter) =>
    chapter.tasks.some((task) => !completed.includes(taskKey(chapter, task))),
  );
</script>

<svelte:head
  ><title>The computer path — Chips and Code</title><meta
    name="description"
    content="Build from logic gates to a working Hack computer and your own assembler through six progressive projects."
  /></svelte:head
>
<main class="course-page course-path" data-ready={ready}>
  <a class="back-link" href={resolve('/learn')}>← Learn</a>
  <header class="course-heading">
    <p class="eyebrow">FROM SIGNALS TO ASSEMBLY</p>
    <h1>Build it up.</h1>
    <p>Each layer uses the one beneath it. One working piece at a time.</p>
  </header>
  <p class="foundation-link">
    New here? <a href={resolve('/learn')}>Start with a signal and your first gates.</a>
  </p>
  <ol class="chapter-list">
    {#each courseChapters as chapter (chapter.id)}
      {@const count = chapter.tasks.filter((task) =>
        completed.includes(taskKey(chapter, task)),
      ).length}
      <li>
        <a
          href={resolve('/learn/path/[chapter]', { chapter: chapter.id })}
          class:next={next?.id === chapter.id}
          ><span class="chapter-number">0{chapter.project}</span><span
            ><h2>{chapter.title}</h2>
            <p>{chapter.description}</p></span
          ><span class="chapter-status"
            >{count === chapter.tasks.length ? 'Complete' : `${count} / ${chapter.tasks.length}`}
            <span aria-hidden="true">→</span></span
          ></a
        >
      </li>
    {/each}
  </ol>
  <p class="path-attribution">
    Adapted from <a href="https://www.nand2tetris.org/course" target="_blank" rel="noopener"
      >Nand2Tetris Projects 1–6</a
    >. Your designs and progress stay on this device.
  </p>
</main>

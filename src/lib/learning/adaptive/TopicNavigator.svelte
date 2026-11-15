<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { learningTopics } from './topics.js';
  import { completedTasks, emptyChoices, nextTopic } from './model.js';
  import {
    learningChoices,
    loadLearningChoices,
    readLearningEvidence,
    saveLearningChoices,
  } from './storage.js';
  import './adaptive.css';

  export let completed: string[] = [];
  export let exploredSignals = false;
  let mounted = false;
  let opened = false;
  onMount(() => {
    loadLearningChoices();
    mounted = true;
  });
  $: evidence = readLearningEvidence(completed, exploredSignals);
  $: recommendation = nextTopic($learningChoices, evidence);
</script>

<details class="topic-navigation adaptive-panel" bind:open={opened}>
  <summary>Choose a topic</summary>
  <div class="adaptive-content">
    <p>
      Start anywhere. Unfinished work stays available, and choosing a topic never marks earlier work
      complete.
    </p>
    {#if mounted && recommendation}
      <p class="adaptive-next">
        <span>Suggested next</span><a
          href={resolve(recommendation.task.href as '/learn')}
          onclick={() => {
            opened = false;
          }}>{recommendation.task.title} →</a
        >
      </p>
    {/if}
    <nav aria-label="Choose a learning topic">
      <ol>
        {#each learningTopics as topic (topic.id)}
          {@const done = completedTasks(topic.id, evidence).length}
          <li>
            <a
              href={resolve(topic.tasks[0].href as '/learn')}
              onclick={() => {
                opened = false;
              }}
            >
              <span class="topic-title">{topic.title}</span>
              <span class="topic-description">{topic.description}</span>
              <span class="topic-evidence"
                >{topic.id === 'signals'
                  ? done
                    ? 'Explored'
                    : 'Not explored here'
                  : `${done} / ${topic.tasks.length} checked`}{#if $learningChoices.topics[topic.id]?.skipped}
                  · Skipped by choice{/if}</span
              >
            </a>
          </li>
        {/each}
      </ol>
    </nav>
    {#if Object.keys($learningChoices.topics).length}
      <button class="adaptive-text-button" onclick={() => saveLearningChoices(emptyChoices())}
        >Reset learning choices</button
      >
      <p class="adaptive-note">Resets suggestions and skips. Checked work and drafts stay saved.</p>
    {/if}
  </div>
</details>

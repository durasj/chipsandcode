<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { resolve } from '$app/paths';
  import { topicById, type TopicId } from './topics.js';
  import {
    changeChoice,
    recommend,
    suggestedRefreshers,
    type DifficultyFeedback,
  } from './model.js';
  import {
    learningChoices,
    choicesNotice,
    loadLearningChoices,
    readLearningEvidence,
    saveLearningChoices,
  } from './storage.js';
  import './adaptive.css';

  export let topicId: TopicId;
  export let currentTask: string;
  export let completed: string[] = [];
  export let exploredSignals = false;
  export let hint = '';
  let opened = false;
  let summary: HTMLElement;
  let previousTopic: TopicId;
  $: if (topicId !== previousTopic) {
    previousTopic = topicId;
    opened = false;
  }
  $: topic = topicById(topicId);
  $: choice = $learningChoices.topics[topicId];
  $: evidence = readLearningEvidence(completed, exploredSignals);
  $: suggestion = recommend(topicId, $learningChoices, evidence, currentTask);
  $: refreshers = suggestedRefreshers(topicId, evidence);
  onMount(loadLearningChoices);

  function feedback(value: DifficultyFeedback) {
    // Asking for help restores the topic to the path after a mistaken skip.
    saveLearningChoices(changeChoice($learningChoices, topicId, { feedback: value }));
  }
  async function closeAdjustments() {
    opened = false;
    await tick();
    summary?.focus();
  }
</script>

<details class="topic-coach adaptive-panel" bind:open={opened} data-topic={topicId}>
  <summary bind:this={summary}
    >Adjust this topic{#if choice?.skipped}
      · skipped{:else if choice?.feedback}
      · preference saved{/if}</summary
  >
  <div class="adaptive-content">
    <fieldset>
      <legend>How does {topic.title.toLowerCase()} feel?</legend>
      <p>Optional. This changes the suggestion for this topic, never your checked work.</p>
      <div class="feedback-options">
        <button aria-pressed={choice?.feedback === 'too-easy'} onclick={() => feedback('too-easy')}
          >Too easy</button
        >
        <button
          aria-pressed={choice?.feedback === 'about-right'}
          onclick={() => feedback('about-right')}>About right</button
        >
        <button
          aria-pressed={choice?.feedback === 'need-help'}
          onclick={() => feedback('need-help')}>Need more help</button
        >
      </div>
    </fieldset>
    {#if choice?.skipped}
      <p class="adaptive-note">
        Skipped by your choice. Nothing in this topic was marked complete.
      </p>
    {/if}
    <div class="adaptive-recommendation" aria-live="polite" aria-atomic="true">
      {#if choice?.feedback === 'need-help' && hint}
        <p><strong>A smaller step</strong><br />{hint}</p>
      {/if}
      {#if suggestion}
        <p>{suggestion.reason}</p>
        <a class="adaptive-suggestion" href={resolve(suggestion.task.href as '/learn')}
          >{suggestion.task.title} →</a
        >
      {:else}
        <p>
          No later unfinished topic is suggested. You can revisit any task or explore the Tools.
        </p>
      {/if}
    </div>
    <p class="adaptive-note">
      A suggestion, not a mastery rating. Hints and explanations are always available.
    </p>
    {#if refreshers.length}
      <div class="adaptive-refreshers">
        <p>
          This topic builds on these ideas. Their activities have not all been checked here; refresh
          only what you need.
        </p>
        <ul>
          {#each refreshers as id (id)}
            {@const refresher = topicById(id)}
            <li>
              <a href={resolve(refresher.tasks[0].href as '/learn')}
                >Revisit {refresher.title.toLowerCase()}</a
              >
            </li>
          {/each}
        </ul>
      </div>
    {/if}
    <a class="adaptive-reading" href={resolve(topic.reference as '/learn')}
      >Full explanation for this topic ↗</a
    >
    <div class="adaptive-choice-actions">
      {#if !choice?.skipped}<button
          class="adaptive-text-button"
          onclick={() =>
            saveLearningChoices(
              changeChoice($learningChoices, topicId, { ...choice, skipped: true }),
            )}>Familiar? Skip this topic</button
        >{/if}
      {#if choice}<button
          class="adaptive-text-button"
          onclick={() => saveLearningChoices(changeChoice($learningChoices, topicId, null))}
          >Reset this topic’s choices</button
        >{/if}
      <button class="adaptive-text-button" onclick={closeAdjustments}>Close adjustments</button>
    </div>
    {#if $choicesNotice}<p class="adaptive-note" role="status">{$choicesNotice}</p>{/if}
  </div>
</details>

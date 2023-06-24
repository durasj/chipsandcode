<script lang="ts">
  import 'katex/dist/katex.css';
  import formatDistance from 'date-fns/formatDistance';
  import parseISO from 'date-fns/parseISO';
  import Header from 'src/components/Header.svelte';
  import Footer from 'src/components/Footer.svelte';
  import { page } from '$app/stores';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { ArrowLeft, ArrowRight } from '@steeze-ui/heroicons';

  export let title: string;
  export let updated: string;
  export let copyright: string;
  export let course: string;
  export let menu: { name: string; link: string; label: string }[];

  const activeItemIndex = menu.findIndex((i) => $page.url.pathname.endsWith(i.link));
  const prevItem = menu[activeItemIndex - 1];
  const nextItem = menu[activeItemIndex + 1];

  const updatedHr = updated
    ? formatDistance(parseISO(updated), new Date(), { addSuffix: true })
    : '';
</script>

<svelte:head>
  <title>Learn - {title} - Chips and Code</title>
</svelte:head>

<Header />

<main class="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-x-8 pt-6 pb-24 max-w-7xl mx-auto">
  <nav class="col-span-1 lg:block sticky" aria-label="Course contents">
    <div class="text-xl mb-4 font-bold">{course}</div>

    <ul class="steps steps-vertical mb-4">
      {#each menu as item, i}
        <li class="step" class:step-primary={i <= activeItemIndex} data-content={item.label}>
          <a href={`/learn${item.link}`} class="link link-hover">{item.name}</a>
        </li>
      {/each}
    </ul>

    <div class="text-xs break-words mb-2">Last updated: {updatedHr}</div>
    <div class="text-xs break-words">{@html copyright}</div>
  </nav>

  <article class="prose dark:prose-invert px-4 sm:px-6 lg:px-8 lg:col-start-2 lg:col-end-5">
    <h1>{title}</h1>

    <slot />

    <div
      class="flex my-4"
      class:place-content-between={prevItem && nextItem}
      class:place-content-start={prevItem && !nextItem}
      class:place-content-end={!prevItem && nextItem}
    >
      {#if prevItem}
        <a href={`/learn${prevItem.link}`} class="btn"
          ><Icon src={ArrowLeft} class="w-4 mr-4" /> {prevItem.label} {prevItem.name}</a
        >
      {/if}

      {#if nextItem}
        <a href={`/learn${nextItem.link}`} class="btn btn-primary"
          >{nextItem.label} {nextItem.name} <Icon src={ArrowRight} class="w-4 ml-4" /></a
        >
      {/if}
    </div>
  </article>
</main>

<Footer />

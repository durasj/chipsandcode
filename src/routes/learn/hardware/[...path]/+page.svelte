<script lang="ts">
  import formatDistance from 'date-fns/formatDistance';
  import parseISO from 'date-fns/parseISO';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { ArrowLeft, ArrowRight } from '@steeze-ui/heroicons';
  import 'katex/dist/katex.css';

  import { page } from '$app/stores';
  import Footer from '$lib/components/Footer.svelte';
  import Header from '$lib/components/Header.svelte';

  import type { PageData } from './$types';
  import Elements from './Elements.svelte';

  export let data: PageData;

  const menu = [
    {
      name: 'Boolean Logic',
      link: '/hardware/boolean-logic',
      label: 1,
    },
    {
      name: 'Background',
      link: '/hardware/boolean-logic/background',
      label: 1.1,
    },
    {
      name: 'Specification',
      link: '/hardware/boolean-logic/background',
      label: 1.2,
    },
    {
      name: 'Implementation',
      link: '/hardware/boolean-logic/background',
      label: 1.3,
    },
    {
      name: 'Perspective',
      link: '/hardware/boolean-logic/background',
      label: 1.4,
    },
    {
      name: 'Project',
      link: '/hardware/boolean-logic/background',
      label: 1.5,
    },
  ];

  const activeItemIndex = menu.findIndex((i) => $page.url.pathname.endsWith(i.link));
  const prevItem = menu[activeItemIndex - 1];
  const nextItem = menu[activeItemIndex + 1];

  const updatedHr = data.meta.updated
    ? formatDistance(parseISO(data.meta.updated), new Date(), { addSuffix: true })
    : '';
</script>

<svelte:head>
  <title>Learn - {data.meta.title} - Chips and Code</title>
</svelte:head>

<Header />

<main class="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-x-8 pt-6 pb-24 max-w-7xl mx-auto">
  <nav class="col-span-1 lg:block sticky" aria-label="Course contents">
    <div class="text-xl mb-4 font-bold">Hardware</div>

    <ul class="steps steps-vertical mb-4">
      {#each menu as item, i}
        <li class="step" class:step-primary={i <= activeItemIndex} data-content={item.label}>
          <a href={`/learn${item.link}`} class="link link-hover">{item.name}</a>
        </li>
      {/each}
    </ul>

    <div class="text-xs break-words mb-2">Last updated: {updatedHr}</div>
    <div class="text-xs break-words">
      Adapted by <a href="https://jan.duras.me" class="link">Jan Duras</a> from
      <a href="https://www.nand2tetris.org/license" class="link">Nand to Tetris</a>
      by Shimon Schocken and Noam Nisan.
      <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" class="link">CC BY-NC-SA 3.0</a>
    </div>
  </nav>

  <article class="prose dark:prose-invert px-4 sm:px-6 lg:px-8 lg:col-start-2 lg:col-end-5">
    <h1>{data.meta.title}</h1>

    <Elements children={data.content} />

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

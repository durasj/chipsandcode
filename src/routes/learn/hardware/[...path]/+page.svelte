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

  type MenuItem = {
    name: string;
    link: string;
    label: string;
    disabled?: boolean;
  };

  const menu = [
    {
      name: 'Boolean Logic',
      link: '/hardware/boolean-logic',
      label: '1',
    },
    {
      name: 'Background',
      link: '/hardware/boolean-logic/background',
      label: '1.1',
    },
    {
      name: 'Project',
      link: '/hardware/boolean-logic/project',
      label: '1.2',
    },
    {
      name: 'What Next?',
      link: '/hardware/meta/what-next',
      label: '2.0',
    },
  ] as MenuItem[];

  $: activeItemIndex = menu.findIndex((i) => $page.url.pathname.endsWith(i.link));
  $: prevItem = menu[activeItemIndex - 1];
  $: nextItem = !menu[activeItemIndex + 1]?.disabled ? menu[activeItemIndex + 1] : undefined;

  $: updatedHr = data.meta.updated
    ? formatDistance(parseISO(data.meta.updated), new Date(), { addSuffix: true })
    : '';
</script>

<svelte:head>
  <title>{data.meta.title} - Hardware - Chips and Code</title>
</svelte:head>

<Header />

<main class="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-x-8 pt-6 pb-24 max-w-7xl mx-auto">
  <nav class="col-span-1 lg:block sticky" aria-label="Course contents">
    <div class="text-xl mb-4 font-bold">Hardware</div>

    <ul class="steps steps-vertical mb-4">
      {#each menu as item, i}
        {#if !item.disabled}
          <li class="step" class:step-primary={i <= activeItemIndex} data-content={item.label}>
            <a href={`/learn${item.link}`} class="link link-hover">{item.name}</a>
          </li>
        {:else}
          <li class="step" class:step-primary={i <= activeItemIndex} data-content={item.label}>
            Coming Soon: {item.name}
          </li>
        {/if}
      {/each}
    </ul>

    <div class="text-xs break-words mb-2">Last updated: {updatedHr}</div>
    <div class="text-xs break-words">
      Adapted by <a href="https://johny.digital" class="link">Jan Duras</a> from
      <a href="https://www.nand2tetris.org/license" class="link">Nand to Tetris</a>
      by Shimon Schocken and Noam Nisan.
      <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/" class="link">CC BY-NC-SA 3.0</a>
    </div>
  </nav>

  <article
    class="prose dark:prose-invert px-4 sm:px-6 lg:px-8 lg:col-start-2 lg:col-end-5 prose-code:px-0 prose-code:font-normal [word-spacing:0.0625rem]"
  >
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

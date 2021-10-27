<script lang="ts">
  import { page } from '$app/stores';

  import { fly } from 'svelte/transition';

  import OutlineCog from '../components/icons/OutlineCog.svelte';
  import OutlineChip from './icons/OutlineChip.svelte';
  import OutlineInformationCircle from './icons/OutlineInformationCircle.svelte';
  import OutlineMenu from './icons/OutlineMenu.svelte';
  import OutlineX from './icons/OutlineX.svelte';
  import SolidChevronDown from './icons/SolidChevronDown.svelte';

  const logo = {
    title: 'ChipsAndCode',
    path: '/logo.svg',
  };

  const desktopItems = [
    {
      title: 'Learn',
      href: '/learn',
      items: [
        {
          title: 'Hardware and Assembly',
          href: '/learn/hardware-assembly',
          icon: OutlineChip,
          description: 'Explore chip design and essential low-level code.',
        },
      ],
    },
    {
      title: 'Experiment',
      href: '/experiment',
      items: [
        {
          title: 'Hardware IDE',
          href: '/experiment/hardware-ide',
          icon: OutlineCog,
          description: 'Design and simulate computer chips.',
        },
      ],
    },
    {
      title: 'About',
      href: '/about',
      icon: OutlineInformationCircle,
    },
  ];
  const mobileItems = desktopItems.reduce<{ title: string; href: string; icon: any }[]>(
    (acc, item) => {
      if ('items' in item && item.items) {
        acc.push(
          ...item.items.map((subItem) => ({
            ...subItem,
            title: `${item.title} - ${subItem.title}`,
          })),
        );
      } else {
        acc.push(item);
      }

      return acc;
    },
    [],
  );

  let expandedItem: typeof desktopItems[0] | undefined;
  let isMobileMenuOpen = false;
</script>

<svelte:window
  on:keydown={(e) => {
    if (e.key === 'Escape' && expandedItem) expandedItem = undefined;
    if (e.key === 'Escape' && isMobileMenuOpen) isMobileMenuOpen = false;
  }}
  on:click={(e) => {
    if (expandedItem) expandedItem = undefined;
  }}
/>

<div class="relative bg-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6">
    <div class="flex justify-between items-center py-6 md:justify-start md:space-x-10">
      <div class="flex justify-start lg:w-0 lg:flex-1">
        <a href="/">
          <span class="sr-only">{logo.title}</span>
          <img class="h-8 w-auto sm:h-10" src={logo.path} alt={`Logo ${logo.title}`} />
        </a>
      </div>

      <div class="-mr-2 -my-2 md:hidden">
        <button
          type="button"
          class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
          aria-expanded={isMobileMenuOpen}
          on:click={() => (isMobileMenuOpen = true)}
        >
          <span class="sr-only">Open menu</span>

          <OutlineMenu />
        </button>
      </div>

      <nav class="hidden md:flex space-x-10">
        {#each desktopItems as item}
          {#if item.items}
            <div class="relative">
              <!-- Item active: "text-gray-900", Item inactive: "text-gray-500" -->
              <button
                type="button"
                class={`group bg-white rounded-md inline-flex items-center text-base font-medium hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
                  $page.path.startsWith(item.href) ? 'text-gray-900' : 'text-gray-500'
                }`}
                aria-expanded={expandedItem?.href === item.href}
                on:click={(e) => {
                  if (expandedItem?.href === item.href) {
                    expandedItem = undefined;
                  } else {
                    expandedItem = item;
                    e.stopPropagation();
                  }
                }}
              >
                <span>{item.title}</span>
                <SolidChevronDown
                  className={`ml-2 h-5 w-5 group-hover:text-gray-500 ${
                    $page.path.startsWith(item.href) ? 'text-gray-600' : 'text-gray-400'
                  }`}
                />
              </button>

              {#if expandedItem?.href === item.href}
                <div
                  class="absolute z-50 -ml-4 mt-3 px-2 w-screen max-w-md sm:px-0 lg:ml-0 lg:left-1/2 lg:-translate-x-1/2"
                  transition:fly|local={{ y: 4, duration: 200 }}
                >
                  <div
                    class="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden"
                  >
                    <div class="relative grid gap-6 bg-white px-5 py-6 sm:gap-8 sm:p-8">
                      {#each item.items as subItem}
                        <a
                          href={subItem.href}
                          class="-m-3 p-3 flex items-start rounded-lg hover:bg-gray-50"
                          class:bg-gray-50={$page.path.startsWith(subItem.href)}
                        >
                          <svelte:component
                            this={subItem.icon}
                            className="flex-shrink-0 h-6 w-6 text-indigo-600"
                          />

                          <div class="ml-4">
                            <p class="text-base font-medium text-gray-900">{subItem.title}</p>
                            <p class="mt-1 text-sm text-gray-500">
                              {subItem.description}
                            </p>
                          </div>
                        </a>
                      {/each}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {:else}
            <a
              href={item.href}
              class={`text-base font-medium hover:text-gray-900 ${
                $page.path === item.href ? 'text-gray-900' : 'text-gray-500'
              }`}>{item.title}</a
            >
          {/if}
        {/each}
      </nav>

      <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
        <button class="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900">
          Sign in
        </button>
      </div>
    </div>
  </div>

  {#if isMobileMenuOpen}
    <div class="absolute top-0 inset-x-0 p-2" transition:fly|local={{ y: 4, duration: 200 }}>
      <div
        class="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50"
      >
        <div class="pt-5 pb-6 px-5">
          <div class="flex items-center justify-between">
            <div>
              <img class="h-8 w-auto" src={logo.path} alt={logo.title} />
            </div>
            <div class="-mr-2">
              <button
                type="button"
                class="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
                on:click={() => (isMobileMenuOpen = false)}
              >
                <span class="sr-only">Close menu</span>

                <OutlineX />
              </button>
            </div>
          </div>

          <div class="mt-6">
            <nav class="grid gap-y-8">
              {#each mobileItems as item}
                <a
                  href={item.href}
                  class="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                  on:click={() => (isMobileMenuOpen = false)}
                >
                  <svelte:component
                    this={item.icon}
                    className="flex-shrink-0 h-6 w-6 text-indigo-600"
                  />

                  <span class="ml-3 text-base font-medium text-gray-900">{item.title}</span>
                </a>
              {/each}
            </nav>
          </div>
        </div>

        <div class="py-6 px-5 space-y-6">
          <button
            class="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

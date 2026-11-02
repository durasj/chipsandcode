<script lang="ts">
  import { Icon } from '@steeze-ui/svelte-icon';
  import {
    CpuChip,
    Cog,
    InformationCircle,
    Bars3,
    ChevronDown,
    UserCircle,
    XMark,
  } from '@steeze-ui/heroicons';
  import { Popover } from 'bits-ui';
  import { page, navigating } from '$app/state';
  import ThemeSwitch from './ThemeSwitch.svelte';

  const logo = { title: 'Chips and Code preview', path: '/logo_version.svg' };
  const desktopItems = [
    {
      title: 'Learn',
      href: '/learn',
      items: [
        {
          title: 'Chip Hardware',
          href: '/learn/hardware/boolean-logic',
          icon: CpuChip,
          description: 'Learn about chip design by creating your own chips.',
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
          icon: Cog,
          description: 'Design and simulate computer chips.',
        },
      ],
    },
    { title: 'About', href: '/about', icon: InformationCircle },
  ];
  const mobileItems = desktopItems.flatMap((item) =>
    item.items
      ? item.items.map((sub) => ({ ...sub, title: `${item.title} - ${sub.title}` }))
      : [{ ...item, description: '' }],
  );
  let mobileOpen = $state(false);
  let openMenu = $state<string | null>(null);
  let slowNavigation = $state(false);
  $effect(() => {
    if (!navigating.to) {
      slowNavigation = false;
      return;
    }
    const timeout = window.setTimeout(() => {
      slowNavigation = true;
    }, 200);
    return () => window.clearTimeout(timeout);
  });
</script>

<div class="relative">
  <div class="max-w-7xl mx-auto px-4 sm:px-6">
    <header class="flex justify-between items-center py-4 md:py-6 md:justify-start md:space-x-10">
      <div class="flex justify-start lg:w-0 lg:flex-1">
        <a href="/" title={`${logo.title} home`} aria-label={`${logo.title} home`}>
          <img class="h-8 w-auto sm:h-10" src={logo.path} alt="" />
        </a>
        {#if slowNavigation}<span class="loading loading-dots loading-md ml-4"></span>{/if}
      </div>
      <div class="relative md:hidden">
        <Popover.Root bind:open={mobileOpen}>
          <Popover.Trigger class="btn btn-ghost btn-circle" aria-label="Open menu"
            ><Icon src={Bars3} class="h-6" /></Popover.Trigger
          >
          <Popover.Portal>
            <Popover.Content
              aria-label="Main menu"
              sideOffset={8}
              align="end"
              class="z-50 w-[calc(100vw-1rem)] rounded-lg bg-base-100 dark:bg-neutral shadow-lg ring-1 ring-black ring-opacity-5 p-5"
            >
              <div class="flex items-center justify-between">
                <a href="/" onclick={() => (mobileOpen = false)} aria-label={`${logo.title} home`}
                  ><img class="h-8 w-auto" src={logo.path} alt="" /></a
                >
                <Popover.Close class="btn btn-ghost btn-circle" aria-label="Close menu"
                  ><Icon src={XMark} class="h-6" /></Popover.Close
                >
              </div>
              <nav class="grid gap-y-8 my-8" aria-label="Main menu">
                {#each mobileItems as item}
                  <a
                    href={item.href}
                    onclick={() => (mobileOpen = false)}
                    class="-m-3 p-3 flex items-center rounded-lg hover:bg-base-200"
                  >
                    <Icon src={item.icon} class="flex-shrink-0 h-6 w-6 text-primary" />
                    <span class="ml-3 text-base font-medium text-base-content">{item.title}</span>
                  </a>
                {/each}
              </nav>
              <a
                href="/signin"
                onclick={() => (mobileOpen = false)}
                class="btn btn-outline btn-primary btn-block">Anonym</a
              >
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      <nav class="hidden md:flex space-x-4" aria-label="Main menu">
        {#each desktopItems as item}
          {#if item.items}
            <Popover.Root
              open={openMenu === item.title}
              onOpenChange={(open) => (openMenu = open ? item.title : null)}
            >
              <Popover.Trigger
                class={`btn btn-link btn-sm flex-nowrap gap-1 ${page.url.pathname.startsWith(item.href) ? 'btn-active' : ''}`}
              >
                <span>{item.title}</span><Icon src={ChevronDown} theme="solid" class="h-4" />
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  aria-label={`${item.title} menu`}
                  sideOffset={12}
                  class="z-50 w-screen max-w-md rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden"
                >
                  <nav
                    aria-label={`${item.title} links`}
                    class="relative grid gap-6 bg-base-100 dark:bg-neutral px-5 py-6 sm:gap-8 sm:p-8"
                  >
                    {#each item.items as subItem}
                      <a
                        href={subItem.href}
                        onclick={() => (openMenu = null)}
                        class={`-m-3 p-3 flex items-center rounded-lg hover:bg-base-200 dark:hover:text-white ${page.url.pathname.startsWith(subItem.href) ? 'bg-base-200 dark:text-white' : ''}`}
                      >
                        <Icon src={subItem.icon} class="flex-shrink-0 h-6 w-6 text-primary" />
                        <div class="ml-4">
                          <p class="text-base font-medium">{subItem.title}</p>
                          <p class="mt-1 text-sm text-base-500">{subItem.description}</p>
                        </div>
                      </a>
                    {/each}
                  </nav>
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          {:else}
            <a
              href={item.href}
              class={`btn btn-link btn-sm ${page.url.pathname === item.href ? 'btn-active' : ''}`}
              >{item.title}</a
            >
          {/if}
        {/each}
      </nav>
      <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
        <ThemeSwitch />
        <a
          href="/signin"
          class={`btn btn-ghost btn-circle ${page.url.pathname.startsWith('/signin') ? 'neutral-focus' : 'text-base-content'}`}
          title="User account"
          aria-label="User account"><Icon src={UserCircle} class="w-7 h-7" /></a
        >
      </div>
    </header>
  </div>
</div>

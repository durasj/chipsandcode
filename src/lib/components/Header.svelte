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
  import {
    Popover,
    PopoverButton,
    PopoverGroup,
    PopoverPanel,
    Transition,
  } from '@rgossiaux/svelte-headlessui';

  import { page } from '$app/stores';
  import ThemeSwitch from './ThemeSwitch.svelte';

  const logo = {
    title: 'Chips and Code',
    path: '/logo.svg',
  };

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
    {
      title: 'About',
      href: '/about',
      icon: InformationCircle,
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
</script>

<div class="relative">
  <div class="max-w-7xl mx-auto px-4 sm:px-6">
    <header class="flex justify-between items-center py-4 md:py-6 md:justify-start md:space-x-10">
      <div class="flex justify-start lg:w-0 lg:flex-1">
        <a href="/" title={`${logo.title} home`} aria-label={`${logo.title} home`}>
          <img class="h-8 w-auto sm:h-10" src={logo.path} alt="" />
        </a>
      </div>

      <Popover class="relative md:hidden">
        <PopoverButton class="btn btn-ghost btn-circle">
          <div class="sr-only">Open menu</div>

          <Icon src={Bars3} class="h-6" />
        </PopoverButton>

        <Transition
          enter="transition duration-150"
          enterFrom="opacity-0 translate-y-2"
          enterTo="opacity-100 translate-y-0"
          leave="transition duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-2"
          class="fixed z-50 top-0 left-0 p-2 w-screen"
        >
          <PopoverPanel
            class="rounded-lg bg-base-100 dark:bg-neutral shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden"
          >
            <div class="pt-5 pb-6 px-5">
              <div class="flex items-center justify-between">
                <PopoverButton as="a" href="/">
                  <span class="sr-only">{logo.title} home</span>
                  <img class="h-8 w-auto" src={logo.path} alt="" />
                </PopoverButton>

                <div class="-mr-2">
                  <PopoverButton as="button" type="button" class="btn btn-ghost btn-circle">
                    <span class="sr-only">Close menu</span>

                    <Icon src={XMark} class="h-6" />
                  </PopoverButton>
                </div>
              </div>

              <div class="mt-8">
                <nav class="grid gap-y-8" aria-label="Main menu">
                  {#each mobileItems as item}
                    <PopoverButton
                      as="a"
                      href={item.href}
                      class="-m-3 p-3 flex items-center rounded-lg hover:bg-base-200"
                    >
                      <Icon src={item.icon} class="flex-shrink-0 h-6 w-6 text-primary" />

                      <span class="ml-3 text-base font-medium text-base-content">{item.title}</span>
                    </PopoverButton>
                  {/each}
                </nav>
              </div>
            </div>

            <div class="p-2">
              <PopoverButton as="a" href="/signin" class="btn btn-outline btn-primary btn-block"
                >Anonym</PopoverButton
              >
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>

      <PopoverGroup as="nav" class="hidden md:flex space-x-4" aria-label="Main menu">
        {#each desktopItems as item}
          {#if item.items}
            <Popover class="relative">
              <PopoverButton
                class={`btn btn-link btn-sm flex-nowrap gap-1 ${
                  $page.url.pathname.startsWith(item.href) ? 'btn-active' : ''
                }`}
              >
                <span>{item.title}</span>

                <Icon src={ChevronDown} theme="solid" class="h-4" />
              </PopoverButton>

              <Transition
                enter="transition duration-150"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="transition duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-2"
                class="absolute z-50 mt-3 px-2 w-screen max-w-md sm:px-0 lg:ml-0 lg:left-1/2 lg:-translate-x-1/2"
              >
                <PopoverPanel
                  class="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden"
                >
                  <div
                    class="relative grid gap-6 bg-base-100 dark:bg-neutral px-5 py-6 sm:gap-8 sm:p-8"
                  >
                    {#each item.items as subItem}
                      <PopoverButton
                        as="a"
                        href={subItem.href}
                        class={`-m-3 p-3 flex items-center rounded-lg hover:bg-base-200 dark:hover:text-white ${
                          $page.url.pathname.startsWith(subItem.href) &&
                          'bg-base-200 dark:text-white'
                        }`}
                      >
                        <Icon src={subItem.icon} class="flex-shrink-0 h-6 w-6 text-primary" />

                        <div class="ml-4">
                          <p class="text-base font-medium">{subItem.title}</p>
                          <p class="mt-1 text-sm text-base-500">
                            {subItem.description}
                          </p>
                        </div>
                      </PopoverButton>
                    {/each}
                  </div>
                </PopoverPanel>
              </Transition>
            </Popover>
          {:else}
            <a
              href={item.href}
              class={`btn btn-link btn-sm ${$page.url.pathname === item.href ? 'btn-active' : ''}`}
              >{item.title}</a
            >
          {/if}
        {/each}
      </PopoverGroup>

      <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
        <ThemeSwitch />

        <a
          href="/signin"
          class="btn btn-ghost btn-circle ${$page.url.pathname.startsWith('/signin')
            ? 'neutral-focus'
            : 'text-base-content'}"
          title="User account"
          aria-label="User account"
        >
          <Icon src={UserCircle} class="w-7 h-7" />
        </a>
      </div>
    </header>
  </div>
</div>

<svelte:head>
  <title>Learn - Hardware & Assembly - Chips and Code</title>
</svelte:head>

<div class="bg-white">
  <div>
    <!--
      Mobile filter dialog

      Off-canvas filters for mobile, show/hide based on off-canvas filters state.
    -->
    <div class="fixed inset-0 flex z-40 lg:hidden" role="dialog" aria-modal="true">
      <!--
        Off-canvas menu overlay, show/hide based on off-canvas menu state.

        Entering: "transition-opacity ease-linear duration-300"
          From: "opacity-0"
          To: "opacity-100"
        Leaving: "transition-opacity ease-linear duration-300"
          From: "opacity-100"
          To: "opacity-0"
      -->
      <div class="fixed inset-0 bg-black bg-opacity-25" aria-hidden="true" />

      <!--
        Off-canvas menu, show/hide based on off-canvas menu state.

        Entering: "transition ease-in-out duration-300 transform"
          From: "translate-x-full"
          To: "translate-x-0"
        Leaving: "transition ease-in-out duration-300 transform"
          From: "translate-x-0"
          To: "translate-x-full"
      -->
      <div
        class="ml-auto relative max-w-xs w-full h-full bg-white shadow-xl py-4 pb-12 flex flex-col overflow-y-auto"
      >
        <div class="px-4 flex items-center justify-between">
          <h2 class="text-lg font-medium text-gray-900">Contents</h2>
          <button
            type="button"
            class="-mr-2 w-10 h-10 bg-white p-2 rounded-md flex items-center justify-center text-gray-400"
          >
            <span class="sr-only">Close menu</span>
            <!-- Heroicon name: outline/x -->
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Filters -->
        <form class="mt-4 border-t border-gray-200">
          <h3 class="sr-only">Categories</h3>
          <ul role="list" class="font-medium text-gray-900 px-2 py-3">
            <li>
              <a href="#" class="block px-2 py-3">Lorem</a>
            </li>

            <li>
              <a href="#" class="block px-2 py-3">Ipsum</a>
            </li>

            <li>
              <a href="#" class="block px-2 py-3">Dolor</a>
            </li>

            <li>
              <a href="#" class="block px-2 py-3">Sit</a>
            </li>

            <li>
              <a href="#" class="block px-2 py-3">Amet</a>
            </li>
          </ul>
        </form>
      </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        class="relative z-10 flex items-baseline justify-between pt-24 pb-6 border-b border-gray-200"
      >
        <h1 class="text-4xl font-extrabold tracking-tight text-gray-900">Coming soon</h1>

        <div class="flex items-center">
          <button type="button" class="p-2 -m-2 ml-5 sm:ml-7 text-gray-400 hover:text-gray-500">
            <span class="sr-only">View grid</span>
            <!-- Heroicon name: solid/view-grid -->
            <svg
              class="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          </button>
          <button
            type="button"
            class="p-2 -m-2 ml-4 sm:ml-6 text-gray-400 hover:text-gray-500 lg:hidden"
          >
            <span class="sr-only">Contents</span>
            <!-- Heroicon name: solid/filter -->
            <svg
              class="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      <section aria-labelledby="contents-heading" class="pt-6 pb-24">
        <h2 id="contents-heading" class="sr-only">Contents</h2>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-x-8 gap-y-10">
          <!-- Filters -->
          <form class="hidden lg:block">
            <h3 class="sr-only">Contents</h3>
            <ul
              role="list"
              class="text-sm font-medium text-gray-900 space-y-4 pb-6 border-b border-gray-200"
            >
              <li>
                <a href="#">Lorem</a>
              </li>

              <li>
                <a href="#">Ipsum</a>
              </li>

              <li>
                <a href="#">Dolor</a>
              </li>

              <li>
                <a href="#">Sit</a>
              </li>

              <li>
                <a href="#">Amet</a>
              </li>
            </ul>
          </form>

          <!-- Product grid -->
          <div class="lg:col-span-3">
            <!-- Replace with your content -->
            <div class="border-4 border-dashed border-gray-200 rounded-lg h-96 lg:h-full" />
            <!-- /End replace -->
          </div>
        </div>
      </section>
    </main>
  </div>
</div>

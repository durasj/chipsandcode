<script>
  import Img from '@zerodevx/svelte-img';

  import Header from 'src/lib/components/Header.svelte';
  import Footer from 'src/lib/components/Footer.svelte';

  import binary from '$lib/images/binary.png?run&width=176';
  import chip from '$lib/images/chip.png?run&width=176';
  import hdl from '$lib/images/hdl.png?run&width=176';
  import keyboard from '$lib/images/keyboard.png?run&width=176';
  import matrix from '$lib/images/matrix.png?run&width=176';
  import pcb from '$lib/images/pcb.png?run&width=176';
  import pixels from '$lib/images/pixels.png?run&width=176';
</script>

<svelte:head>
  <title>Chips and Code: Learning what our computers are made of</title>
</svelte:head>

<Header />

<main class="flex-grow">
  <div class="relative overflow-hidden">
    <div class="pt-16 pb-80 sm:pt-24 sm:pb-40 lg:pt-40 lg:pb-48">
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:static">
        <div class="sm:max-w-lg">
          <h1 class="text-4xl font font-extrabold tracking-tight sm:text-6xl">
            Wondering how computers work?
          </h1>
          <p class="mt-4 text-xl opacity-90">
            Find out by embarking on the journey of building your own computer from scratch, from
            chips to code. No prerequisites - start for free from the browser.
          </p>
        </div>
        <div>
          <div class="mt-10">
            <!-- Decorative image grid -->
            <div
              aria-hidden="true"
              class="pointer-events-none lg:absolute lg:inset-y-0 lg:max-w-7xl lg:mx-auto lg:w-full"
            >
              <div
                class="absolute transform sm:left-1/2 sm:top-0 sm:translate-x-8 lg:left-1/2 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-8"
              >
                <div class="flex items-center space-x-6 lg:space-x-8">
                  <div class="flex-shrink-0 grid grid-cols-1 gap-y-6 lg:gap-y-8">
                    <div class="w-44 h-60 rounded-lg overflow-hidden sm:opacity-0 lg:opacity-100">
                      <Img class="w-full h-full object-center object-cover" src={hdl} alt="" />
                    </div>
                    <div class="w-44 h-60 rounded-lg overflow-hidden">
                      <Img class="w-full h-full object-center object-cover" src={chip} alt="" />
                    </div>
                  </div>
                  <div class="flex-shrink-0 grid grid-cols-1 gap-y-6 lg:gap-y-8">
                    <div class="w-44 h-60 rounded-lg overflow-hidden">
                      <Img class="w-full h-full object-center object-cover" src={binary} alt="" />
                    </div>
                    <div class="w-44 h-64 rounded-lg overflow-hidden">
                      <Img class="w-full h-full object-center object-cover" src={pcb} alt="" />
                    </div>
                    <div class="w-44 h-64 rounded-lg overflow-hidden">
                      <Img class="w-full h-full object-center object-cover" src={keyboard} alt="" />
                    </div>
                  </div>
                  <div class="flex-shrink-0 grid grid-cols-1 gap-y-6 lg:gap-y-8">
                    <div class="w-44 h-64 rounded-lg overflow-hidden">
                      <Img class="w-full h-full object-center object-cover" src={pixels} alt="" />
                    </div>
                    <div class="w-44 h-64 rounded-lg overflow-hidden">
                      <Img class="w-full h-full object-center object-cover" src={matrix} alt="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <a href="/learn/hardware/boolean-logic" class="btn btn-primary" sveltekit:prefetch
              >Start Learning 🤯</a
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<Footer />

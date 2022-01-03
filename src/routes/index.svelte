<script lang="ts">
  import Button from 'src/components/Button.svelte';
</script>

<svelte:head>
  <title>Chips and Code: Learning what our computers are made of</title>
</svelte:head>

<div class="relative bg-white overflow-hidden">
  <div class="pt-16 pb-80 sm:pt-24 sm:pb-40 lg:pt-40 lg:pb-48">
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:static">
      <div class="sm:max-w-lg">
        <h1 class="text-4xl font font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Wondering how computers work?
        </h1>
        <p class="mt-4 text-xl text-gray-700">
          Find out by embarking on the journey of building your own computer from scratch, from
          chips to code. No prerequisites - start from the browser now.
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
                    <img
                      src="/decorative/hdl.png"
                      alt=""
                      class="w-full h-full object-center object-cover"
                    />
                  </div>
                  <div class="w-44 h-60 rounded-lg overflow-hidden">
                    <img
                      src="/decorative/chip.png"
                      alt=""
                      class="w-full h-full object-center object-cover"
                    />
                  </div>
                </div>
                <div class="flex-shrink-0 grid grid-cols-1 gap-y-6 lg:gap-y-8">
                  <div class="w-44 h-60 rounded-lg overflow-hidden">
                    <img
                      src="/decorative/binary.png"
                      alt=""
                      class="w-full h-full object-center object-cover"
                    />
                  </div>
                  <div class="w-44 h-64 rounded-lg overflow-hidden">
                    <img
                      src="/decorative/pcb.png"
                      alt=""
                      class="w-full h-full object-center object-cover"
                    />
                  </div>
                  <div class="w-44 h-64 rounded-lg overflow-hidden">
                    <img
                      src="/decorative/keyboard.png"
                      alt=""
                      class="w-full h-full object-center object-cover"
                    />
                  </div>
                </div>
                <div class="flex-shrink-0 grid grid-cols-1 gap-y-6 lg:gap-y-8">
                  <div class="w-44 h-64 rounded-lg overflow-hidden">
                    <img
                      src="/decorative/pixels.png"
                      alt=""
                      class="w-full h-full object-center object-cover"
                    />
                  </div>
                  <div class="w-44 h-64 rounded-lg overflow-hidden">
                    <img
                      src="/decorative/matrix.png"
                      alt=""
                      class="w-full h-full object-center object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button href="/learn/hardware-assembly" primary>Start Learning 🤯</Button>
        </div>
      </div>
    </div>
  </div>
</div>

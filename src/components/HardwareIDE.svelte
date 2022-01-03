<script lang="ts">
  import type { editor } from 'monaco-editor';
  import type { Screenfull } from 'screenfull';
  import { onMount } from 'svelte';

  import parse from '../editor/hdl/parse';
  import type { Root } from '../editor/hdl/tree';
  import type Chip from '../hardware-simulator/chips/Chip';
  import ChipFactory from '../hardware-simulator/chips/ChipFactory';

  import OutlineAdjustments from './icons/OutlineAdjustments.svelte';
  import OutlineArrowsExpand from './icons/OutlineArrowsExpand.svelte';
  import SolidPlay from './icons/SolidPlay.svelte';

  function monacoEditor(node: HTMLElement) {
    (async () => {
      const { monaco } = await import('../editor');

      editor = monaco.editor.create(node, {
        value: `/** XOR
 * Exclusive OR gate
 *
 * Outputs 1 only of both inputs differ
 * Else outputs 0
 */
CHIP Xor {
    IN a, b;
    OUT out;

    PARTS:
    Not(in=a, out=nota);
    Not(in=b, out=notb);
    And(a=a, b=notb, out=w1);
    And(a=nota, b=b, out=w2);
    Or(a=w1, b=w2, out=out);
}
`,
        language: 'hdl',
        theme: 'vs-dark',
        automaticLayout: true,
      });

      editor.onDidChangeModelContent(setup);
      setup();
    })();

    return {
      destroy() {
        editor.dispose();
      },
    };
  }

  let screenfull: Screenfull;
  onMount(async () => {
    screenfull = (await import('screenfull')).default as unknown as Screenfull;
  });

  function setup() {
    let tree: Root | undefined;
    try {
      tree = parse(editor.getModel()!.getValue());
    } catch (e: any) {
      console.log(e);

      error = e.toString();
      return;
    }

    if (!tree || !tree[0]) {
      error = 'Add CHIP to start';
      return;
    }

    // TODO: Use for debugging
    // const ast = JSON.stringify(tree, undefined, 2);

    error = '';
    const chipFactory = new ChipFactory();
    chip = chipFactory.fromAST(tree[0]);

    reflectPins();
  }

  function run() {
    inputPins.forEach(({ name, value }) => {
      chip?.setInput(name, !!value);
    });

    chip?.run();

    reflectPins();
  }

  function reflectPins() {
    const input = [] as { name: string; value: number }[];
    const internal = [] as { name: string; value: number }[];
    const output = [] as { name: string; value: number }[];
    for (const [name, pin] of chip!.getPins()) {
      if (pin.type === 'input') input.push({ name, value: pin.state ? 1 : 0 });
      if (pin.type === 'internal') internal.push({ name, value: pin.state ? 1 : 0 });
      if (pin.type === 'output') output.push({ name, value: pin.state ? 1 : 0 });
    }
    inputPins = input;
    internalPins = internal;
    outputPins = output;
  }

  let ideElement: HTMLElement;
  let editor: editor.IStandaloneCodeEditor;

  let chip: Chip | undefined;
  let error: string;
  let inputPins: { name: string; value: number }[] = [];
  let internalPins: { name: string; value: number }[] = [];
  let outputPins: { name: string; value: number }[] = [];
</script>

<div bind:this={ideElement} class="grid grid-cols-1 md:grid-cols-2 h-full bg-white">
  <div use:monacoEditor class="h-full border-t border-grey" aria-label="" />

  <div class="grid grid-cols-1 md:grid-cols-3 content-start border-t border-gray-200">
    <div class="flex justify-between items-center p-4 md:col-span-3">
      <h1 class="text-lg text-gray-700 font-medium">Hardware Experiment #1</h1>

      <div class="mt-5 flex lg:mt-0 lg:ml-4">
        <span class="hidden sm:block">
          <button
            type="button"
            class="inline-flex items-center px-2 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <span class="sr-only">Settings</span>

            <OutlineAdjustments className="h-5 w-5 text-gray-500" />
          </button>
        </span>

        {#if screenfull?.isEnabled}
          <span class="hidden sm:block sm:ml-3">
            <button
              type="button"
              class="inline-flex items-center px-2 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              on:click={() => screenfull.toggle(ideElement, { navigationUI: 'hide' })}
            >
              <span class="sr-only">Full screen</span>

              <OutlineArrowsExpand className="h-5 w-5 text-gray-500" />
            </button>
          </span>
        {/if}

        <span class="sm:ml-3">
          <button
            type="button"
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <!-- Heroicon name: solid/check -->
            <svg
              class="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            Save
          </button>
        </span>

        <!-- Dropdown -->
        <span class="ml-3 relative sm:hidden">
          <button
            type="button"
            class="inline-flex items-center px-4 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            id="mobile-menu-button"
            aria-expanded="false"
            aria-haspopup="true"
          >
            More
            <!-- Heroicon name: solid/chevron-down -->
            <svg
              class="-mr-1 ml-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!--
            Dropdown menu, show/hide based on menu state.
    
            Entering: "transition ease-out duration-200"
              From: "transform opacity-0 scale-95"
              To: "transform opacity-100 scale-100"
            Leaving: "transition ease-in duration-75"
              From: "transform opacity-100 scale-100"
              To: "transform opacity-0 scale-95"
          -->
          <div
            class="origin-top-right absolute right-0 mt-2 -mr-1 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="mobile-menu-button"
            tabindex="-1"
          >
            <!-- Active: "bg-gray-100", Not Active: "" -->
            <a
              href="#"
              class="block px-4 py-2 text-sm text-gray-700"
              role="menuitem"
              tabindex="-1"
              id="mobile-menu-item-0">Edit</a
            >
            <a
              href="#"
              class="block px-4 py-2 text-sm text-gray-700"
              role="menuitem"
              tabindex="-1"
              id="mobile-menu-item-1">View</a
            >
          </div>
        </span>
      </div>
    </div>

    <div class="flex justify-between items-center p-4 md:col-span-3">
      <div class="col-span-2">Chip selection</div>

      <div class="col-span-2">
        {#if chip}
          <span class="sm:ml-3">
            <button
              type="button"
              class="inline-flex items-center px-2 py-2 border border-gray-200 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              on:click={run}
            >
              <SolidPlay className="h-5 w-5" />
            </button>
          </span>
        {/if}
      </div>
    </div>

    <div class="self-stretch pt-4 md:pl-4 md:pt-0">
      <table class="table-auto w-full">
        <thead>
          <tr>
            <th class="bg-gray-200 border-gray-200 rounded-t-md" colspan="2">Input Pins</th>
          </tr>
          <tr
            ><th class="border border-gray-200 py-1 px-2">Name</th><th
              class="border border-gray-200">Value</th
            ></tr
          >
        </thead>
        <tbody>
          {#each inputPins as pin}
            <tr>
              <td class="border border-gray-200 py-1 px-2">{pin.name}</td>
              <td class="border border-gray-200 py-1 px-2"
                ><input
                  type="number"
                  bind:value={pin.value}
                  min="0"
                  max="1"
                  class="border-none p-0"
                /></td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="self-stretch pt-4 md:pl-4 md:pt-0">
      <table class="table-auto w-full">
        <thead>
          <tr>
            <th class="bg-gray-200 border-gray-200 rounded-t-md" colspan="2">Internal Pins</th>
          </tr>
          <tr
            ><th class="border border-gray-200 py-1 px-2">Name</th><th
              class="border border-gray-200">Value</th
            ></tr
          >
        </thead>
        <tbody>
          {#each internalPins as pin}
            <tr>
              <td class="border border-gray-200 py-1 px-2">{pin.name}</td>
              <td class="border border-gray-200 py-1 px-2">{pin.value ? '1' : '0'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="self-stretch pt-4 pr-4 md:pl-4 md:pt-0">
      <table class="table-auto w-full">
        <thead>
          <tr>
            <th class="bg-gray-200 border-gray-200 rounded-t-md" colspan="2">Output Pins</th>
          </tr>
          <tr
            ><th class="border border-gray-200 py-1 px-2">Name</th><th
              class="border border-gray-200 py-1 px-2">Value</th
            ></tr
          >
        </thead>
        <tbody>
          {#each outputPins as pin}
            <tr>
              <td class="border border-gray-200 py-1 px-2">{pin.name}</td>
              <td class="border border-gray-200 py-1 px-2">{pin.value ? '1' : '0'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="self-stretch col-span-3 mt-4">
      {error}
    </div>
  </div>
</div>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let id: string;
  export let width: number;
  export let value: boolean[];
  export let readonly: boolean = false;

  const inputToValue = (input: string) =>
    input
      .padEnd(width, '0')
      .split('')
      .map((n) => n === '1');
  const valueToInput = (value: boolean[]) =>
    value
      .map((v) => (v ? '1' : '0'))
      .join('')
      .padEnd(width, '0');

  const inputWidth = width > 1 ? `calc(${width * 2}ch + 1rem)` : '100%';

  const dispatch = createEventDispatcher();

  const onChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    value = inputToValue(target.value);

    dispatch('change');
  };
</script>

<div class="relative block w-full font-mono">
  <input
    {id}
    type="text"
    inputmode="numeric"
    pattern="[01]*"
    minlength={width}
    maxlength={width}
    required
    {readonly}
    class={`relative block border-none px-2 ${width > 1 ? 'py-1 pb-[1.5rem]' : 'py-2'} ${
      width > 1 ? 'text-[1.5ch]' : ''
    } ${width > 1 ? 'tracking-[1ch]' : ''} ${
      width > 1 ? '' : 'text-right'
    } bg-inherit focus-visible:outline outline-2 outline-base-content -outline-offset-2 ${
      readonly ? '' : 'hover:outline'
    }`}
    style={`width: ${inputWidth}`}
    value={valueToInput(value)}
    on:change={onChange}
  />

  {#if width > 1}
    <div class="absolute mx-2 top-[1.75rem] select-none" aria-hidden="true">
      <div class="text-xs flex flex-row justify-between">
        {#each [...Array(width).keys()] as pos}
          <span
            class="inline-block text-center w-[0.7625rem] mr-[0.3125rem] pt-1 border-t border-solid border-base-content"
            >{pos}</span
          >
        {/each}
      </div>
    </div>
  {/if}
</div>

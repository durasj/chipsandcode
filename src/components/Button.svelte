<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let className: string = '';
  export let primary = false;
  export let secondary = false;
  export let dense = false;
  export let type = 'button';
  export let href: string | undefined = undefined;

  const dispatch = createEventDispatcher();

  const baseClasses =
    'inline-block text-center border rounded-md py-3 px-8 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
  const paddingClasses = dense ? 'py-2 px-4 text-sm' : 'py-3 px-8';
  const variantClasses = primary
    ? 'bg-indigo-600 border-transparent text-white hover:bg-indigo-700'
    : secondary
    ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
    : '';

  const classes = `${baseClasses} ${variantClasses} ${paddingClasses} ${className}`;
</script>

{#if href !== undefined}
  <a {href} class={classes} on:click={(event) => dispatch('click', event.detail)}><slot /></a>
{:else}
  <button {type} class={classes} on:click={(event) => dispatch('click', event.detail)}
    ><slot /></button
  >
{/if}

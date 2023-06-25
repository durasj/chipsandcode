<script lang="ts">
  import type { RenderableTreeNode, Tag } from '@markdoc/markdoc';
  import EmbeddedHardwareIDE from '$lib/components/EmbeddedHardwareIDE.svelte';
  import Math from '$lib/components/Math.svelte';

  export let children: RenderableTreeNode[] = [];

  const components: Record<string, ConstructorOfATypedSvelteComponent> = {
    EmbeddedHardwareIDE,
    Math,
  };

  const isTag = (node: RenderableTreeNode): node is Tag =>
    !!node && typeof node === 'object' && 'children' in node;
</script>

{#each children as node}
  {#if typeof node !== 'object'}{node}{/if}
  {#if isTag(node)}
    {#if node.name in components}
      {#if node.children?.length}
        <svelte:component this={components[node.name]} {...node.attributes}>
          <svelte:self children={node.children} />
        </svelte:component>
      {:else}
        <svelte:component this={components[node.name]} {...node.attributes} />
      {/if}
    {:else if node.children?.length}
      <svelte:element this={node.name} {...node.attributes}>
        <svelte:self children={node.children} />
      </svelte:element>
    {:else}
      <svelte:element this={node.name} {...node.attributes} />
    {/if}
  {/if}
{/each}

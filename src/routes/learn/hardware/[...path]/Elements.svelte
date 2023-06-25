<script lang="ts">
  import type { RenderableTreeNode, Tag } from '@markdoc/markdoc';

  export let node: RenderableTreeNode;

  const isTag = (node: RenderableTreeNode): node is Tag =>
    !!node && typeof node === 'object' && 'children' in node;
</script>

{#if typeof node !== 'object'}{node}{/if}
{#if isTag(node)}
  <!-- {#if components.has(child.name)}
    <svelte:component this={components.get(child.name)} {...child.attributes}>
      <svelte:self children={child.children} />
    </svelte:component>
  {:else} -->
  <svelte:element this={node.name} {...node.attributes}>
    <svelte:self children={node.children} />
  </svelte:element>
  <!-- {/if} -->
{/if}

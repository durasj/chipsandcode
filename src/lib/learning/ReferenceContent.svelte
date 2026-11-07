<script lang="ts">
  import type { RenderableTreeNode, Tag } from '@markdoc/markdoc';
  export let children: RenderableTreeNode[] = [];
  const isTag = (node: RenderableTreeNode): node is Tag =>
    !!node && typeof node === 'object' && !Array.isArray(node) && 'children' in node;
</script>

{#each children as node}
  {#if typeof node === 'string' || typeof node === 'number'}
    {node}
  {:else if isTag(node)}
    {#if node.name === 'table'}
      <!-- The table region must be keyboard-scrollable when its columns exceed a narrow viewport. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div class="reference-table" tabindex="0" role="group" aria-label="Scrollable data table">
        <table><svelte:self children={node.children} /></table>
      </div>
    {:else if node.name === 'th'}
      <th {...node.attributes} scope="col"><svelte:self children={node.children} /></th>
    {:else if node.name === 'pre'}
      <!-- Code retains its layout and can be scrolled with the keyboard on narrow screens. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <pre
        {...node.attributes}
        tabindex="0"
        role="group"
        aria-label={node.attributes['data-language'] === 'hdl'
          ? 'Scrollable HDL example'
          : 'Scrollable code example'}><svelte:self children={node.children} /></pre>
    {:else if node.children?.length}
      <svelte:element this={node.name} {...node.attributes}>
        <svelte:self children={node.children} />
      </svelte:element>
    {:else}
      <svelte:element this={node.name} {...node.attributes} />
    {/if}
  {/if}
{/each}

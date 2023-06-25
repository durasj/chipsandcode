<script lang="ts">
  import katex from 'katex';

  export let expr: string;

  $: katexString = katex.renderToString(expr);
</script>

{@html katexString}

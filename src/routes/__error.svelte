<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';

  export const load: Load = ({ error, status }) => ({
    props: {
      message: `${status}: ${error?.message}`,
    },
  });
</script>

<script lang="ts">
  import Problem from 'src/components/Problem.svelte';

  export let message: string;
</script>

<Problem {message} />

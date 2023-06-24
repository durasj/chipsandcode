<script context="module" lang="ts">
  import { page } from '$app/stores';
</script>

<script lang="ts">
  import Problem from 'src/lib/components/Problem.svelte';

  export let message: string;

  if ($page.error) {
    message = `${$page.status}: ${$page.error.message}`;
  }
</script>

<Problem {message} />

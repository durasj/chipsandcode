<script lang="ts">
  import { page } from '$app/state';
  import Problem from '#src/lib/components/Problem.svelte';
  let message = $derived(`${page.status}: ${page.error?.message ?? 'Unexpected error'}`);
</script>

<Problem {message} />

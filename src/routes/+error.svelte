<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} — Chips and Code</title></svelte:head>
<main class="page-prose">
  <p class="eyebrow">{page.status}</p>
  <h1>
    {page.status === 404 ? 'That page is not here.' : 'Something interrupted the connection.'}
  </h1>
  <p>{page.error?.message ?? 'Try opening the page again.'}</p>
  <p><a href="/learn">Continue learning</a> or <a href="/tools">open Tools</a>.</p>
</main>

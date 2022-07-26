<script lang="ts">
  export let message: string;
</script>

<article role="alert" class="prose max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
  <h1 class="my-8">Uh, oh, an error has occurred 😞</h1>

  {message}

  <div class="my-8">
    <button class="btn mx-2" on:click={() => location.reload()}>Reload</button>
    <button class="btn mx-2" on:click={() => history.back()}>Go Back</button>
  </div>
</article>

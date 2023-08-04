<script>
  import Header from 'src/lib/components/Header.svelte';
  import Footer from 'src/lib/components/Footer.svelte';
</script>

<svelte:head>
  <title>Chips and Code: Sign In</title>
</svelte:head>

<Header />

<main class="flex-grow">
  <article class="prose max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 class="my-8">Hi, Anonym 👋</h1>

    Currently, all session are anonymous. You are able to edit your content from the same device.
    Content opened on other devices by you or others is read-only. The ability to sign in will come
    soon. Stay tuned!
  </article>
</main>

<Footer />

<script lang="ts">
  import HardwareIDE from '#lib/components/HardwareIDE.svelte';
</script>

<svelte:head
  ><title>Hardware simulator — Chips and Code</title><meta
    name="description"
    content="Describe a chip, test every input, and inspect its signals in the Chips and Code hardware simulator."
  /></svelte:head
>
<main class="hardware-tool-page">
  <header class="tool-introduction">
    <a href="/tools">← Tools</a>
    <h1>Hardware simulator</h1>
    <p>Describe the circuit. Test its behavior. Follow every signal.</p>
  </header>
  <HardwareIDE />
</main>

<style>
  .hardware-tool-page {
    width: min(100%, 1480px);
    margin: 0 auto;
    padding: 32px 4% 70px;
    color: #edf0fc;
  }
  .tool-introduction {
    margin-bottom: 30px;
  }
  .tool-introduction a {
    color: #c5baff;
    font-size: 12px;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  h1 {
    margin: 27px 0 13px;
    font-size: clamp(30px, 4vw, 46px);
    line-height: 1.12;
    font-weight: 500;
    letter-spacing: -0.04em;
  }
  p {
    color: #bdc4da;
    font-size: 15px;
    line-height: 1.7;
    margin: 0;
  }
  @media (max-width: 520px) {
    .hardware-tool-page {
      padding: 24px 16px 50px;
    }
  }
</style>

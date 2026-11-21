<script lang="ts">
  import examples from '../hardware-simulator/examples';
  export let id: string;

  $: experiment = examples.find(({ id: exampleId }) => exampleId === id);
</script>

{#if experiment}
  <aside class="tool-exercise" aria-label={`${experiment.name} exercise`}>
    <span>Try the circuit</span>
    <h3>{experiment.name}</h3>
    <p>
      Open this example in the hardware simulator to edit its HDL, test each input, and inspect the
      signals.
    </p>
    <a href={`/tools/hardware-simulator/${experiment.id}`}
      >Open in Tools <span aria-hidden="true">↗</span></a
    >
  </aside>
{:else}<p>That circuit example is unavailable.</p>{/if}

<style>
  .tool-exercise {
    margin: 28px 0;
    border: 1px solid #626b85;
    border-left: 3px solid #b7a9ff;
    background: #161c2b;
    color: #eef0fb;
    padding: 22px;
    border-radius: 4px;
  }
  .tool-exercise > span {
    font:
      11px ui-monospace,
      monospace;
    color: #bdc5dc;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  h3 {
    font-size: 20px;
    margin: 10px 0;
    font-weight: 500;
  }
  p {
    color: #c4c9da;
    font-size: 14px;
    line-height: 1.7;
    margin: 0 0 18px;
  }
  a {
    color: #cbbfff;
    font-size: 13px;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  a span {
    margin-left: 12px;
  }
</style>

<script lang="ts">
  const tools = [
    {
      n: '01',
      name: 'Hardware simulator',
      href: '/tools/hardware-simulator',
      description: 'Write HDL. Inspect the signals. Test your circuit.',
      mark: 'CHIP',
      note: 'Code · Signals · Tests',
    },
    {
      n: '02',
      name: 'Boolean functions',
      href: '/tools/boolean-functions',
      description: 'Turn a truth table into an expression and a NAND circuit.',
      mark: '0 1',
      note: 'Truth tables · Expressions · NAND',
    },
    {
      n: '03',
      name: 'Buses & routing',
      href: '/tools/buses',
      description: 'Work with whole words of bits and choose where signals go.',
      mark: '0011',
      note: '16-bit gates · Selectors · Routing',
    },
  ];
</script>

<svelte:head>
  <title>Tools — Chips and Code</title>
  <meta
    name="description"
    content="Explore computer logic with a hardware simulator, Boolean function builder, and bus and routing lab."
  />
</svelte:head>

<main class="tools-page">
  <header>
    <p class="eyebrow">OPEN THE MACHINE</p>
    <h1>Tools for thinking.</h1>
    <p>Change something. See what follows.</p>
  </header>
  <div class="tool-list">
    {#each tools as tool}
      <a class="tool-entry" href={tool.href}>
        <div class="tool-diagram" aria-hidden="true">
          <span>{tool.n}</span><b>{tool.mark}</b><i></i>
        </div>
        <div class="tool-copy">
          <h2>{tool.name}</h2>
          <p>{tool.description}</p>
          <span>{tool.note}</span>
        </div>
        <span class="tool-arrow" aria-hidden="true">↗</span>
      </a>
    {/each}
  </div>
  <p class="learn-note">
    Start with the basics in <a href="/learn">Learn</a>. Each tool is here when you need it.
  </p>
</main>

<style>
  .tools-page {
    max-width: 1200px;
    margin: auto;
    padding: 62px 5% 100px;
  }
  header {
    margin-bottom: 52px;
  }
  .eyebrow {
    color: #beb5ff;
    font:
      11px ui-monospace,
      monospace;
    letter-spacing: 0.12em;
    margin: 0 0 25px;
  }
  h1 {
    font-size: clamp(40px, 5.4vw, 68px);
    letter-spacing: -0.05em;
    line-height: 1.07;
    font-weight: 500;
    margin: 0 0 22px;
  }
  header > p:last-child {
    color: #b9c2d7;
    font-size: 18px;
    margin: 0;
  }
  .tool-list {
    border-top: 1px solid #424b63;
  }
  .tool-entry {
    display: grid;
    grid-template-columns: 180px 1fr 30px;
    gap: 38px;
    align-items: center;
    padding: 32px 0;
    border-bottom: 1px solid #424b63;
    text-decoration: none;
  }
  .tool-entry:hover h2 {
    color: #c5bbff;
  }
  .tool-entry:hover .tool-diagram {
    border-color: #b7acff;
  }
  .tool-diagram {
    height: 110px;
    position: relative;
    border: 1px solid #59627d;
    background: #101624;
    display: grid;
    place-items: center;
  }
  .tool-diagram > span {
    position: absolute;
    top: 10px;
    left: 12px;
    color: #b6bed3;
    font:
      10px ui-monospace,
      monospace;
  }
  .tool-diagram b {
    font:
      21px ui-monospace,
      monospace;
    letter-spacing: 0.12em;
    color: #c7bfff;
  }
  .tool-diagram i {
    position: absolute;
    bottom: 20px;
    width: 48px;
    height: 2px;
    background: #a69aff;
  }
  h2 {
    font-size: clamp(23px, 2.8vw, 32px);
    letter-spacing: -0.035em;
    line-height: 1.2;
    font-weight: 500;
    margin: 0 0 12px;
  }
  .tool-copy p {
    color: #bec6da;
    font-size: 15px;
    line-height: 1.7;
    margin: 0 0 14px;
    max-width: 480px;
  }
  .tool-copy > span {
    color: #aeb8cf;
    font:
      11px ui-monospace,
      monospace;
  }
  .tool-arrow {
    color: #b9afff;
    font-size: 25px;
  }
  .learn-note {
    color: #b1bad0;
    font-size: 14px;
    line-height: 1.8;
    margin: 30px 0 0;
  }
  .learn-note a {
    color: #c2b8ff;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  @media (max-width: 620px) {
    .tools-page {
      padding: 38px 20px 70px;
    }
    .tool-entry {
      grid-template-columns: 1fr 22px;
      gap: 18px;
    }
    .tool-diagram {
      grid-column: 1 / -1;
      width: 120px;
      height: 75px;
    }
    .tool-diagram i {
      bottom: 10px;
    }
    .tool-diagram b {
      font-size: 17px;
    }
    .tool-copy > span {
      font-size: 10px;
      line-height: 1.8;
    }
  }
</style>

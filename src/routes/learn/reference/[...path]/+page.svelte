<script lang="ts">
  import ReferenceContent from '#lib/learning/ReferenceContent.svelte';
  import { referencePages, referenceUrl } from '#lib/learning/reference.js';
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<svelte:head>
  <title>{data.title} — Chips and Code</title>
  <meta
    name="description"
    content="The complete explanation of signals, Boolean logic, gate construction, HDL, and buses, in Chips and Code."
  />
</svelte:head>

<main class="reference-page" id="reference-content">
  <div class="reading-navigation">
    <a class="back-link" href="/learn"><span aria-hidden="true">←</span> Back to Learn</a>
    <details class="reading-picker">
      <summary>Full explanations <span aria-hidden="true">+</span></summary>
      <nav aria-label="Full explanations">
        {#each referencePages as item}
          <a
            href={referenceUrl(item.path)}
            aria-current={item.path === data.current.path ? 'page' : undefined}>{item.label}</a
          >
        {/each}
      </nav>
    </details>
  </div>
  <header class="reading-header">
    <p class="eyebrow">Learn / Logic / The full explanation</p>
    <h1 tabindex="-1">{data.title}</h1>
  </header>

  <details class="contents">
    <summary>In this explanation</summary>
    <nav aria-label="On this page">
      {#each data.headings as heading}
        <a href={`#${heading.id}`}>{heading.title}</a>
      {/each}
    </nav>
  </details>

  <article class="reading-body">
    <ReferenceContent children={data.content} />
  </article>

  <nav class="reading-pagination" aria-label="Continue reading">
    {#if data.previous}
      <a href={referenceUrl(data.previous.path)}><span>Previous</span>{data.previous.title}</a>
    {/if}
    {#if data.next}
      <a class="next" href={referenceUrl(data.next.path)}
        ><span>Next</span>{data.next.title} <b aria-hidden="true">→</b></a
      >
    {/if}
  </nav>

  <p class="attribution">
    Adapted from the Chips and Code learning material by Jan Duras, based on
    <a href="https://www.nand2tetris.org/">Nand2Tetris</a> by Noam Nisan and Shimon Schocken.
    Learning content:
    <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/">CC BY-NC-SA 3.0</a>. Chips and Code
    is not affiliated with or endorsed by Nand2Tetris.
  </p>
</main>

<style>
  .reference-page {
    width: min(100%, 950px);
    margin: 0 auto;
    padding: 34px clamp(22px, 5vw, 64px) 80px;
    color: #f4f3ff;
    font-family: inherit;
    overflow-wrap: anywhere;
  }
  .reference-page :global(*) {
    box-sizing: border-box;
  }
  .reference-page :global(a) {
    color: #c0b7ff;
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  .reference-page :global(a:hover) {
    color: #e0dbff;
  }
  .reference-page :global(:focus-visible) {
    outline: 2px solid #c0b7ff !important;
    outline-offset: 5px;
  }
  .reading-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }
  .reading-navigation .back-link {
    color: #c0c4d5;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    font-size: 13px;
  }
  .reading-picker {
    position: relative;
  }
  summary {
    cursor: pointer;
    color: #c0c4d5;
    font-size: 13px;
    min-height: 44px;
    padding: 12px 0;
  }
  .reading-picker summary {
    display: flex;
    align-items: center;
    gap: 16px;
    list-style: none;
  }
  .reading-picker summary::-webkit-details-marker {
    display: none;
  }
  .reading-picker nav {
    position: absolute;
    z-index: 3;
    right: 0;
    top: 48px;
    width: 220px;
    padding: 8px;
    border: 1px solid #555c72;
    border-radius: 5px;
    background: #151925;
    box-shadow: 0 14px 50px #0006;
  }
  .reading-picker:not([open]) nav {
    display: none;
  }
  .reading-picker nav a {
    display: block;
    padding: 12px;
    font-size: 14px;
    text-decoration: none;
    color: #d4d6e3;
  }
  .reading-picker nav a:hover,
  .reading-picker nav a[aria-current] {
    color: #f5f2ff;
    background: #302a4e;
  }
  .reading-header {
    margin: 52px 0 28px;
  }
  .eyebrow {
    margin: 0 0 20px;
    color: #b3b7ca;
    font:
      11px/1.6 ui-monospace,
      monospace;
    text-transform: uppercase;
    letter-spacing: 0.09em;
  }
  h1 {
    font-size: clamp(36px, 5.5vw, 58px);
    font-weight: 500;
    letter-spacing: -0.045em;
    line-height: 1.08;
    margin: 0;
    max-width: 740px;
  }
  h1:focus {
    outline: none;
  }
  .contents {
    border-top: 1px solid #353c50;
    border-bottom: 1px solid #353c50;
    margin-bottom: 34px;
  }
  .contents nav {
    display: grid;
    gap: 2px;
    padding: 0 0 15px;
  }
  .contents:not([open]) nav {
    display: none;
  }
  .contents a {
    font-size: 14px;
    line-height: 1.5;
    padding: 8px 16px;
  }
  .reading-body {
    color: #d3d6e4;
    font-size: 16px;
    line-height: 1.85;
  }
  .reading-body :global(p) {
    margin: 20px 0;
  }
  .reading-body :global(h2) {
    color: #f4f3ff;
    font-size: clamp(26px, 3vw, 34px);
    line-height: 1.2;
    font-weight: 500;
    letter-spacing: -0.025em;
    margin: 66px 0 22px;
    padding-top: 8px;
    scroll-margin-top: 105px;
  }
  .reading-body :global(h3) {
    color: #f4f3ff;
    font-size: 22px;
    line-height: 1.3;
    font-weight: 500;
    letter-spacing: -0.015em;
    margin: 35px 0 18px;
    scroll-margin-top: 105px;
  }
  .reading-body :global(strong) {
    color: #f4f3ff;
    font-weight: 600;
  }
  .reading-body :global(ul),
  .reading-body :global(ol) {
    padding-left: 25px;
    margin: 22px 0;
  }
  .reading-body :global(ul) {
    list-style: disc;
  }
  .reading-body :global(ol) {
    list-style: decimal;
  }
  .reading-body :global(li) {
    margin: 10px 0;
    padding-left: 5px;
  }
  .reading-body :global(code) {
    color: #e0daff;
    font:
      0.88em/1.7 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .reading-body :global(p code),
  .reading-body :global(li code) {
    background: #1b2030;
    padding: 2px 5px;
    border-radius: 3px;
  }
  .reading-body :global(pre) {
    margin: 28px 0;
    padding: 24px;
    max-width: 100%;
    overflow-x: auto;
    background: #111624;
    border: 1px solid #42495f;
    border-radius: 4px;
    color: #e0daff;
    font:
      13px/1.75 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .reading-body :global(pre code) {
    white-space: pre;
    font-size: 13px;
  }
  .reading-body :global(.reference-table) {
    max-width: 100%;
    overflow-x: auto;
    margin: 28px 0;
    border: 1px solid #42495f;
    border-radius: 4px;
  }
  .reading-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 14px;
    line-height: 1.6;
  }
  .reading-body :global(th) {
    background: #1b2030;
    color: #eeeaff;
    font-weight: 500;
    overflow-wrap: normal;
  }
  .reading-body :global(th),
  .reading-body :global(td) {
    padding: 12px 16px;
    border-bottom: 1px solid #353c50;
  }
  .reading-body :global(tr:last-child td) {
    border-bottom: 0;
  }
  .reading-body :global(tbody tr:nth-child(even)) {
    background: #101521;
  }
  .reading-pagination {
    margin-top: 60px;
    border-top: 1px solid #42495f;
    padding-top: 28px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr));
    gap: 24px;
  }
  .reading-pagination a {
    text-decoration: none;
    line-height: 1.5;
    font-size: 17px;
  }
  .reading-pagination span {
    display: block;
    color: #b3b7ca;
    font:
      11px/1.5 ui-monospace,
      monospace;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    margin-bottom: 10px;
  }
  .reading-pagination b {
    margin-left: 8px;
    font-weight: 400;
  }
  .attribution {
    margin: 50px 0 0;
    border-top: 1px solid #353c50;
    padding-top: 24px;
    color: #b3b7ca;
    font-size: 12px;
    line-height: 1.8;
  }
  @media (max-width: 520px) {
    .reference-page {
      padding-top: 20px;
    }
    .reading-header {
      margin-top: 34px;
    }
    .reading-body {
      font-size: 15px;
    }
    .reading-body :global(pre) {
      padding: 16px;
    }
    .reading-body :global(th),
    .reading-body :global(td) {
      padding: 10px 12px;
    }
    .reading-picker summary {
      gap: 8px;
      font-size: 12px;
    }
    .reading-navigation .back-link {
      font-size: 12px;
    }
  }
</style>

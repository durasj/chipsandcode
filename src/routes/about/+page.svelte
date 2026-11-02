<svelte:head>
  <title>About — Chips and Code</title>
  <meta
    name="description"
    content="An open, browser-based way to understand computers by building them, from signals to software."
  />
</svelte:head>

<main class="page-prose">
  <p class="eyebrow">ABOUT CHIPS AND CODE</p>
  <h1>Understand it{' '}<br />by building it.</h1>
  <p class="lead">
    Computers become less mysterious when you can change a signal, connect a gate, and see what
    happens.
  </p>
  <section>
    <h2>From chips to code</h2>
    <p>
      Chips and Code brings hands-on computer construction to the browser. Start with no
      prerequisites, learn one idea at a time, and use visual circuits or code to explore the same
      machine.
    </p>
    <p>
      The current learning path covers Boolean logic: signals, gates, circuit composition, truth
      tables, expressions, buses, and routing. Arithmetic, memory, processors, and higher-level
      software are the journey ahead.
    </p>
    <p><a href="/learn">Start learning</a> or <a href="/tools">open a tool</a>.</p>
  </section>
  <section>
    <h2>Built on learning research</h2>
    <p>
      The project began during a master’s thesis at the <a href="https://www.universityofgalway.ie"
        >University of Galway</a
      >, including a comparative study of moving computer-construction tools to the web.
    </p>
    <p>
      <a href="https://thesis.chipsandcode.com">Read the research</a>. The project is open source:
      <a href="https://github.com/durasj/chipsandcode">explore the code</a>,
      <a href="https://github.com/durasj/chipsandcode/issues">report a bug or request a feature</a>,
      or <a href="https://github.com/durasj/chipsandcode/discussions">join a discussion</a>.
    </p>
  </section>
  <section id="device-storage">
    <h2>Your work, on this device</h2>
    <p>
      Learning progress and circuit drafts are kept in your browser. Clearing site data removes
      those local copies. You can download a simulator experiment to keep its HDL, tests, and
      expected output.
    </p>
    <p>
      Simulator experiments can also be saved and shared through a link. Editing a saved experiment
      uses the anonymous session that created it; another browser can open it and save its own copy.
      Accounts and cross-device progress sync are not available yet.
    </p>
  </section>
  <section>
    <h2>Sources and credits</h2>
    <p>
      The learning material is adapted from <a href="https://www.nand2tetris.org">Nand2Tetris</a> by
      Noam Nisan and Shimon Schocken, under
      <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/">CC BY-NC-SA 3.0</a>. Chips and
      Code is an independent project, not affiliated with or endorsed by Nand2Tetris.
    </p>
    <p>
      The software is <a href="https://github.com/durasj/chipsandcode/blob/main/LICENSE"
        >MIT licensed</a
      >. It builds on open-source work including Svelte, Monaco Editor, Nearley, Tailwind, and
      daisyUI. The repository records the
      <a href="https://github.com/durasj/chipsandcode/blob/main/package.json"
        >full dependency list</a
      >.
    </p>
    <details>
      <summary>Thank you to the research participants</summary>
      <p>
        Jan, Matej, Patrik, Pavol, Stefan, Michal, Masa, Michal, Sasa, Jozef, Peter, Matus, Brano,
        Robert, Lubo, Max, Viktoria, Kyryl, Matus, Lukas, Martina, Karolina, Lubos, Martin, Erik,
        and Filip.
      </p>
    </details>
  </section>
</main>

<script>
  import Header from 'src/lib/components/Header.svelte';
  import Footer from 'src/lib/components/Footer.svelte';
</script>

<svelte:head>
  <title>Accessibility Statement - Chips and Code</title>
</svelte:head>

<Header />

<main class="flex-grow">
  <article>
    <h1 class="text-center text-5xl md:text-6xl font-bold my-12">Accessibility</h1>

    <div class="bg-base-200">
      <div class="prose max-w-7xl mx-auto px-8 py-16 sm:flex-row">
        <h2 class="my-2">Summary</h2>
        <p>
          We want as many people as possible to be able to use this website.
          <a href="https://mcmw.abilitynet.org.uk/" target="_blank">AbilityNet</a> has advice on making
          your device easier to use if you have a disability. Chips and Code strives to meet Web Content
          Accessibility Guidelines (WCAG) 2.1 at Level AA. That being said, implementing for accessibility
          can be hard. If you experience any issues or have any suggestions, please let us know at the
          "Report Bug/Request Feature" link.
        </p>

        <a
          href="https://github.com/durasj/chipsandcode/issues"
          target="_blank"
          class="btn btn-primary my-1">Report Bug / Request Feature</a
        >
      </div>
    </div>

    <div>
      <div class="prose max-w-7xl mx-auto px-8 py-16 sm:flex-row">
        <h2 class="my-2">Measures to support accessibility</h2>
        <p>You should be able to:</p>

        <ul>
          <li>change colors, contrast levels and fonts</li>
          <li>zoom in up to 300% without the text spilling off the screen</li>
          <li>navigate most of the website using just a keyboard</li>
          <li>navigate most of the website using speech recognition software</li>
          <li>
            listen to most of the website using a widely used screen reader and the last two
            versions of major browsers.
          </li>
        </ul>

        We try to make sure the the website is as simple as possible. We try to think about
        accessibility any time we add any new content or feature. We run automated checks on all
        important pages to make sure there are no trivial accessibility issues. We perform
        self-evaluation to assess our compliance.
      </div>
    </div>

    <div class="bg-base-200">
      <div class="prose max-w-7xl mx-auto px-8 py-16">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <h2>Conformance status</h2>

            <p>
              The <a href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank"
                >Web Content Accessibility Guidelines (WCAG)</a
              > standard defines requirements to improve accessibility for people with disabilities.
              It defines three levels of conformance: Level A, Level AA, and Level AAA. "Fully conforms"
              means that the content meets all of the WCAG requirements at the specified Level without
              exceptions.
            </p>
            <p>Chips and Code learning code and tools aim to fully conform to WCAG 2.1 Level AA.</p>
          </div>

          <div>
            <h2>Technical specifications</h2>
            <p>We rely on the following technologies for conformance with WCAG 2.1:</p>

            <ul>
              <li>HTML</li>
              <li>WAI-ARIA</li>
              <li>CSS</li>
              <li>SVG</li>
            </ul>
            The following technologies are used to improve accessibility and the user experience for
            everyone:

            <ul>
              <li>JavaScript</li>
              <li>MathML</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </article>
</main>

<Footer />

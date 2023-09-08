<script>
  import Header from 'src/lib/components/Header.svelte';
  import Footer from 'src/lib/components/Footer.svelte';

  const oss = [
    'Nand2Tetris content licensed under the CC BY-NC-SA 3.0',
    'Svelte framework',
    'Tailwind and DaisyUI styling libraries',
    'Nearley parser toolkit',
    'and Monaco Editor, all licensed under the MIT license',
  ];

  const studyParticipants = [
    'Jan',
    'Matej',
    'Patrik',
    'Pavol',
    'Stefan',
    'Michal',
    'Masa',
    'Michal',
    'Sasa',
    'Jozef',
    'Peter',
    'Matus',
    'Brano',
    'Robert',
    'Lubo',
    'Max',
    'Viktoria',
    'Kyryl',
    'Matus',
    'Lukas',
    'Martina',
    'Karolina',
    'Lubos',
    'Martin',
    'Erik',
    'Filip',
  ];
</script>

<svelte:head>
  <title>About Chips and Code</title>
</svelte:head>

<Header />

<main class="flex-grow">
  <article>
    <h1 class="text-center text-5xl md:text-6xl font-bold my-12">Chips and Code</h1>

    <p class="text-center mb-4">
      <a href="https://github.com/durasj/chipsandcode/issues" target="_blank" class="btn m-1"
        >Report Bug / Request Feature</a
      >
      <a href="https://github.com/durasj/chipsandcode/discussions" target="_blank" class="btn m-1"
        >Discussions</a
      >
    </p>

    <div class="bg-base-200">
      <div class="prose max-w-7xl mx-auto px-8 py-16 flex flex-col sm:flex-row gap-4">
        <div class="text-9xl">⚒️</div>
        <div>
          <h2 class="my-2">Motivation</h2>
          <p>
            This project was started as a reimagined <a
              href="https://nand2tetris.org"
              targe="_blank">Nand2Tetris</a
            >
            (not affiliated or endorsed by them). Nand2Tetris is a very popular course that introduces
            a wide range of computer principles by building a virtual computer from the group up. However,
            it is accompanied by an older Java desktop application inaccessible from a large range of
            devices (like tablets, Chromebooks, smartphones... -
            <a
              href="https://www.pewresearch.org/internet/2019/03/07/use-of-smartphones-and-social-media-is-common-across-most-emerging-economies/"
              target="_blank">one-fourth</a
            > of people from developing countries rely on smartphones!). Chips and Code aims to reimplement
            the same functionality using the modern web with improved user experience.
          </p>
        </div>
      </div>
    </div>

    <div class="prose max-w-7xl mx-auto px-8 py-16 flex flex-col sm:flex-row-reverse gap-4">
      <div class="text-9xl text-right">🎓</div>

      <div class="text-right">
        <h2 class="my-2">Background</h2>
        <p>
          Most of the functionality was built while I was working on my master's thesis at the
          <a href="https://www.universityofgalway.ie" target="_blank">University of Galway</a>. As a
          part of that, I've run a comparative study exploring usability improvements of moving the
          existing learning tool to the web. If you are interested in learning more, visit the links
          below.
        </p>

        <a href="https://thesis.chipsandcode.com" target="_blank" class="btn m-1">Research Behind</a
        >
        <a href="https://github.com/durasj/chipsandcode" target="_blank" class="btn m-1"
          >Code Repository</a
        >
      </div>
    </div>

    <div class="bg-primary">
      <div class="prose text-primary-content max-w-7xl mx-auto px-8 py-16">
        <h2 class="my-8 text-5xl text-center text-primary-content">Credits 🙏</h2>

        <p class="text-center">
          None of this would be possible without the open-source community and the help of many
          wonderful people who participated in the research.
        </p>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <h3 class="text-primary-content">Open source</h3>

            <p>
              This project relies on a large selection of open-source work. Notably: {oss.join(
                ', ',
              )}. See all
              <a
                href="https://github.com/durasj/chipsandcode/blob/main/package.json#L19"
                target="_blank"
                class="text-primary-content">dependencies</a
              >.
            </p>
          </div>

          <div>
            <h3 class="text-primary-content">Study participants</h3>

            <p>
              Thank you <strong class="text-primary-content">{studyParticipants.join(', ')}</strong>
              for participating in the comparative study and providing me with the feedback. It was a
              blast working with you!
            </p>
          </div>
        </div>
      </div>
    </div>
  </article>
</main>

<Footer />

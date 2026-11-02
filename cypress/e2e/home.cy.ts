function visitLanding(reducedMotion = false) {
  cy.visit('/', {
    onBeforeLoad(window) {
      window.localStorage.clear();
      const originalMatchMedia = window.matchMedia.bind(window);
      cy.stub(window, 'matchMedia').callsFake((query: string) => {
        if (query !== '(prefers-reduced-motion: reduce)') return originalMatchMedia(query);
        return {
          matches: reducedMotion,
          media: query,
          onchange: null,
          addListener() {},
          removeListener() {},
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent() {
            return true;
          },
        } satisfies MediaQueryList;
      });
    },
  });
  cy.contains('Progress saved on this device');
}

function selectJourneyPhase(name: string) {
  cy.findByRole('navigation', { name: 'Explore computer layers' })
    .findByRole('button', { name: new RegExp(name) })
    .click()
    .should('have.attr', 'aria-pressed', 'true');
}

describe('Chips and Code landing', () => {
  it('Introduces the layers from signals to software and opens the first workbench', () => {
    visitLanding();
    cy.findByRole('heading', { level: 1, name: /From signals\s*to software\./ }).should(
      'be.visible',
    );
    cy.findByRole('region', { name: 'Logic challenges' })
      .findAllByRole('button')
      .should('have.length', 7);
    cy.contains('0 / 7 CHIPS VERIFIED');
    cy.findByRole('button', { name: 'Begin building' }).then(($button) => {
      const bounds = $button[0].getBoundingClientRect();
      expect(bounds.bottom, 'start action is visible without scrolling').to.be.at.most(720);
    });
    ['arithmetic', 'memory', 'architecture', 'software'].forEach((layer) => {
      cy.get(`#layer-${layer}`).within(() => {
        cy.contains('Planned');
        cy.findByRole('heading', { level: 2 }).should('be.visible');
      });
    });
    // Freeze an actual journey phase so review captures are reproducible.
    selectJourneyPhase('Logic');
    cy.findByRole('button', { name: 'Play layer journey' }).should('be.visible');
    cy.screenshot('computer-layers-landing', { capture: 'fullPage' });
    cy.injectAxe();
    cy.checkA11y();

    cy.findByRole('button', { name: 'Begin building' }).click();
    cy.findByRole('heading', { name: 'Read the signal' }).should('be.visible');
    cy.findByRole('region', { name: 'Discover NAND' }).should('be.visible');
    cy.findByLabelText('HDL source').should('have.attr', 'readonly');
    cy.location('pathname').should('eq', '/');
  });

  it('Plays, pauses, and scrubs the cinematic journey without navigating away', () => {
    visitLanding();
    cy.findByRole('button', { name: 'Pause layer journey' }).click();
    cy.findByRole('button', { name: 'Play layer journey' }).should('be.visible');
    selectJourneyPhase('Arithmetic');
    cy.findByRole('img', { name: /Arithmetic\. Four one-bit adders/ }).should('be.visible');
    cy.get('.timecode')
      .invoke('text')
      .then((pausedTime) => {
        cy.findByRole('button', { name: 'Play layer journey' }).click();
        cy.get('.timecode', { timeout: 5000 }).should(($timecode) => {
          expect($timecode.text(), 'the animation advances').not.to.equal(pausedTime);
        });
      });
    cy.findByRole('button', { name: 'Pause layer journey' }).click();
    selectJourneyPhase('Memory');
    cy.findByRole('img', { name: /Memory\. A register keeps its value/ }).should('be.visible');
    selectJourneyPhase('Software');
    cy.findByRole('img', { name: /Software\. Every line of code/ })
      .should('be.visible')
      .and('have.css', 'background-color', 'rgb(242, 241, 247)');
    cy.findByRole('button', { name: 'Play layer journey' }).should('be.visible');
    cy.findByRole('heading', { level: 1, name: /From signals\s*to software\./ }).should(
      'be.visible',
    );
    cy.get('.hero').screenshot('computer-hero-software');
    cy.injectAxe();
    cy.checkA11y();
  });

  it('Starts still for reduced motion and keeps manual chapter controls available', () => {
    visitLanding(true);
    cy.get('.layer-journey').should('have.class', 'reduced-motion').and('not.have.class', 'moving');
    cy.findByRole('button', { name: 'Play layer journey' }).should('be.visible');
    cy.findByRole('button', { name: 'Pause layer journey' }).should('not.exist');
    cy.findByRole('img', { name: /Signals & logic\. A NAND gate/ }).should('be.visible');
    selectJourneyPhase('Software');
    cy.findByRole('img', { name: /Software\. Every line of code/ }).should('be.visible');
    cy.get('.layer-journey').should('not.have.class', 'moving');
    cy.findByRole('button', { name: 'Play layer journey' }).click();
    cy.findByRole('button', { name: 'Pause layer journey' }).should('be.visible');
  });

  it('Loads and plays the captioned introduction, then returns focus to its launch button', () => {
    visitLanding(true);
    cy.findByRole('button', { name: 'Watch the journey' }).click();
    cy.findByRole('dialog', { name: 'From signals to software' }).should('be.visible');
    cy.get('video').should('have.attr', 'controls');
    cy.get('video source').should('have.attr', 'src', '/media/computer-intro.mp4');
    cy.get('video track[kind="captions"]').should('have.attr', 'default');
    cy.findByRole('link', { name: /Read transcript/ }).should(
      'have.attr',
      'href',
      '/media/computer-intro-transcript.txt',
    );
    cy.get<HTMLVideoElement>('video', { timeout: 30000 }).should(($video) => {
      const video = $video[0];
      expect(video.error, 'the browser can decode the film').to.equal(null);
      expect(video.readyState, 'a decoded video frame is available').to.be.at.least(2);
      expect(video.videoWidth).to.equal(1280);
      expect(video.videoHeight).to.equal(720);
      expect(video.duration).to.be.closeTo(48, 0.2);
    });
    cy.get<HTMLVideoElement>('video').then(($video) => {
      const video = $video[0];
      video.pause();
      video.currentTime = 0;
      video.muted = true;
      return video.play();
    });
    cy.get<HTMLVideoElement>('video', { timeout: 10000 }).should(($video) => {
      expect($video[0].currentTime, 'decoded video playback advances').to.be.greaterThan(0.25);
    });
    cy.get<HTMLTrackElement>('video track[kind="captions"]').should(($track) => {
      expect($track[0].readyState, 'captions load').to.equal(2);
      expect($track[0].track.cues?.length).to.be.greaterThan(0);
    });
    cy.findByRole('button', { name: 'Close introduction' }).click();
    cy.findByRole('dialog').should('not.exist');
    cy.findByRole('button', { name: 'Watch the journey' }).should('have.focus');
  });

  it('Keeps the interactive reference accessible across its chapters', () => {
    visitLanding(true);
    cy.findByRole('navigation', { name: 'Workspace navigation' })
      .findByRole('button', { name: 'Reference' })
      .click();
    cy.findByRole('region', { name: 'Logic reference' }).should('be.visible');
    cy.findByRole('heading', { name: 'Signals and gates' }).should('be.visible');
    cy.injectAxe();
    cy.checkA11y();
    const chapters = [
      { button: 'Expressions', heading: 'Boolean expressions' },
      { button: 'HDL & composition', heading: 'Interfaces and implementation' },
      { button: 'Buses & selectors', heading: 'Buses and selectors' },
      { button: 'Sources', heading: 'Source material' },
    ];
    chapters.forEach(({ button, heading }) => {
      cy.findByRole('navigation', { name: 'Reference chapters' })
        .findByRole('button', { name: new RegExp(button) })
        .click();
      cy.findByRole('heading', { name: heading }).should('be.visible');
      cy.checkA11y();
    });
    cy.findByRole('button', { name: /Back to layers/ }).click();
    cy.findByRole('region', { name: 'Logic challenges' }).should('be.visible');
  });
});

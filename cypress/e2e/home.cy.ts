function visitLanding(reducedMotion = false) {
  cy.visit('/', {
    onBeforeLoad(window) {
      window.localStorage.clear();
      const originalMatchMedia = window.matchMedia.bind(window);
      // The shared visit command already stubs matchMedia for the light theme.
      window.matchMedia = (query: string) => {
        const result = originalMatchMedia(query);
        if (query === '(prefers-reduced-motion: reduce)') {
          Object.defineProperty(result, 'matches', { value: reducedMotion });
        }
        return result;
      };
    },
  });
  cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
}

function checkAccessibility() {
  cy.checkA11y(undefined, undefined, (violations) => {
    if (violations.length) {
      const details = violations.map(
        (violation) =>
          `${violation.id}:\n${violation.nodes
            .map((node) => `${JSON.stringify(node.target)}\n${node.failureSummary}`)
            .join('\n')}`,
      );
      throw new Error(`Accessibility violations:\n${details.join('\n\n')}`);
    }
  });
}

function scrollToLayer(layer: string) {
  cy.get(`#layer-${layer}`).then(($section) => {
    cy.window().then((window) => {
      const section = $section[0].getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + section.top + section.height / 2 - window.innerHeight / 2,
        behavior: 'instant',
      });
    });
  });
}

describe('Chips and Code landing', () => {
  it('Keeps the original invitation and presents one clear first step', () => {
    visitLanding();
    cy.findByRole('heading', { level: 1, name: 'Wondering how computers work?' }).should(
      'be.visible',
    );
    cy.contains('Build your own computer from scratch');
    cy.get('.opening')
      .findByRole('button', { name: 'Start learning' })
      .then(($button) => {
        const bounds = $button[0].getBoundingClientRect();
        expect(bounds.bottom, 'learning starts without scrolling').to.be.at.most(720);
      });
    cy.window().then((window) => {
      const visibleControls = [
        ...window.document.querySelectorAll<HTMLElement>(
          'a, button, summary, input, select, [role="switch"]',
        ),
      ].filter((element) => {
        const bounds = element.getBoundingClientRect();
        return (
          Cypress.dom.isVisible(element) &&
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.top >= 0 &&
          bounds.bottom <= window.innerHeight
        );
      });
      expect(
        visibleControls.map((element) => element.textContent?.trim()),
        'only the brand, menu, and learning action occupy the opening viewport',
      ).to.have.length.at.most(3);
    });
    cy.findByRole('navigation', { name: 'Workspace menu' }).should('not.exist');
    cy.findByRole('region', { name: 'Logic challenges' }).should('not.exist');
    cy.findByRole('navigation', { name: 'Explore computer layers' }).should('not.exist');
    cy.findByRole('button', { name: /Play layer journey|Pause layer journey/ }).should('not.exist');
    cy.screenshot('minimal-home-desktop', { capture: 'viewport' });
    cy.injectAxe();
    checkAccessibility();

    cy.get('.opening').findByRole('button', { name: 'Start learning' }).click();
    cy.findByRole('heading', { name: 'A computer starts with a signal.' }).should('be.visible');
    cy.findByRole('switch', { name: 'Signal' }).should('have.attr', 'aria-checked', 'false');
    cy.findByLabelText('HDL source').should('not.exist');
    cy.findByLabelText('Editor view').should('not.exist');
    cy.screenshot('first-signal-desktop', { capture: 'viewport' });
    checkAccessibility();
  });

  it('Moves through the computer layers by scrolling, without adding navigation controls', () => {
    visitLanding();
    const layers = ['logic', 'arithmetic', 'memory', 'architecture', 'software'];
    layers.forEach((layer) => {
      scrollToLayer(layer);
      cy.get('.parallax-stage').should('have.attr', 'data-active-layer', layer);
      cy.get(`#layer-${layer}`).findByRole('heading', { level: 2 }).should('be.visible');
      if (layer === 'memory' || layer === 'software') {
        cy.screenshot(`parallax-${layer}`, { capture: 'viewport' });
      }
    });
    cy.findByRole('button', { name: /Play layer journey|Pause layer journey/ }).should('not.exist');
    cy.injectAxe();
    checkAccessibility();
    // Every entry point starts a new visitor at the physical foundation.
    cy.get('.journey-start').findByRole('button', { name: 'Start learning' }).click();
    cy.findByRole('heading', { name: 'A computer starts with a signal.' }).should('be.visible');
  });

  it('Presents every layer as a readable still when reduced motion is requested', () => {
    visitLanding(true);
    cy.get('.quiet-landing').should('have.class', 'reduced-motion');
    ['logic', 'arithmetic', 'memory', 'architecture', 'software'].forEach((layer) => {
      cy.get(`#layer-${layer}`).within(() => {
        cy.findByRole('heading', { level: 2 }).should('be.visible');
        cy.findByRole('img').should('be.visible');
      });
    });
    cy.screenshot('layers-reduced-motion', { capture: 'fullPage' });
    cy.injectAxe();
    checkAccessibility();
  });

  it('Introduces one signal and then NAND without overflowing a narrow screen', () => {
    cy.viewport(320, 760);
    visitLanding(true);
    cy.get('.opening').findByRole('button', { name: 'Start learning' }).click();
    cy.findByRole('heading', { name: 'A computer starts with a signal.' }).should('be.visible');
    cy.screenshot('first-signal-mobile', { capture: 'viewport' });
    cy.findByRole('switch', { name: 'Signal' })
      .click()
      .should('have.attr', 'aria-checked', 'true')
      .click()
      .should('have.attr', 'aria-checked', 'false');
    cy.findByRole('button', { name: 'Continue' }).click();
    cy.findByRole('heading', { name: 'Two signals. One rule.' }).should('be.visible');
    cy.document().should((document) => {
      expect(
        Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      ).to.be.at.most(document.documentElement.clientWidth + 1);
    });
    cy.screenshot('nand-experiment-mobile', { capture: 'viewport' });
    cy.injectAxe();
    checkAccessibility();
  });

  it('Plays the optional captioned introduction and restores focus when closed', () => {
    visitLanding(true);
    cy.findByRole('button', { name: 'Watch the introduction' }).click();
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
    cy.findByRole('button', { name: 'Watch the introduction' }).should('have.focus');
  });

  it('Keeps reference material available on demand and accessible across chapters', () => {
    visitLanding(true);
    cy.contains('summary', 'Menu').click();
    cy.findByRole('navigation', { name: 'Workspace menu' })
      .findByRole('button', { name: 'Reference' })
      .click();
    cy.findByRole('region', { name: 'Logic reference' }).should('be.visible');
    cy.findByRole('heading', { name: 'Signals and gates' }).should('be.visible');
    cy.injectAxe();
    checkAccessibility();
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
      checkAccessibility();
    });
    cy.findByRole('button', { name: 'Back' }).click();
    cy.findByRole('heading', { level: 1, name: 'Wondering how computers work?' }).should(
      'be.visible',
    );
  });
});

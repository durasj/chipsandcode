import {
  checkAccessibility,
  expectMainNavigation,
  expectNoPageOverflow,
  exploreNotAnd,
} from '../support/checks';

function visitLanding(reducedMotion = false) {
  cy.visit('/', {
    onBeforeLoad(window) {
      window.localStorage.clear();
      const originalMatchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query: string) => {
        const result = originalMatchMedia(query);
        if (query === '(prefers-reduced-motion: reduce)') {
          Object.defineProperty(result, 'matches', { value: reducedMotion });
        }
        return result;
      };
    },
  });
  cy.get('.landing-page').should('have.attr', 'data-ready', 'true');
}

const phases = ['computer', 'components', 'chip', 'signals'];

function scrollToPhase(phase: string, fraction = 0.5) {
  cy.get(`#journey-${phase}`).then(($section) => {
    cy.window().then((window) => {
      const box = $section[0].getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + box.top + box.height * fraction - window.innerHeight / 2,
        behavior: 'instant',
      });
    });
  });
}

describe('Computer journey landing', () => {
  it('Offers one clear start with Learn, Tools and About navigation', () => {
    visitLanding();
    expectMainNavigation();
    cy.findByRole('heading', { level: 1, name: 'Break down the magic of computers.' }).should(
      'be.visible',
    );
    cy.get('.opening')
      .findByRole('button', { name: 'Start learning' })
      .then(($button) => {
        expect(
          $button[0].getBoundingClientRect().bottom,
          'learning starts without scrolling',
        ).to.be.at.most(720);
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
        'only the brand, three main links, and start action occupy the opening',
      ).to.have.length.at.most(5);
    });
    cy.findByRole('navigation', { name: 'Workspace menu' }).should('not.exist');
    cy.findByRole('button', { name: /Play layer journey|Pause layer journey/ }).should('not.exist');
    cy.screenshot('computer-home-desktop', { capture: 'viewport' });
    cy.injectAxe();
    checkAccessibility();
    cy.get('.opening').findByRole('button', { name: 'Start learning' }).click();
    cy.location('pathname').should('eq', '/learn');
    cy.findByRole('heading', { name: 'A computer starts with a signal.' }).should('be.visible');
    cy.findByLabelText('HDL source').should('not.exist');
    cy.findByLabelText('Editor view').should('not.exist');
  });

  it('Disassembles the computer and zooms to signals through native scrolling', () => {
    visitLanding();
    cy.injectAxe();
    phases.forEach((phase) => {
      scrollToPhase(phase);
      cy.get('.computer-stage').should('have.attr', 'data-phase', phase);
      cy.get(`#journey-${phase}`)
        .findByRole('heading', { level: phase === 'computer' ? 1 : 2 })
        .should('be.visible');
      checkAccessibility();
      cy.screenshot(`computer-journey-${phase}`, { capture: 'viewport' });
    });
    cy.get('.computer-stage')
      .invoke('attr', 'data-progress')
      .then((progress) => {
        expect(Number(progress), 'scene reaches the chip-level signal view').to.be.greaterThan(2.5);
      });
    // Intermediate scroll positions must remain readable too, not only settled phases.
    ['computer', 'components', 'chip'].forEach((phase) => {
      scrollToPhase(phase, 0.95);
      checkAccessibility();
    });
    cy.get('.journey-start').scrollIntoView();
    checkAccessibility();
    cy.get('.journey-start').findByRole('button', { name: 'Start learning' }).click();
    cy.location('pathname').should('eq', '/learn');
    cy.findByRole('heading', { name: 'A computer starts with a signal.' }).should('be.visible');
  });

  it('Provides readable stills for every phase with reduced motion', () => {
    visitLanding(true);
    cy.get('.computer-journey').should('have.class', 'reduced-motion');
    phases.forEach((phase) => {
      cy.get(`#journey-${phase}`).within(() => {
        cy.findByRole('heading', { level: phase === 'computer' ? 1 : 2 }).should('be.visible');
        cy.findByRole('img').should('be.visible');
      });
    });
    cy.screenshot('computer-journey-reduced-motion', { capture: 'fullPage' });
    cy.injectAxe();
    checkAccessibility();
  });

  it('Introduces signals, NOT and AND before NAND on a narrow screen', () => {
    cy.viewport(320, 760);
    visitLanding(true);
    expectMainNavigation();
    expectNoPageOverflow();
    cy.screenshot('computer-home-mobile', { capture: 'fullPage' });
    cy.get('.opening').findByRole('button', { name: 'Start learning' }).click();
    cy.findByRole('heading', { name: 'A computer starts with a signal.' }).should('be.visible');
    cy.screenshot('first-signal-mobile', { capture: 'viewport' });
    cy.injectAxe();
    checkAccessibility();
    cy.findByRole('switch', { name: 'Signal' }).click();
    cy.findByRole('switch', { name: 'Signal' }).click();
    cy.findByRole('button', { name: 'Continue' }).click();
    exploreNotAnd();
    expectNoPageOverflow();
    cy.screenshot('nand-after-foundations-mobile', { capture: 'viewport' });
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
});

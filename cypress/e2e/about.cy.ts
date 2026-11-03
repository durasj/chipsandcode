import { checkAccessibility, expectMainNavigation, expectNoPageOverflow } from '../support/checks';

describe('About', () => {
  it('Uses the shared navigation and preserves project background and attribution', () => {
    cy.visit('/');
    cy.findByRole('navigation', { name: 'Main navigation' })
      .findByRole('link', { name: 'About' })
      .click();
    cy.location('pathname').should('eq', '/about');
    expectMainNavigation();
    cy.findByRole('heading', { level: 1, name: 'Understand it by building it.' }).should(
      'be.visible',
    );
    cy.findByRole('link', { name: 'University of Galway' }).should(
      'have.attr',
      'href',
      'https://www.universityofgalway.ie',
    );
    cy.findByRole('link', { name: 'Read the research' }).should(
      'have.attr',
      'href',
      'https://thesis.chipsandcode.com',
    );
    cy.findByRole('link', { name: 'Nand2Tetris' }).should(
      'have.attr',
      'href',
      'https://www.nand2tetris.org',
    );
    cy.findByRole('link', { name: 'CC BY-NC-SA 3.0' }).should(
      'have.attr',
      'href',
      'https://creativecommons.org/licenses/by-nc-sa/3.0/',
    );
    cy.contains('not affiliated with or endorsed by Nand2Tetris');
    cy.findByRole('link', { name: 'report a bug or request a feature' }).should(
      'have.attr',
      'href',
      'https://github.com/durasj/chipsandcode/issues',
    );
    cy.contains('summary', 'Thank you to the research participants').click();
    cy.contains('Viktoria, Kyryl, Matus');
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('about-unified', { capture: 'fullPage' });
  });

  it('Reflows the project explanation at a narrow width', () => {
    cy.viewport(320, 760);
    cy.visit('/about');
    expectNoPageOverflow();
    cy.injectAxe();
    checkAccessibility();
  });
});

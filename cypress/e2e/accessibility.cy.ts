import { checkAccessibility, expectMainNavigation } from '../support/checks';

describe('Accessibility statement', () => {
  it('Explains the available controls and feedback path in the shared interface', () => {
    cy.visit('/');
    cy.get('footer').findByRole('link', { name: 'Accessibility' }).click();
    cy.location('pathname').should('eq', '/accessibility-statement');
    expectMainNavigation();
    cy.findByRole('heading', { level: 1, name: 'A machine you can explore.' }).should('be.visible');
    cy.findByRole('heading', { name: 'Navigation and interaction' }).should('be.visible');
    cy.findByRole('heading', { name: 'Reading, code, and media' }).should('exist');
    cy.findByRole('heading', { name: 'Checks and feedback' }).should('exist');
    cy.findByRole('link', { name: 'report an accessibility issue' }).should(
      'have.attr',
      'href',
      'https://github.com/durasj/chipsandcode/issues',
    );
    cy.findByRole('link', { name: /AbilityNet/ }).should(
      'have.attr',
      'href',
      'https://mcmw.abilitynet.org.uk/',
    );
    cy.injectAxe();
    checkAccessibility();
  });
});

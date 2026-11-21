import { checkAccessibility, expectMainNavigation } from '../support/checks';

describe('Device storage and legacy account route', () => {
  it('Redirects the old sign-in page to an honest account explanation on About', () => {
    cy.visit('/signin');
    cy.location('pathname').should('eq', '/about');
    cy.location('hash').should('eq', '#device-storage');
    expectMainNavigation();
    cy.findByRole('heading', { name: 'Your work, on this device' }).should('be.visible');
    cy.contains('Learning progress and circuit drafts are kept in your browser.');
    cy.contains('Accounts and cross-device progress sync are not available yet.');
    cy.findByText('Hi, Anonym').should('not.exist');
    cy.injectAxe();
    checkAccessibility();
  });
});

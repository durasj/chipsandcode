/// <reference types="cypress" />

import '@frsource/cypress-plugin-visual-regression-diff';
import '@testing-library/cypress/add-commands';
import 'cypress-axe';

Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  // @ts-ignore Incorrect 3rd party type
  return originalFn(url, {
    ...options,
    onBeforeLoad(win) {
      cy.stub(win, 'matchMedia').returns({
        matches: false,
        addEventListener: () => ({ matches: false }),
      });
    },
  });
});

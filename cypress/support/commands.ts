/// <reference types="cypress" />

import '@pixsame/cypress-plugin-visual-regression-diff';
import '@testing-library/cypress/add-commands';
import 'cypress-axe';

Cypress.Commands.overwrite(
  'visit',
  (originalFn, url, options: Partial<Cypress.VisitOptions> = {}) => {
    const visitOptions = typeof url === 'string' ? { ...options, url } : url;
    return originalFn({
      ...visitOptions,
      onBeforeLoad(win) {
        const matchMedia = win.matchMedia.bind(win);
        cy.stub(win, 'matchMedia').callsFake((query: string) => {
          const result = matchMedia(query);
          if (query === '(prefers-color-scheme: dark)') {
            Object.defineProperty(result, 'matches', { value: false });
          }
          return result;
        });
        visitOptions.onBeforeLoad?.(win);
      },
    });
  },
);

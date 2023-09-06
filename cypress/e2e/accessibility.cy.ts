describe('Accessibility Statement', () => {
  it('Can be navigated to via Footer and contains everything important', () => {
    cy.visit('/');

    cy.contains('a', 'Accessibility Statement').click();

    cy.contains('h1', 'Accessibility');
    cy.location('pathname').should('eq', '/accessibility-statement');

    // Unfortunately, images take a bit to load
    cy.wait(1000);
    cy.matchImage();
    // ... and screenshots cause the app to reload which may take some time
    cy.wait(500);

    cy.injectAxe();
    cy.checkA11y();

    cy.contains('h2', 'Summary');

    cy.contains('a', 'AbilityNet')
      .invoke('attr', 'href')
      .should('equal', 'https://mcmw.abilitynet.org.uk/');

    cy.contains(
      'Chips and Code strives to meet Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA',
    );

    cy.contains(
      'If you experience any issues or have any suggestions, please let us know at the "Report Bug/Request Feature" link.',
    );

    cy.contains('a', 'Report Bug / Request Feature')
      .invoke('attr', 'href')
      .should('equal', 'https://github.com/durasj/chipsandcode/issues');

    cy.contains('h2', 'Measures to support accessibility');

    cy.contains('h2', 'Conformance status');

    cy.contains('a', 'WCAG')
      .invoke('attr', 'href')
      .should('equal', 'https://www.w3.org/WAI/standards-guidelines/wcag/');

    cy.contains('h2', 'Technical specifications');
  });
});

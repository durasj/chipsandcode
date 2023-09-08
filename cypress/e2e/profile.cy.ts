describe('Profile', () => {
  it('Can be navigated to using icon', () => {
    cy.visit('/');
    cy.injectAxe();

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1500);

    cy.findByLabelText('User account').click();

    cy.contains('Hi, Anonym');

    cy.contains('anonymous');
    cy.contains('from the same device');
    cy.contains('is read-only');

    cy.matchImage();

    // ... and screenshots cause the app to reload which may take some time
    cy.wait(500);

    cy.checkA11y();
  });
});

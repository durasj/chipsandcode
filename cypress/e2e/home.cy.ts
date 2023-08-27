describe('Home', () => {
  it('Contains welcome message and link to content', () => {
    cy.visit('/');
    cy.injectAxe();

    cy.contains('Wondering how computers work?');
    cy.contains('Find out by embarking on the journey of building your own computer');

    // Unfortunately, images take a bit to load
    cy.wait(1000);
    cy.matchImage();
    // ... and screenshots cause the app to reload which may take some time
    cy.wait(500);

    cy.checkA11y();

    cy.contains('Start Learning').click();

    cy.location('pathname').should('eq', '/learn/hardware/boolean-logic');
  });
});

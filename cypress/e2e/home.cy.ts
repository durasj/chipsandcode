describe('Home', () => {
  it('Introduces the Signal Isles and opens the first playable workshop', () => {
    cy.visit('/');
    cy.contains('Progress saved on this device');
    cy.injectAxe();

    cy.findByRole('heading', { name: /A little logic\.\s*A living world\./ }).should('be.visible');
    cy.findByRole('region', {
      name: 'Signal Isles world map. Select a station to open its mission.',
    }).should('be.visible');
    cy.findByRole('region', { name: 'Stations, list view' })
      .findAllByRole('button')
      .should('have.length', 7);
    cy.contains('0 OF 7 SYSTEMS RESTORED');
    cy.findByRole('button', { name: 'Bring it to life' }).then(($button) => {
      const bounds = $button[0].getBoundingClientRect();
      expect(bounds.bottom, 'start action is visible without scrolling').to.be.at.most(720);
    });
    cy.screenshot('signal-isles-world', { capture: 'fullPage' });
    cy.checkA11y();

    cy.findByRole('button', { name: 'Bring it to life' }).click();
    cy.findByRole('heading', { name: 'Find the first signal' }).should('be.visible');
    cy.findByRole('region', { name: 'Discover NAND' }).should('be.visible');
    cy.location('pathname').should('eq', '/');
  });
});

describe('Home', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.clear();
      },
    });
    cy.contains('Progress saved on this device');
  });

  it('Introduces the computer layers and opens the signal workbench', () => {
    cy.injectAxe();
    cy.findByRole('heading', {
      name: /Understand\s*the machine\.\s*From the inside out\./,
    }).should('be.visible');
    cy.findByRole('region', { name: 'Computer layers' }).should('be.visible');
    cy.findByRole('region', { name: 'Logic challenges' })
      .findAllByRole('button')
      .should('have.length', 7);
    cy.contains('0 / 7 CHIPS VERIFIED');
    cy.findByRole('button', { name: 'Enter the signal layer' }).then(($button) => {
      const bounds = $button[0].getBoundingClientRect();
      expect(bounds.bottom, 'start action is visible without scrolling').to.be.at.most(720);
    });
    cy.screenshot('computer-layers', { capture: 'fullPage' });
    cy.checkA11y();

    cy.findByRole('button', { name: 'Enter the signal layer' }).click();
    cy.findByRole('heading', { name: 'Read the signal' }).should('be.visible');
    cy.findByRole('region', { name: 'Discover NAND' }).should('be.visible');
    cy.findByLabelText('HDL source').should('have.attr', 'readonly');
    cy.location('pathname').should('eq', '/');
  });

  it('Shows upper layers as planned without pretending their challenges are playable', () => {
    cy.get('[data-layer="software"]').click().should('have.attr', 'aria-pressed', 'true');
    cy.findByRole('heading', { name: 'Instructions become ideas.' }).should('be.visible');
    cy.contains('The seven logic challenges are ready now.');
    cy.findByRole('button', { name: 'Enter the signal layer' }).should('not.exist');
    cy.screenshot('computer-layers-software', { capture: 'fullPage' });
    cy.injectAxe();
    cy.checkA11y();

    cy.findByRole('button', { name: 'Back to the signal layer' }).click();
    cy.get('[data-layer="logic"]').should('have.attr', 'aria-pressed', 'true');
    cy.findByRole('button', { name: 'Enter the signal layer' }).should('be.visible');
    cy.contains('0 / 7 CHIPS VERIFIED');
  });
});

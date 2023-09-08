describe('Learn', () => {
  it('Can be navigated to from menu', () => {
    cy.visit('/');
    cy.injectAxe();

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1500);

    cy.contains('nav button', 'Learn').click();

    cy.contains('nav a', 'Chip Hardware').click();

    cy.contains('Boolean Logic');

    cy.matchImage();
    // ... and screenshots cause the app to reload which may take some time
    cy.wait(500);

    cy.checkA11y();
  });

  it('Can be navigated using side menu', () => {
    cy.visit('/learn/hardware/boolean-logic');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    cy.contains('h1', 'Boolean Logic');

    cy.contains('nav a', 'Background').click();

    cy.location('pathname').should('eq', '/learn/hardware/boolean-logic/background');

    cy.contains('h1', 'Background');
  });

  it('Contains Boolean Logic text with a "next" button', () => {
    cy.visit('/learn/hardware/boolean-logic');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    cy.contains('h1', 'Boolean Logic');

    cy.contains('blockquote', 'so complex it defeats us, Almost');

    cy.contains('p', 'Every digital device');

    cy.contains('p', 'section on hardware description and simulation tools');

    cy.contains('a', '1.1 Background').click();

    cy.location('pathname').should('eq', '/learn/hardware/boolean-logic/background');

    cy.contains('h1', 'Background');
  });

  it('Contains Hardware Background text with a "prev" button', () => {
    cy.visit('/learn/hardware/boolean-logic/background');
    cy.injectAxe();
    cy.configureAxe({
      rules: [
        // MathML is accessible but aXe doesn't properly detect that
        { id: 'empty-table-header', enabled: false },
        // Minor Monaco issue this project has no control over
        { id: 'landmark-unique', enabled: false },
        // These are all within Monaco that has opt-in high contrast theme that we're bundling
        // TODO: How to narrow this down?
        { id: 'color-contrast', enabled: false },
      ],
    });

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    cy.contains('h1', 'Background');

    cy.matchImage();
    // ... and screenshots cause the app to reload which may take some time
    cy.wait(500);

    cy.checkA11y();

    cy.contains('p', 'construction of a family of simple chips called Boolean gates');

    cy.contains('math', '2^n');

    cy.contains('math', 'f(x, y, z)');

    cy.findByAltText('Standard symbolic notation of some elementary logic gates.');

    cy.contains('code', 'Not(..., out=nota)');

    cy.contains('1 Boolean Logic').click();

    cy.location('pathname').should('eq', '/learn/hardware/boolean-logic');

    cy.contains('h1', 'Boolean Logic');
  });

  it('Works in dark mode', () => {
    cy.visit('/learn/hardware/boolean-logic/background');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    cy.contains('Color theme switch').click();

    cy.contains('h1', 'Background');

    // Wait for animation
    cy.wait(2000);

    cy.matchImage();
  });

  it('Has working embedded Hardware IDE with Xor', () => {
    cy.visit('/learn/hardware/boolean-logic/background');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    cy.findByLabelText('Experiment name').should('have.value', 'Xor Gate');

    cy.findByLabelText('Value for a').clear().type('1').blur();

    cy.contains('tr', 'out').contains('td', '1');
  });
});

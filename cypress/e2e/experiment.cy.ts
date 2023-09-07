describe('Experiment - Hardware IDE', () => {
  beforeEach(() => {
    const experiment = {
      id: 'abc123',
      name: 'FooBar CHIP',
      code: '// Empty code',
      tests: '// Empty TST',
      compare: 'Expected output',
      type: 'HARDWARE',
      visibility: 'PUBLIC',
    };

    cy.intercept('GET', '*/experiments/Xor', {
      fixture: 'experiment.json',
    }).as('getExperiment');

    cy.intercept('DELETE', '*/experiments/Xor', {
      fixture: 'experiment.json',
    }).as('deleteExperiment');

    cy.intercept('GET', '*/experiments', {
      body: { experiments: [] },
    }).as('listExperiments');

    cy.intercept('POST', '*/experiments', {
      body: {
        experiment,
      },
    }).as('postExperiment');
  });

  it('Can be navigated to from menu', () => {
    cy.visit('/');
    cy.injectAxe();
    cy.configureAxe({
      rules: [
        // Minor Monaco issue this project has no control over
        { id: 'landmark-unique', enabled: false },
      ],
    });

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1500);

    cy.contains('nav button', 'Experiment').click();

    cy.contains('nav a', 'Hardware IDE').click();

    cy.findByLabelText('Experiment name').should('have.value', 'Untitled Experiment');

    cy.matchImage();
    // ... and screenshots cause the app to reload which may take some time
    cy.wait(500);

    cy.checkA11y();
  });

  it('Loads example Xor', () => {
    cy.visit('/experiment/hardware-ide');
    cy.injectAxe();
    cy.configureAxe({
      rules: [
        // Minor Monaco issue this project has no control over
        { id: 'landmark-unique', enabled: false },
        // These are all within Monaco that has opt-in high contrast theme that we're bundling
        // TODO: How to narrow this down?
        { id: 'color-contrast', enabled: false },
      ],
    });

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1500);

    cy.findByLabelText('Experiment name').should('have.value', 'Untitled Experiment');

    cy.contains('a', 'Xor Gate').click();

    cy.location('pathname').should('eq', '/experiment/hardware-ide/Xor');

    cy.findByLabelText('Experiment name').should('have.value', 'Xor Gate');

    cy.contains('CHIP Xor');

    cy.matchImage();
    // ... and screenshots cause the app to reload which may take some time
    cy.wait(500);

    cy.checkA11y();
  });

  it('Reacts to changes to input pins', () => {
    cy.visit('/experiment/hardware-ide/Xor');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    cy.findByLabelText('Value for a').clear().type('1').blur();
    cy.contains('tr', 'out').contains('td', '1');

    cy.findByLabelText('Value for b').clear().type('1').blur();
    cy.contains('tr', 'out').contains('td', '0');
  });

  it('Reacts to changes in HDL', () => {
    cy.visit('/experiment/hardware-ide/Xor');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    // Add input pin
    cy.get('.monaco-editor textarea:first')
      .click({ force: true })
      .focused()
      .type('{moveToStart}')
      .type('{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}')
      .type('{end}{leftArrow}, c');
    cy.findByLabelText('Value for c');

    // Cause error
    cy.get('.monaco-editor textarea:first')
      .click({ force: true })
      .focused()
      .type(
        '{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}',
      )
      .type('{end}{leftArrow}{leftArrow}{backspace}{backspace}{backspace}nota');
    cy.contains('[role="alert"]', 'contains a loop');
    cy.contains('[role="tab"]', 'Tests').contains('2 / 4');
  });

  it('Reacts to changes in Tests', () => {
    cy.visit('/experiment/hardware-ide/Xor');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    // Change test case
    cy.contains('[role="tab"]', 'Tests').contains('4 / 4').click();
    cy.get('.monaco-editor textarea:first')
      .click({ force: true })
      .focused()
      .type('{moveToStart}')
      .type('{downArrow}{downArrow}')
      .type('{shift}{end}{backspace}');
    cy.contains('[role="tab"]', 'Tests').contains('3 / 4');

    // Remove all test cases
    cy.get('.monaco-editor textarea:first')
      .click({ force: true })
      .focused()
      .type('{selectAll}{backspace}');
    cy.contains('[role="tab"]', 'Tests');
  });

  it('Reacts to changes in Output', () => {
    cy.visit('/experiment/hardware-ide/Xor');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    // Change expected output
    cy.contains('[role="tab"]', 'Tests').contains('4 / 4');
    cy.contains('[role="tab"]', 'Output').click();
    cy.get('.monaco-editor textarea:last')
      .click({ force: true })
      .focused()
      .type('{moveToStart}')
      .type('{downArrow}{end}')
      .type('{leftArrow}{leftArrow}{leftArrow}{leftArrow}{backspace}1');
    cy.contains('[role="tab"]', 'Tests').contains('3 / 4');
  });

  it('Works in dark mode', () => {
    cy.visit('/experiment/hardware-ide/Xor');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    cy.contains('Color theme switch').click();

    cy.findByLabelText('Experiment name').should('have.value', 'Xor Gate');

    // Wait for animation
    cy.wait(2000);

    cy.matchImage();
  });

  it('Allows opening, saving, and sharing a new experiment', () => {
    cy.visit('/experiment/hardware-ide/Xor');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    cy.findByLabelText('Experiment name').should('have.value', 'Xor Gate');

    cy.findByLabelText('Open/New').click();

    cy.contains('button', 'Open new').click();

    cy.findByLabelText('Experiment name').should('have.value', 'Untitled Experiment');

    cy.location('pathname').should('eq', '/experiment/hardware-ide');

    cy.get('.monaco-editor textarea:first').click({ force: true }).focused().type('// Empty code');

    cy.contains('[role="tab"]', 'Tests').click();
    cy.get('.monaco-editor textarea:first').click({ force: true }).focused().type('// Empty TST');

    cy.contains('[role="tab"]', 'Output').click();
    cy.get('.monaco-editor textarea:last').click({ force: true }).focused().type('Expected output');

    cy.findByLabelText('Experiment name').clear().type('FooBar CHIP');

    cy.contains('Save').click();

    cy.wait('@postExperiment').its('request.body').should('deep.equal', {
      name: 'FooBar CHIP',
      code: '// Empty code',
      tests: '// Empty TST',
      compare: 'Expected output',
      type: 'HARDWARE',
      visibility: 'PUBLIC',
    });

    cy.location('pathname').should('eq', '/experiment/hardware-ide/abc123');

    cy.findByLabelText('Experiment name').should('have.value', 'FooBar CHIP');

    cy.findByLabelText('Share').click();

    cy.findByLabelText('Experiment URL')
      .invoke('val')
      .should('contains', '/experiment/hardware-ide/abc123');
  });

  it('Allows deleting existing experiment', () => {
    cy.visit('/experiment/hardware-ide/Xor');

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1000);

    cy.findByLabelText('Experiment name').should('have.value', 'Xor Gate');

    cy.findByLabelText('More actions').click();

    cy.contains('button', 'Delete').click();

    cy.wait('@deleteExperiment');

    cy.location('pathname').should('eq', '/experiment/hardware-ide');

    cy.findByLabelText('Experiment name').should('have.value', 'Untitled Experiment');
  });
});

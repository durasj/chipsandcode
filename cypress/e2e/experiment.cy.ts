import { checkAccessibility, expectMainNavigation, expectNoPageOverflow } from '../support/checks';

const simulatorPath = '/tools/hardware-simulator';

function waitForEditor() {
  cy.get('.hardware-workspace', { timeout: 20000 }).should('have.attr', 'data-ready', 'true');
  cy.get('.monaco-editor').filter(':visible').first().should('be.visible');
}

function typeInEditor(text: string, expectedOutput = false) {
  // Monaco's keyboard input is its native textarea, positioned at the caret.
  // Focusing that input exercises normal keyboard editing without a forced click
  // on an invisible caret or a click on the outer accessibility container.
  cy.get(
    expectedOutput
      ? '.modified-in-monaco-diff-editor textarea.inputarea'
      : '.editor-mount .monaco-editor textarea.inputarea',
  )
    .should('have.length', 1)
    .focus()
    .should('be.focused')
    .type(text, { delay: 0 });
  if (!text.includes('{')) {
    cy.get('.editor-mount .view-lines').should(($lines) => {
      expect($lines.text().replace(/\s+/g, ' '), 'typed source appears in the editor').to.contain(
        text,
      );
    });
  }
}

function visitSimulator(id = '') {
  cy.visit(`${simulatorPath}${id ? `/${id}` : ''}`);
  waitForEditor();
}

describe('Hardware simulator tool', () => {
  beforeEach(() => {
    cy.fixture('experiment.json').then(({ experiment }) => {
      cy.intercept('GET', '**/api/experiments/saved-example', {
        body: { experiment: { ...experiment, id: 'saved-example' } },
      }).as('getExperiment');
    });
    cy.intercept('DELETE', '**/api/experiments/saved-example', {
      body: { experiment: { id: 'saved-example' } },
    }).as('deleteExperiment');
    cy.intercept('GET', '**/api/experiments', { body: { experiments: [] } }).as('listExperiments');
    cy.intercept('POST', '**/api/experiments', (request) => {
      request.reply({
        experiment: { ...request.body, id: 'abc123', created: '2026-11-03T00:00:00Z' },
      });
    }).as('postExperiment');
  });

  it('Lives under Tools with the same primary navigation and accessible workspace', () => {
    cy.visit('/');
    cy.findByRole('navigation', { name: 'Main navigation' })
      .findByRole('link', { name: 'Tools' })
      .click();
    cy.location('pathname').should('eq', '/tools');
    cy.findByRole('link', { name: /Saved HDL experiments/ }).click();
    cy.location('pathname').should('eq', simulatorPath);
    waitForEditor();
    expectMainNavigation();
    cy.findByLabelText('Experiment name').should('have.value', 'Untitled Experiment');
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('hardware-simulator-empty', { capture: 'viewport' });
  });

  it('Loads XOR through the simulator and preserves its real computed outputs', () => {
    visitSimulator();
    cy.contains('a', 'Xor Gate').click();
    cy.location('pathname').should('eq', `${simulatorPath}/Xor`);
    cy.findByLabelText('Experiment name').should('have.value', 'Xor Gate');
    cy.contains('CHIP Xor');
    cy.findByLabelText('Value for a').clear().type('1').blur();
    cy.contains('tr', 'out').contains('td', '1');
    cy.findByLabelText('Value for b').clear().type('1').blur();
    cy.contains('tr', 'out').contains('td', '0');
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('hardware-simulator-xor', { capture: 'viewport' });
  });

  it('Redirects legacy experiment links into Tools, including saved IDs', () => {
    cy.visit('/experiment/hardware-ide/Xor');
    cy.location('pathname').should('eq', `${simulatorPath}/Xor`);
    waitForEditor();
    cy.findByLabelText('Experiment name').should('have.value', 'Xor Gate');
    expectMainNavigation();
    cy.visit('/experiment/hardware-ide/saved-example');
    cy.location('pathname').should('eq', `${simulatorPath}/saved-example`);
    cy.wait('@getExperiment');
    cy.findByLabelText('Experiment name').should('have.value', 'Xor Gate');
  });

  it('Updates inputs from HDL and clears stale verification when the design becomes invalid', () => {
    visitSimulator('Xor');
    cy.contains('[role="tab"]', 'Tests').contains('4 / 4');
    typeInEditor(
      '{ctrl+home}{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}{downArrow}{end}{leftArrow}, c',
    );
    cy.findByLabelText('Value for c').should('be.visible');
    typeInEditor(
      '{ctrl+end}{upArrow}{upArrow}{end}{leftArrow}{leftArrow}{backspace}{backspace}{backspace}nota',
    );
    cy.get('.editor-mount')
      .invoke('text')
      .should('match', /Or\(a=w1,\s*b=w2,\s*out=nota\);/);
    cy.contains('[role="alert"]', 'contains a loop');
    cy.contains('[role="tab"]', 'Tests').should('not.contain', '/');
    cy.get('.signal-panel').should(($panel) => {
      expect(
        [...$panel[0].querySelectorAll('.pin-value')].filter((node) =>
          /^[01]$/.test(node.textContent?.trim() || ''),
        ),
        'invalid circuits expose no stale bit values',
      ).to.have.length(0);
    });
  });

  it('Keeps an intentionally emptied local draft across reloads', () => {
    visitSimulator('Xor');
    typeInEditor('{ctrl+a}{backspace}');
    cy.contains('[role="tab"]', 'Tests').should('not.contain', '/');
    cy.reload();
    waitForEditor();
    cy.get('.editor-mount')
      .invoke('text')
      .should('not.match', /CHIP\s+Xor/);
    cy.contains('[role="tab"]', 'Tests').should('not.contain', '/');
    typeInEditor('// A local draft');
    cy.reload();
    waitForEditor();
    cy.get('.editor-mount')
      .invoke('text')
      .should('match', /A\s+local\s+draft/);
  });

  it('Explains an invalid input without presenting a stale output', () => {
    visitSimulator('Xor');
    cy.findByLabelText('Value for a').clear().type('2').blur();
    cy.contains('[role="alert"]', 'Input a must be 0 or 1.').should('be.visible');
    cy.contains('tr', 'out').contains('td', '—');
    cy.findByLabelText('Value for a').clear().type('1').blur();
    cy.contains('[role="alert"]', 'Input a must be 0 or 1.').should('not.exist');
    cy.contains('tr', 'out').contains('td', '1');
  });

  it('Re-evaluates changed test scripts and removes the result when tests are cleared', () => {
    visitSimulator('Xor');
    cy.contains('[role="tab"]', 'Tests').contains('4 / 4').click();
    typeInEditor('{ctrl+home}{downArrow}{downArrow}{shift}{end}{backspace}');
    // Deliberately change the first input combination. Omitting `set a 0`
    // alone does not change its initial zero value and must still pass.
    typeInEditor('set a 1,');
    cy.contains('[role="tab"]', 'Tests').contains('3 / 4');
    typeInEditor('{ctrl+a}{backspace}');
    cy.contains('[role="tab"]', 'Tests').should('not.contain', '/');
  });

  it('Re-evaluates edited expected output', () => {
    visitSimulator('Xor');
    cy.contains('[role="tab"]', 'Tests').contains('4 / 4');
    cy.contains('[role="tab"]', 'Output').click();
    typeInEditor(
      '{ctrl+home}{downArrow}{end}{leftArrow}{leftArrow}{leftArrow}{leftArrow}{backspace}1',
      true,
    );
    cy.contains('[role="tab"]', 'Tests').contains('3 / 4');
  });

  it('Keeps the tool usable on a narrow screen with the same dark theme', () => {
    cy.viewport(320, 760);
    visitSimulator('Xor');
    expectMainNavigation();
    expectNoPageOverflow();
    cy.findByLabelText('Value for a').clear().type('1').blur();
    cy.contains('tr', 'out').contains('td', '1');
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('hardware-simulator-mobile', { capture: 'fullPage' });
  });

  it('Opens, saves and shares a new experiment using canonical URLs', () => {
    visitSimulator('Xor');
    cy.findByRole('button', { name: 'File' }).click();
    cy.findByRole('menuitem', { name: 'Open new' }).click();
    cy.findByLabelText('Experiment name').should('have.value', 'Untitled Experiment');
    cy.location('pathname').should('eq', simulatorPath);
    waitForEditor();
    typeInEditor('// Empty code');
    cy.contains('[role="tab"]', 'Tests').click();
    typeInEditor('// Empty TST');
    cy.contains('[role="tab"]', 'Output').click();
    typeInEditor('Expected output', true);
    cy.findByLabelText('Experiment name').clear().type('FooBar CHIP');
    cy.contains('button', 'Save').click();
    cy.wait('@postExperiment').its('request.body').should('deep.equal', {
      name: 'FooBar CHIP',
      code: '// Empty code',
      tests: '// Empty TST',
      compare: 'Expected output',
      type: 'HARDWARE',
      visibility: 'PUBLIC',
    });
    cy.location('pathname').should('eq', `${simulatorPath}/abc123`);
    cy.findByLabelText('Experiment name').should('have.value', 'FooBar CHIP');
    cy.findByLabelText('Share').click();
    cy.findByLabelText('Experiment URL').invoke('val').should('contain', `${simulatorPath}/abc123`);
    cy.get('body').type('{esc}');
    cy.findByRole('button', { name: 'File' }).click();
    cy.findByRole('menuitem', { name: 'Open new' }).click();
    cy.location('pathname').should('eq', simulatorPath);
    waitForEditor();
    cy.findByLabelText('Experiment name').should('have.value', 'Untitled Experiment');
    cy.get('.editor-mount')
      .invoke('text')
      .should('not.match', /Empty\s+code/);
    cy.contains('[role="tab"]', 'Tests').click();
    cy.get('.editor-mount')
      .invoke('text')
      .should('not.match', /Empty\s+TST/);
  });

  it('Keeps edits made during an in-flight save as a newer local draft', () => {
    let releaseSave: (() => void) | undefined;
    cy.intercept('POST', '**/api/experiments', (request) => {
      const snapshot = { ...request.body };
      return new Cypress.Promise<void>((resolve) => {
        releaseSave = () => {
          request.reply({
            body: { experiment: { ...snapshot, id: 'abc123', created: '2026-11-03T00:00:00Z' } },
          });
          resolve();
        };
      });
    }).as('delayedSave');
    visitSimulator();
    typeInEditor('// First revision');
    cy.findByLabelText('Experiment name').clear().type('First revision').blur();
    cy.contains('button', 'Save').click();
    cy.wrap(null).should(() => expect(releaseSave).to.be.a('function'));
    cy.findByRole('button', { name: 'Saving…' }).should('be.disabled');
    typeInEditor('{ctrl+end} plus an unsaved edit');
    cy.findByLabelText('Experiment name').clear().type('Second revision').blur();
    cy.then(() => releaseSave?.());
    cy.wait('@delayedSave').its('request.body').should('include', {
      name: 'First revision',
      code: '// First revision',
    });
    cy.location('pathname').should('eq', `${simulatorPath}/abc123`);
    cy.findByLabelText('Experiment name').should('have.value', 'Second revision');
    cy.get('.editor-mount')
      .invoke('text')
      .should('match', /plus\s+an\s+unsaved\s+edit/);
    cy.get('.editor-status').should('contain', 'Local draft');
    cy.findByLabelText('Share').should('be.disabled');
    cy.findByRole('button', { name: 'Save' }).should('not.be.disabled');
  });

  it('Saves a bundled template as a copy without updating or deleting the template', () => {
    visitSimulator('Xor');
    cy.findByLabelText('More actions').click();
    cy.findByRole('menuitem', { name: 'Delete' }).should('not.exist');
    cy.get('body').type('{esc}');
    cy.findByLabelText('Experiment name').clear().type('My XOR');
    cy.contains('button', 'Save').click();
    cy.wait('@postExperiment').its('request.body').should('include', { name: 'My XOR' });
    cy.location('pathname').should('eq', `${simulatorPath}/abc123`);
  });

  it('Deletes a saved experiment and returns to a fresh simulator', () => {
    visitSimulator('saved-example');
    cy.wait('@getExperiment');
    cy.findByLabelText('Experiment name').should('have.value', 'Xor Gate');
    cy.findByLabelText('More actions').click();
    cy.contains('button', 'Delete').click();
    cy.wait('@deleteExperiment');
    cy.location('pathname').should('eq', simulatorPath);
    cy.findByLabelText('Experiment name').should('have.value', 'Untitled Experiment');
  });
});

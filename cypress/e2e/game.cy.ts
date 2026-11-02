const inverterHDL = `CHIP Not {
    IN in;
    OUT out;
    PARTS:
    Nand(a=in, b=in, out=out);
}`;

function visitGame(progress: string[] = ['nand']) {
  cy.visit('/', {
    onBeforeLoad(window) {
      window.localStorage.clear();
      if (progress.length) {
        window.localStorage.setItem('chipsandcode.progress.v1', JSON.stringify(progress));
      }
    },
  });
  cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
}

function openNotWorkbench() {
  cy.findAllByRole('button', { name: 'Continue learning' }).first().click();
  cy.findByRole('heading', { name: 'Invert a signal' }).should('be.visible');
}

function chooseView(view: 'Visual' | 'Split' | 'Code') {
  cy.findByRole('combobox', { name: 'Editor view' })
    .select(view.toLowerCase())
    .should('have.value', view.toLowerCase());
}

function openConnections() {
  cy.contains('summary', 'Connections').then(($summary) => {
    if (!$summary.parent('details').prop('open')) cy.wrap($summary).click();
  });
}

function writeHDL(source: string) {
  cy.findByLabelText('HDL source').clear().type(source, {
    parseSpecialCharSequences: false,
    delay: 0,
  });
}

function buildInverter() {
  cy.findByRole('button', { name: /^Nand\b/ }).click();
  openConnections();
  cy.findByLabelText('Part 1 Nand input a').select('in');
  cy.findByLabelText('Part 1 Nand input b').select('in');
  cy.findByLabelText('Chip output out').select('g1');
}

function openReference() {
  cy.contains('summary', 'Menu').click();
  cy.findByRole('navigation', { name: 'Workspace menu' })
    .findByRole('button', { name: 'Reference' })
    .click();
  cy.findByRole('heading', { level: 1, name: 'Reference' }).should('have.focus');
}

function expectNoPageOverflow() {
  cy.document().should((document) => {
    const viewport = document.documentElement.clientWidth;
    const pageWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    expect(pageWidth, 'page content fits the viewport').to.be.at.most(viewport + 1);
  });
}

function checkWorkbenchAccessibility() {
  cy.checkA11y(undefined, undefined, (violations) => {
    if (violations.length) {
      throw new Error(
        violations
          .map(
            (violation) =>
              `${violation.id}:\n${violation.nodes
                .map((node) => `${JSON.stringify(node.target)}\n${node.failureSummary}`)
                .join('\n')}`,
          )
          .join('\n\n'),
      );
    }
  });
}

describe('Chips and Code workbench', () => {
  beforeEach(() => visitGame());

  it('Starts with one signal, adds NAND, and continues to the first circuit in order', () => {
    visitGame([]);
    cy.findAllByRole('button', { name: 'Start learning' }).first().click();
    cy.findByRole('heading', { name: 'A computer starts with a signal.' }).should('be.visible');
    cy.findByRole('button', { name: 'Continue' }).should('not.exist');
    cy.findByRole('switch', { name: 'Signal' })
      .should('have.attr', 'aria-checked', 'false')
      .click()
      .should('have.attr', 'aria-checked', 'true');
    cy.findByRole('img', { name: 'Output 1' }).should('be.visible');
    openReference();
    openReference();
    cy.findByRole('button', { name: 'Back' }).click();
    cy.findByRole('switch', { name: 'Signal' }).should('have.attr', 'aria-checked', 'true');
    cy.findByRole('button', { name: 'Continue' }).should('not.exist');
    cy.findByRole('switch', { name: 'Signal' })
      .click()
      .should('have.attr', 'aria-checked', 'false');
    cy.findByRole('img', { name: 'Output 0' }).should('be.visible');
    cy.findByRole('button', { name: 'Continue' }).click();
    cy.findByRole('heading', { name: 'Two signals. One rule.' }).should('be.visible');
    cy.findByLabelText('HDL source').should('not.exist');
    cy.findByLabelText('Editor view').should('not.exist');
    cy.screenshot('nand-guided-experiment', { capture: 'viewport' });

    // Wrong answers neither advance the experiment nor unlock the next circuit.
    cy.findByRole('button', { name: 'Output 0' }).click();
    cy.contains('The output is 1. Follow the line on the right and try again.');
    cy.findByRole('button', { name: 'Continue' }).should('not.exist');
    cy.findByRole('button', { name: 'Output 1' }).click();
    cy.findByRole('button', { name: 'Next combination' }).click();
    cy.findByRole('button', { name: 'Output 1' }).should('be.disabled');
    cy.findByRole('button', { name: 'Input b 0' }).click();
    cy.findByRole('button', { name: 'Output 1' }).click();
    cy.findByRole('button', { name: 'Next combination' }).click();
    cy.findByRole('button', { name: 'Input a 0' }).click();
    cy.findByRole('button', { name: 'Output 0' }).click();
    cy.findByRole('button', { name: 'Next combination' }).click();
    cy.findByRole('button', { name: 'Input b 1' }).click();
    cy.findByRole('button', { name: 'Output 1' }).click();
    cy.contains('NAND outputs 0 only when both inputs are 1.');
    cy.injectAxe();
    checkWorkbenchAccessibility();
    cy.findByRole('button', { name: 'Continue' }).click();
    cy.findByRole('heading', { name: 'NAND, explored.' }).should('be.visible');
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'chipsandcode.progress.v1')
      .should('eq', '["nand"]');
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'chipsandcode.signal-intro.v1')
      .should('eq', 'complete');
    cy.findByRole('button', { name: 'Continue' }).click();
    cy.findByRole('heading', { name: 'Invert a signal' }).should('be.visible');
    cy.findByRole('combobox', { name: 'Editor view' }).should('have.value', 'visual');
    cy.findByLabelText('HDL source').should('not.exist');
    cy.contains('summary', 'Connections').parent('details').should('not.have.attr', 'open');
    cy.contains('summary', 'Signal history').parent('details').should('not.have.attr', 'open');
    cy.findByRole('button', { name: 'Test circuit' }).should('not.exist');
    cy.screenshot('first-circuit-minimal', { capture: 'viewport' });
    buildInverter();
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.findByRole('button', { name: 'Continue' }).should('have.focus');
    openReference();
    cy.findByRole('button', { name: 'Back' }).click();
    cy.findByRole('button', { name: 'Continue' }).should('be.visible');
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Test circuit' }).should('not.exist');
    cy.contains('summary', 'Test results').parent('details').should('not.have.attr', 'open');
    cy.contains('summary', 'Test results').click();
    cy.contains('2 of 2 combinations work.').should('be.visible');
    cy.findByRole('button', { name: 'Continue' }).click();
    cy.findByRole('heading', { name: 'NOT works.' }).should('be.visible');
    cy.reload();
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    cy.contains('summary', 'Menu').click();
    cy.findByRole('navigation', { name: 'Workspace menu' })
      .findByRole('button', { name: 'Your chips' })
      .click();
    cy.findByRole('button', { name: /^Reopen Not/ }).should('be.visible');
    cy.findByRole('button', { name: /^Reopen And/ }).should('not.exist');
    cy.injectAxe();
    checkWorkbenchAccessibility();
    cy.findByRole('button', { name: 'Continue learning' }).click();
    cy.findByRole('heading', { name: 'Combine conditions' }).should('be.visible');
  });

  it('Invalidates a passed test after a connection changes and restores the edited draft', () => {
    openNotWorkbench();
    buildInverter();
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Continue' }).should('be.visible');

    // A direct wire is a valid circuit, but it is not an inverter.
    cy.findByLabelText('Chip output out').select('in');
    cy.contains('2 of 2 combinations work.').should('not.exist');
    cy.findByRole('button', { name: 'Continue' }).should('not.exist');
    cy.reload();
    openNotWorkbench();
    openConnections();
    cy.findByLabelText('Part 1 Nand input a').should('have.value', 'in');
    cy.findByLabelText('Part 1 Nand input b').should('have.value', 'in');
    cy.findByRole('button', { name: 'Continue' }).should('not.exist');
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.contains('0 of 2 combinations work.');
    cy.findAllByRole('button', { name: /Inspect case \d, needs work/ }).should('have.length', 2);
    cy.findByLabelText('Chip output out').should('have.value', 'in').select('g1');
    cy.contains('0 of 2 combinations work.').should('not.exist');
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Continue' }).should('be.visible');
  });

  it('Wires directly on the board and can undo clearing the saved circuit', () => {
    openNotWorkbench();
    cy.findByRole('button', { name: /^Nand\b/ }).click();
    cy.findByRole('button', { name: 'Select source input in' }).click();
    cy.findByRole('button', { name: 'Connect to part 1 Nand input a' }).click();
    cy.findByRole('button', { name: 'Connect to part 1 Nand input b' }).click();
    cy.findByRole('button', { name: 'Select source part 1 Nand output' }).click();
    cy.findByRole('button', { name: 'Connect chip output out' }).click();
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.contains('2 of 2 combinations work.');
    openConnections();
    cy.findByRole('button', { name: 'Clear circuit' }).click();
    cy.findByLabelText('Part 1 Nand input a').should('not.exist');
    cy.findByRole('button', { name: 'Undo clear' }).click();
    cy.findByLabelText('Part 1 Nand input a').should('have.value', 'in');
    cy.findByLabelText('Chip output out').should('have.value', 'g1');
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.contains('2 of 2 combinations work.');
    cy.reload();
    openNotWorkbench();
    openConnections();
    cy.findByLabelText('Chip output out').should('have.value', 'g1');
  });

  it('Solves in code and keeps visual and HDL representations synchronized', () => {
    openNotWorkbench();
    cy.findByRole('combobox', { name: 'Editor view' }).should('have.value', 'visual');
    cy.findByRole('button', { name: 'Test circuit' }).should('not.exist');
    chooseView('Code');
    cy.get('.visual-workspace').should('not.exist');
    writeHDL(inverterHDL);
    cy.findByRole('alert').should('not.exist');
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.contains('2 of 2 combinations work.');
    chooseView('Split');
    cy.findByLabelText('HDL source').should('have.value', inverterHDL);
    openConnections();
    cy.findByLabelText('Part 1 Nand input a').should('have.value', 'in');
    cy.findByLabelText('Part 1 Nand input b').should('have.value', 'in');
    cy.findByLabelText('Chip output out').should('have.value', 'g1');
    cy.findByRole('region', { name: 'HDL code editor' }).then(($code) => {
      cy.get('.visual-workspace').then(($visual) => {
        expect(
          $code[0].getBoundingClientRect().left,
          'HDL is beside the visual circuit on desktop',
        ).to.be.at.least($visual[0].getBoundingClientRect().right - 1);
      });
    });
    cy.findByLabelText('Chip output out').select('in');
    cy.contains('2 of 2 combinations work.').should('not.exist');
    cy.findByLabelText('HDL source').invoke('val').should('include', 'gamebufferout');
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.contains('0 of 2 combinations work.');
    cy.findByLabelText('Chip output out').select('g1');
    cy.findByLabelText('HDL source').invoke('val').should('not.include', 'gamebufferout');
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.contains('2 of 2 combinations work.');
    cy.injectAxe();
    checkWorkbenchAccessibility();
    cy.screenshot('computer-workbench-split', { capture: 'fullPage' });
  });

  it('Preserves invalid HDL across views and reloads while blocking stale verification', () => {
    openNotWorkbench();
    chooseView('Code');
    writeHDL(inverterHDL);
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.contains('2 of 2 combinations work.');
    const invalidHDL = inverterHDL.replace('b=in', 'b=missing');
    writeHDL(invalidHDL);
    cy.contains('HDL could not be applied.');
    cy.contains('Signal missing has no driver.');
    cy.findByRole('button', { name: 'Test circuit' }).should('be.disabled');
    cy.findByRole('button', { name: 'Continue' }).should('not.exist');
    cy.contains('2 of 2 combinations work.').should('not.exist');
    chooseView('Visual');
    cy.findByRole('button', { name: 'Test circuit' }).should('be.disabled');
    chooseView('Split');
    cy.findByLabelText('HDL source').should('have.value', invalidHDL);
    cy.reload();
    openNotWorkbench();
    cy.findByLabelText('HDL source').should('have.value', invalidHDL);
    cy.findByRole('button', { name: 'Test circuit' }).should('be.disabled');
    cy.findByRole('button', { name: 'Continue' }).should('not.exist');
    writeHDL(inverterHDL);
    cy.findByRole('alert').should('not.exist');
    cy.findByRole('button', { name: 'Test circuit' }).should('not.be.disabled').click();
    cy.contains('2 of 2 combinations work.');
  });

  [320, 1280].forEach((width) => {
    it(`Keeps the homepage and editor views within a ${width}px viewport`, () => {
      cy.viewport(width, 900);
      expectNoPageOverflow();
      if (width === 320) cy.screenshot('minimal-home-mobile', { capture: 'fullPage' });
      openNotWorkbench();
      expectNoPageOverflow();
      buildInverter();
      expectNoPageOverflow();
      chooseView('Code');
      expectNoPageOverflow();
      cy.findByLabelText('HDL source').invoke('val').should('include', 'Nand(a=in, b=in');
      chooseView('Split');
      expectNoPageOverflow();
      cy.findByRole('button', { name: 'Test circuit' }).click();
      cy.contains('2 of 2 combinations work.');
      expectNoPageOverflow();
      if (width === 320) cy.screenshot('computer-workbench-mobile', { capture: 'fullPage' });
    });
  });
});

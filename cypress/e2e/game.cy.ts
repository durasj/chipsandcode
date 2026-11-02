const inverterHDL = `CHIP Not {
    IN in;
    OUT out;
    PARTS:
    Nand(a=in, b=in, out=out);
}`;

function openNotWorkbench() {
  cy.findByRole('region', { name: 'Logic challenges' }).find('[data-mission="not"]').click();
  cy.findByRole('button', { name: /^(Build this chip|Reopen workbench)$/ }).click();
  cy.findByRole('heading', { name: 'Invert a signal' }).should('be.visible');
}

function chooseView(view: 'Visual' | 'Split' | 'Code') {
  cy.findByRole('group', { name: 'Editor view' })
    .findByRole('button', { name: view })
    .click()
    .should('have.attr', 'aria-pressed', 'true');
}

function writeHDL(source: string) {
  cy.findByLabelText('HDL source').clear().type(source, {
    parseSpecialCharSequences: false,
    delay: 0,
  });
}

function buildInverter() {
  cy.findByRole('button', { name: /^Nand\b/ }).click();
  cy.findByLabelText('Part 1 Nand input a').select('in');
  cy.findByLabelText('Part 1 Nand input b').select('in');
  cy.findByLabelText('Chip output out').select('g1');
}

function expectNoPageOverflow() {
  cy.document().should((document) => {
    const viewport = document.documentElement.clientWidth;
    const pageWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    expect(pageWidth, 'page content fits the viewport').to.be.at.most(viewport + 1);
  });
}

describe('Chips and Code workbench', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.clear();
      },
    });
    cy.contains('Progress saved on this device');
  });

  it('Characterizes NAND, remembers verified chips, and builds a working NOT chip', () => {
    cy.findByRole('button', { name: 'Begin building' }).click();

    // A wrong prediction cannot complete a case or verify the primitive.
    cy.findByRole('button', { name: 'Predict 0' }).click();
    cy.contains('The NAND output is 1 here.');
    cy.findByRole('button', { name: 'Save verified chip' }).should('not.exist');

    const cases = [
      { a: 0, b: 0, output: 1 },
      { a: 0, b: 1, output: 1 },
      { a: 1, b: 0, output: 1 },
      { a: 1, b: 1, output: 0 },
    ];
    cases.forEach(({ a, b, output }, index) => {
      cy.findByRole('button', { name: `Predict ${output}` }).click();
      cy.contains(`Exactly. a=${a}, b=${b} produces ${output}.`);
      cy.findByRole('button', { name: `Try input a ${a}, b ${b}, discovered` });
      if (index < cases.length - 1) {
        cy.findByRole('button', { name: 'Next undiscovered signal' }).click();
        cy.findByRole('button', { name: 'Save verified chip' }).should('not.exist');
      }
    });

    cy.findByRole('button', { name: 'Save verified chip' }).click();
    cy.contains('Nand verified. Added to your chips.');
    cy.contains('1 / 7 CHIPS VERIFIED');
    cy.reload();
    cy.contains('1 / 7 CHIPS VERIFIED');
    cy.findByRole('region', { name: 'Logic challenges' })
      .find('[data-mission="nand"]')
      .should('contain.text', '✓');

    openNotWorkbench();
    buildInverter();
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('Signal confirmed.');
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Save verified chip' }).click();
    cy.contains('Not verified. Added to your chips.');
    cy.contains('2 / 7 CHIPS VERIFIED');

    cy.findByRole('button', { name: /Your chips/ }).click();
    cy.contains('article', 'Invert a signal').within(() => {
      cy.contains('✓ VERIFIED');
      cy.contains('Not');
    });
    cy.reload();
    cy.contains('2 / 7 CHIPS VERIFIED');
  });

  it('Invalidates a passed test after a connection changes and restores the edited draft', () => {
    openNotWorkbench();
    buildInverter();
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Save verified chip' }).should('be.visible');

    // A direct wire is a valid circuit, but it is not an inverter.
    cy.findByLabelText('Chip output out').select('in');
    cy.contains('2 of 2 combinations work.').should('not.exist');
    cy.findByRole('button', { name: 'Save verified chip' }).should('not.exist');
    cy.contains('Draft saved on this device');

    cy.reload();
    openNotWorkbench();
    cy.findByLabelText('Part 1 Nand input a').should('have.value', 'in');
    cy.findByLabelText('Part 1 Nand input b').should('have.value', 'in');
    cy.findByRole('button', { name: 'Save verified chip' }).should('not.exist');
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('0 of 2 combinations work.');
    cy.findAllByRole('button', { name: /Inspect case \d, needs work/ }).should('have.length', 2);

    // Reload preserves the visual wire rather than expanding its HDL buffer.
    cy.findByLabelText('Chip output out').should('have.value', 'in');
    cy.findByLabelText('Chip output out').select('g1');
    cy.contains('0 of 2 combinations work.').should('not.exist');
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Save verified chip' }).should('be.visible');
  });

  it('Wires directly on the board and can undo clearing the saved circuit', () => {
    openNotWorkbench();
    chooseView('Visual');
    cy.findByRole('button', { name: /^Nand\b/ }).click();
    cy.findByRole('button', { name: 'Select source input in' }).click();
    cy.findByRole('button', { name: 'Connect to part 1 Nand input a' }).click();
    cy.findByRole('button', { name: 'Connect to part 1 Nand input b' }).click();
    cy.findByRole('button', { name: 'Select source part 1 Nand output' }).click();
    cy.findByRole('button', { name: 'Connect chip output out' }).click();
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Clear circuit' }).click();
    cy.findByLabelText('Part 1 Nand input a').should('not.exist');
    cy.findByRole('button', { name: 'Undo clear' }).click();
    cy.findByLabelText('Part 1 Nand input a').should('have.value', 'in');
    cy.findByLabelText('Chip output out').should('have.value', 'g1');
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');
    cy.reload();
    openNotWorkbench();
    cy.findByLabelText('Chip output out').should('have.value', 'g1');
  });

  it('Solves a chip in code and keeps the editable visual and HDL views synchronized', () => {
    openNotWorkbench();
    cy.findByRole('button', { name: 'Split' }).should('have.attr', 'aria-pressed', 'true');
    cy.findByRole('button', { name: /Test circuit/ }).then(($button) => {
      expect(
        $button[0].getBoundingClientRect().bottom,
        'testing is reachable beside the editor',
      ).to.be.at.most(720);
    });
    chooseView('Code');
    cy.findByRole('region', { name: 'Circuit parts and connections' }).should('not.exist');
    writeHDL(inverterHDL);
    cy.findByRole('alert').should('not.exist');
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');

    chooseView('Split');
    cy.findByLabelText('HDL source').should('have.value', inverterHDL);
    cy.findByLabelText('Part 1 Nand input a').should('have.value', 'in');
    cy.findByLabelText('Part 1 Nand input b').should('have.value', 'in');
    cy.findByLabelText('Chip output out').should('have.value', 'g1');
    cy.findByRole('region', { name: 'HDL code editor' }).then(($code) => {
      cy.get('.visual-workspace').then(($visual) => {
        const code = $code[0].getBoundingClientRect();
        const visual = $visual[0].getBoundingClientRect();
        expect(code.left, 'HDL is beside the visual circuit on desktop').to.be.at.least(
          visual.right - 1,
        );
      });
    });

    cy.findByLabelText('Chip output out').select('in');
    cy.contains('2 of 2 combinations work.').should('not.exist');
    cy.findByLabelText('HDL source').invoke('val').should('include', 'gamebufferout');
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('0 of 2 combinations work.');
    cy.findByLabelText('Chip output out').select('g1');
    cy.findByLabelText('HDL source').invoke('val').should('not.include', 'gamebufferout');
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');
    cy.injectAxe();
    cy.checkA11y();
    cy.screenshot('computer-workbench-split', { capture: 'fullPage' });
  });

  it('Preserves invalid HDL across view switches and reloads while blocking stale verification', () => {
    openNotWorkbench();
    chooseView('Code');
    writeHDL(inverterHDL);
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');

    const invalidHDL = inverterHDL.replace('b=in', 'b=missing');
    writeHDL(invalidHDL);
    cy.contains('HDL could not be applied.');
    cy.contains('Signal missing has no driver.');
    cy.findByRole('button', { name: /Test circuit/ }).should('be.disabled');
    cy.findByRole('button', { name: 'Save verified chip' }).should('not.exist');
    cy.contains('2 of 2 combinations work.').should('not.exist');
    chooseView('Visual');
    cy.findByRole('button', { name: /Test circuit/ }).should('be.disabled');
    chooseView('Split');
    cy.findByLabelText('HDL source').should('have.value', invalidHDL);

    cy.reload();
    openNotWorkbench();
    cy.findByLabelText('HDL source').should('have.value', invalidHDL);
    cy.findByRole('button', { name: /Test circuit/ }).should('be.disabled');
    cy.findByRole('button', { name: 'Save verified chip' }).should('not.exist');
    writeHDL(inverterHDL);
    cy.findByRole('alert').should('not.exist');
    cy.findByRole('button', { name: /Test circuit/ })
      .should('not.be.disabled')
      .click();
    cy.contains('2 of 2 combinations work.');
  });

  [320, 1280].forEach((width) => {
    it(`Keeps the layers and all editor views within a ${width}px viewport`, () => {
      cy.viewport(width, 900);
      expectNoPageOverflow();
      if (width === 320) cy.screenshot('computer-landing-mobile', { capture: 'fullPage' });
      openNotWorkbench();
      chooseView('Visual');
      expectNoPageOverflow();
      buildInverter();
      expectNoPageOverflow();
      chooseView('Code');
      expectNoPageOverflow();
      cy.findByLabelText('HDL source').invoke('val').should('include', 'Nand(a=in, b=in');
      chooseView('Split');
      expectNoPageOverflow();
      cy.findByRole('button', { name: /Test circuit/ }).click();
      cy.contains('2 of 2 combinations work.');
      expectNoPageOverflow();
      if (width === 320) cy.screenshot('computer-workbench-mobile', { capture: 'fullPage' });
    });
  });
});

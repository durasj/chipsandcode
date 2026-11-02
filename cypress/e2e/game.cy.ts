function openNotWorkshop() {
  cy.findByRole('region', { name: 'Stations, list view' })
    .findByRole('button', { name: /Not Beacon point/ })
    .click();
  cy.findByRole('button', { name: 'Enter workshop' }).click();
  cy.findByRole('heading', { name: 'Bring back the beacon' }).should('be.visible');
}

function buildInverter() {
  cy.findByRole('button', { name: /^Nand\b/ }).click();
  cy.findByLabelText('Part 1 Nand input a').select('in');
  cy.findByLabelText('Part 1 Nand input b').select('in');
  cy.findByLabelText('Machine output out').select('g1');
}

function expectNoPageOverflow() {
  cy.document().should((document) => {
    const viewport = document.documentElement.clientWidth;
    const pageWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    expect(pageWidth, 'page content fits the viewport').to.be.at.most(viewport + 1);
  });
}

describe('Signal Isles', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.clear();
      },
    });
    cy.contains('Progress saved on this device');
  });

  it('Discovers NAND, remembers the restored station, and earns a working NOT chip', () => {
    cy.findByRole('button', { name: 'Bring it to life' }).click();

    // A wrong prediction cannot complete a case or unlock restoration.
    cy.findByRole('button', { name: 'Predict 0' }).click();
    cy.contains('The NAND output is 1 here.');
    cy.findByRole('button', { name: 'Bring station online' }).should('not.exist');

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
        cy.findByRole('button', { name: 'Bring station online' }).should('not.exist');
      }
    });

    cy.findByRole('button', { name: 'Bring station online' }).click();
    cy.contains('Nand verified. Your world remembers.');
    cy.contains('1 OF 7 SYSTEMS RESTORED');
    cy.reload();
    cy.contains('1 OF 7 SYSTEMS RESTORED');
    cy.findByRole('region', { name: 'Stations, list view' })
      .findByRole('button', { name: /Nand Arrival dock/ })
      .should('contain.text', '✓');

    openNotWorkshop();
    buildInverter();
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('Signal confirmed.');
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Bring station online' }).click();
    cy.contains('Not verified. Your world remembers.');
    cy.contains('2 OF 7 SYSTEMS RESTORED');

    cy.findByRole('button', { name: /Your chips/ }).click();
    cy.contains('article', 'Bring back the beacon').within(() => {
      cy.contains('VERIFIED IN YOUR WORKSHOP');
      cy.contains('Not');
    });
    cy.reload();
    cy.contains('2 OF 7 SYSTEMS RESTORED');
  });

  it('Invalidates a passed test after a connection changes and restores the edited draft', () => {
    openNotWorkshop();
    buildInverter();
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Bring station online' }).should('be.visible');

    // A direct wire is a valid circuit, but it is not an inverter.
    cy.findByLabelText('Machine output out').select('in');
    cy.contains('2 of 2 combinations work.').should('not.exist');
    cy.findByRole('button', { name: 'Bring station online' }).should('not.exist');
    cy.contains('Draft saved on this device');

    cy.reload();
    openNotWorkshop();
    cy.findByLabelText('Part 1 Nand input a').should('have.value', 'in');
    cy.findByLabelText('Part 1 Nand input b').should('have.value', 'in');
    cy.findByLabelText('Machine output out').should('have.value', 'in');
    cy.findByRole('button', { name: 'Bring station online' }).should('not.exist');
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('0 of 2 combinations work.');
    cy.findAllByRole('button', { name: /Inspect case \d, needs work/ }).should('have.length', 2);

    cy.findByLabelText('Machine output out').select('g1');
    cy.contains('0 of 2 combinations work.').should('not.exist');
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Bring station online' }).should('be.visible');
  });

  it('Wires directly on the board and can undo clearing the saved circuit', () => {
    openNotWorkshop();
    cy.findByRole('button', { name: /^Nand\b/ }).click();
    cy.findByRole('button', { name: 'Select source input in' }).click();
    cy.findByRole('button', { name: 'Connect to part 1 Nand input a' }).click();
    cy.findByRole('button', { name: 'Connect to part 1 Nand input b' }).click();
    cy.findByRole('button', { name: 'Select source part 1 Nand output' }).click();
    cy.findByRole('button', { name: 'Connect machine output out' }).click();
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');
    cy.findByRole('button', { name: 'Clear circuit' }).click();
    cy.findByLabelText('Part 1 Nand input a').should('not.exist');
    cy.findByRole('button', { name: 'Undo clear' }).click();
    cy.findByLabelText('Part 1 Nand input a').should('have.value', 'in');
    cy.findByLabelText('Machine output out').should('have.value', 'g1');
    cy.findByRole('button', { name: /Test circuit/ }).click();
    cy.contains('2 of 2 combinations work.');
    cy.reload();
    openNotWorkshop();
    cy.findByLabelText('Machine output out').should('have.value', 'g1');
  });

  [320, 1280].forEach((width) => {
    it(`Keeps the world and workshop within a ${width}px viewport`, () => {
      cy.viewport(width, 900);
      expectNoPageOverflow();
      openNotWorkshop();
      expectNoPageOverflow();
      buildInverter();
      expectNoPageOverflow();
      cy.findByRole('button', { name: /Test circuit/ }).click();
      cy.contains('2 of 2 combinations work.');
      expectNoPageOverflow();
    });
  });
});

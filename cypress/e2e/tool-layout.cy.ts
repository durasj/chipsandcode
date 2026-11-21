import { checkAccessibility, expectNoPageOverflow } from '../support/checks';

const routes = [
  '/tools',
  '/tools/computer',
  '/tools/chip-builder',
  '/tools/vm',
  '/tools/compiler',
  '/tools/bitmap',
  '/tools/boolean-functions',
  '/tools/buses',
  '/tools/hardware-simulator',
  '/tools/hardware-simulator/Xor',
];

function expectWidth(width: number) {
  cy.get('main').should(($main) => {
    expect($main[0].getBoundingClientRect().width).to.be.closeTo(width, 1);
  });
}

describe('Shared tool workspace', () => {
  it('Uses the available width in every tool and keeps the default capped at 1200px', () => {
    cy.viewport(1920, 1080);
    for (const route of routes) {
      cy.visit(route);
      cy.get('.tools-shell').should('have.attr', 'data-width-ready', 'true');
      expectWidth(1200);
      cy.findByRole('button', { name: 'Full width' })
        .click()
        .should('have.attr', 'aria-pressed', 'true');
      expectWidth(1888);
      expectNoPageOverflow();
      if (route === '/tools/computer')
        cy.screenshot('computer-full-width', { capture: 'viewport' });
      if (route === '/tools/hardware-simulator') {
        cy.get('.hardware-workspace').should('have.attr', 'data-ready', 'true');
        cy.get('.editor-mount .monaco-editor').should(($editor) => {
          expect($editor[0].getBoundingClientRect().width).to.be.greaterThan(1200);
        });
        cy.screenshot('hardware-full-width', { capture: 'viewport' });
      }
      cy.findByRole('button', { name: 'Full width' })
        .click()
        .should('have.attr', 'aria-pressed', 'false');
      expectWidth(1200);
    }
  });

  it('Remembers the width across navigation and reload without losing editor work', () => {
    cy.viewport(1920, 1200);
    cy.visit('/tools/computer');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    cy.findByRole('textbox', { name: 'Program source' }).clear().type('@42\nD=A', { delay: 0 });
    cy.findByRole('button', { name: 'Full width' }).focus().type('{enter}');
    expectWidth(1888);
    cy.findByRole('textbox', { name: 'Program source' })
      .should('have.value', '@42\nD=A')
      .and(($editor) => {
        expect($editor[0].getBoundingClientRect().height).to.be.greaterThan(700);
      });
    cy.reload();
    cy.get('.tools-shell').should('have.attr', 'data-width-ready', 'true');
    expectWidth(1888);
    cy.findByRole('textbox', { name: 'Program source' }).should('have.value', '@42\nD=A');
    cy.findByRole('link', { name: '← Tools' }).click();
    cy.findByRole('link', { name: /Jack compiler/ }).click();
    expectWidth(1888);
    cy.findByRole('button', { name: 'Full width' }).click();
    cy.reload();
    expectWidth(1200);
    cy.screenshot('compiler-standard-width', { capture: 'viewport' });
  });

  it('Keeps both width modes usable on a narrow screen', () => {
    cy.viewport(320, 760);
    cy.visit('/tools/computer');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    expectWidth(288);
    cy.findByRole('button', { name: 'Full width' }).click();
    expectWidth(288);
    expectNoPageOverflow();
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('tools-width-mobile', { capture: 'fullPage' });
  });
});

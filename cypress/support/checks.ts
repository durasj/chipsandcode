export function checkAccessibility() {
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

export function expectNoPageOverflow() {
  cy.document().should((document) => {
    expect(
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      'page content fits the viewport',
    ).to.be.at.most(document.documentElement.clientWidth + 1);
  });
}

export function expectMainNavigation() {
  cy.findAllByRole('navigation', { name: 'Main navigation' }).should('have.length', 1);
  cy.findByRole('navigation', { name: 'Main navigation' }).within(() => {
    cy.findAllByRole('link').should('have.length', 3);
    cy.findByRole('link', { name: 'Learn' }).should('have.attr', 'href', '/learn');
    cy.findByRole('link', { name: 'Tools' }).should('have.attr', 'href', '/tools');
    cy.findByRole('link', { name: 'About' }).should('have.attr', 'href', '/about');
  });
  cy.findByText('Color theme switch').should('not.exist');
}

export function exploreNotAnd() {
  cy.get('.signal-intro').should('have.attr', 'data-foundation', 'not');
  cy.findByRole('heading', { name: 'First, flip a signal.' }).should('be.visible');
  cy.findByRole('button', { name: 'Continue' }).should('not.exist');
  cy.findByRole('switch', { name: 'NOT input' })
    .should('have.attr', 'aria-checked', 'false')
    .click()
    .should('have.attr', 'aria-checked', 'true');
  cy.findByRole('img', { name: 'Output 0' }).should('be.visible');
  cy.findByRole('switch', { name: 'NOT input' }).click();
  cy.findByRole('img', { name: 'Output 1' }).should('be.visible');
  cy.findByRole('button', { name: 'Continue' }).click();

  cy.get('.signal-intro').should('have.attr', 'data-foundation', 'and');
  cy.findByRole('heading', { name: 'Now, combine two signals.' }).should('be.visible');
  cy.findByRole('button', { name: 'Continue' }).should('not.exist');
  cy.findByRole('switch', { name: 'AND input a' }).click();
  cy.findByRole('img', { name: 'Output 0' }).should('be.visible');
  cy.findByRole('switch', { name: 'AND input b' }).click();
  cy.findByRole('img', { name: 'Output 1' }).should('be.visible');
  cy.findByRole('switch', { name: 'AND input a' }).click();
  cy.findByRole('img', { name: 'Output 0' }).should('be.visible');
  cy.findByRole('switch', { name: 'AND input b' }).click();
  cy.findByRole('button', { name: 'Continue' }).click();
  cy.findByRole('heading', { name: 'AND, with its answer flipped.' }).should('be.visible');
}

describe('About', () => {
  it('Can be navigated to from menu', () => {
    cy.visit('/');
    cy.injectAxe();

    // TODO: Find a way to suppress dynamic ESM loading for Cypress tests
    cy.wait(1500);

    cy.contains('nav a', 'About').click();

    cy.contains('Chips and Code');

    cy.matchImage();

    cy.scrollTo('bottom');
    cy.matchImage();

    // ... and screenshots cause the app to reload which may take some time
    cy.wait(500);

    cy.checkA11y();
  });

  it('Contains all important information and links', () => {
    cy.visit('/about');

    cy.contains('h1', 'Chips and Code');

    cy.contains('a', 'Report Bug / Request Feature')
      .invoke('attr', 'href')
      .should('equal', 'https://github.com/durasj/chipsandcode/issues');

    cy.contains('a', 'Discussions')
      .invoke('attr', 'href')
      .should('equal', 'https://github.com/durasj/chipsandcode/discussions');

    cy.contains('reimagined');
    cy.contains('a', 'Nand2Tetris')
      .invoke('attr', 'href')
      .should('equal', 'https://nand2tetris.org');

    cy.contains('not affiliated or endorsed by them');

    cy.contains(`master's thesis at the`);
    cy.contains('a', 'University of Galway')
      .invoke('attr', 'href')
      .should('equal', 'https://www.universityofgalway.ie');

    cy.contains('a', 'Research Behind')
      .invoke('attr', 'href')
      .should('equal', 'https://thesis.chipsandcode.com');

    cy.contains('a', 'Code Repository')
      .invoke('attr', 'href')
      .should('equal', 'https://github.com/durasj/chipsandcode');

    cy.contains('Credits');
    cy.contains('Open source');
    cy.contains(
      'Nand2Tetris content licensed under the CC BY-NC-SA 3.0, Svelte framework, Tailwind and DaisyUI styling libraries, Nearley parser toolkit, and Monaco Editor, all licensed under the MIT license',
    );

    cy.contains('participants');
    cy.contains(
      'Thank you Jan, Matej, Patrik, Pavol, Stefan, Michal, Masa, Michal, Sasa, Jozef, Peter, Matus, Brano, Robert, Lubo, Max, Viktoria, Kyryl, Matus, Lukas, Martina, Karolina, Lubos, Martin, Erik, Filip',
    );
  });
});

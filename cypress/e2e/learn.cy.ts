import { checkAccessibility, expectMainNavigation, expectNoPageOverflow } from '../support/checks';

const pages = [
  ['boolean-logic', 'From signals to logic'],
  ['boolean-logic/background', 'Logic, composition, and HDL'],
  ['boolean-logic/project', 'Gate contracts and larger buses'],
  ['meta/what-next', 'Beyond the logic layer'],
];

function visitFreshLearning() {
  cy.visit('/learn', {
    onBeforeLoad(window) {
      window.localStorage.clear();
      window.sessionStorage.clear();
    },
  });
  cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
}

describe('Unified learning and full explanations', () => {
  it('Starts Learn at the foundation and opens optional reference in the same interface', () => {
    cy.visit('/', {
      onBeforeLoad(window) {
        window.localStorage.clear();
      },
    });
    cy.findByRole('navigation', { name: 'Main navigation' })
      .findByRole('link', { name: 'Learn' })
      .click();
    cy.location('pathname').should('eq', '/learn');
    cy.findByRole('heading', { name: 'A computer starts with a signal.' }).should('be.visible');
    cy.findByRole('button', { name: 'Reference' }).click();
    cy.findByRole('heading', { level: 1, name: 'Reference' }).should('have.focus');
    cy.findByRole('button', { name: 'NOT' }).should('have.attr', 'aria-pressed', 'true');
    cy.findByRole('link', { name: 'Read the full explanation' }).click();
    cy.location('pathname').should('eq', '/learn/reference/boolean-logic/background');
    cy.findByRole('heading', { level: 1, name: 'Logic, composition, and HDL' }).should(
      'be.visible',
    );
    expectMainNavigation();
    cy.findByRole('link', { name: 'Color theme switch' }).should('not.exist');
  });

  it('Keeps every reference chapter accessible with contextual deeper reading', () => {
    visitFreshLearning();
    cy.findByRole('button', { name: 'Reference' }).click();
    cy.injectAxe();
    const chapters = [
      ['Signals & gates', 'Signals and gates'],
      ['Expressions', 'Boolean expressions'],
      ['HDL & composition', 'Interfaces and implementation'],
      ['Buses & selectors', 'Buses and selectors'],
      ['Read more', 'Source material'],
    ];
    chapters.forEach(([button, heading]) => {
      cy.findByRole('navigation', { name: 'Reference chapters' })
        .findByRole('button', { name: new RegExp(button) })
        .click();
      cy.findByRole('heading', { name: heading }).should('be.visible');
      checkAccessibility();
    });
    cy.findByRole('button', { name: 'Back' }).click();
    cy.findByRole('heading', { name: 'A computer starts with a signal.' }).should('be.visible');
  });

  it('Redirects every legacy article into the adapted, consistently styled reading', () => {
    pages.forEach(([path, title]) => {
      cy.visit(`/learn/hardware/${path}`);
      cy.location('pathname').should('eq', `/learn/reference/${path}`);
      cy.findByRole('heading', { level: 1, name: title }).should('be.visible');
      expectMainNavigation();
      cy.get('main')
        .find('a[href^="/experiment/"], a[href^="/learn/hardware/"]')
        .should('not.exist');
      cy.get('.monaco-editor').should('not.exist');
      cy.injectAxe();
      checkAccessibility();
    });
  });

  it('Covers complete theory and moves through the full explanations without old course chrome', () => {
    cy.visit('/learn/reference/boolean-logic');
    cy.findByRole('navigation', { name: 'Continue reading' })
      .findByRole('link', { name: /Next/ })
      .click();
    cy.location('pathname').should('eq', '/learn/reference/boolean-logic/background');
    [
      'Signals and Boolean operations',
      'Truth tables',
      'Canonical representation',
      'All two-input functions',
      'Universality',
      'Interfaces and composition',
      'A worked XOR circuit',
      'Reading HDL',
      'Testing a construction',
    ].forEach((name) => {
      cy.findByRole('heading', { name }).should('exist');
    });
    cy.get('#all-two-input-functions')
      .nextAll('.reference-table')
      .first()
      .find('tbody tr')
      .should('have.length', 16);
    cy.contains('summary', 'In this explanation').click();
    cy.findByRole('navigation', { name: 'On this page' })
      .findByRole('link', { name: 'Universality' })
      .click();
    cy.location('hash').should('eq', '#universality');
    cy.get('#universality').should('be.visible');
    cy.findByRole('navigation', { name: 'Continue reading' })
      .findByRole('link', { name: /Next/ })
      .click();
    cy.location('pathname').should('eq', '/learn/reference/boolean-logic/project');
    cy.findByRole('heading', { name: 'Buses' }).should('exist');
    cy.findByRole('heading', { name: 'Multi-way operations' }).should('exist');
    cy.findByRole('heading', { name: 'Correctness, then efficiency' }).should('exist');
    cy.contains('summary', 'Full explanations').click();
    cy.findByRole('navigation', { name: 'Full explanations' })
      .findByRole('link', { name: 'Overview' })
      .click();
    cy.location('pathname').should('eq', '/learn/reference/boolean-logic');
  });

  it('Links full reading to the working simulator and additional tools', () => {
    cy.visit('/learn/reference/boolean-logic/background');
    cy.findByRole('link', { name: 'Open the worked XOR in the hardware simulator' }).click();
    cy.location('pathname').should('eq', '/tools/hardware-simulator/Xor');
    cy.get('.hardware-workspace', { timeout: 20000 }).should('have.attr', 'data-ready', 'true');
    cy.findByLabelText('Value for a').clear().type('1').blur();
    cy.contains('tr', 'out').contains('td', '1');
    cy.visit('/learn/reference/meta/what-next');
    cy.findByRole('link', { name: 'Explore all sixteen two-input functions' }).should(
      'have.attr',
      'href',
      '/tools/boolean-functions',
    );
    cy.findByRole('link', { name: 'Work with buses and routing' }).click();
    cy.location('pathname').should('eq', '/tools/buses');
    cy.findByTestId('bus-output').should('have.text', '65295');
  });

  it('Keeps complete explanations readable on a narrow screen with keyboard-scrollable tables', () => {
    cy.viewport(320, 760);
    cy.visit('/learn/reference/boolean-logic/background');
    expectNoPageOverflow();
    cy.get('.reference-table')
      .first()
      .should('have.attr', 'tabindex', '0')
      .focus()
      .should('have.focus');
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('full-explanation-mobile', { capture: 'fullPage' });
  });
});

import {
  checkAccessibility,
  expectMainNavigation,
  expectNoPageOverflow,
  exploreNotAnd,
} from '../support/checks';

const choicesKey = 'chipsandcode.learning-choices.v1';
function openChoices() {
  cy.get('.topic-coach > summary').click();
}
function openTopics() {
  cy.get('.topic-navigation > summary').click();
}

describe('Learner choices and topic-level suggestions', () => {
  it('keeps a fresh beginner entry and allows direct experienced entry without completing basics', () => {
    cy.visit('/learn');
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    cy.findByRole('heading', { name: 'A computer starts with a signal.' }).should('be.visible');
    cy.get('.topic-coach').should('not.have.attr', 'open');
    expectMainNavigation();
    openTopics();
    cy.screenshot('adaptive-desktop-topic-picker', { capture: 'fullPage' });
    cy.findByRole('navigation', { name: 'Choose a learning topic' }).within(() => {
      cy.findByRole('link', { name: /Build logic gates/ }).should('contain', '0 / 5 checked');
      cy.findByRole('link', { name: /Select & route/ }).click();
    });
    cy.location('search').should('eq', '?mission=mux');
    cy.findByRole('heading', { name: 'Select a data path' }).should('be.visible');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('chipsandcode.progress.v1')).to.equal(null);
      expect(win.localStorage.getItem('chipsandcode.signal-intro.v1')).to.equal(null);
    });
    openChoices();
    cy.get('.topic-coach').should('contain', 'Revisit build logic gates');
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('adaptive-desktop-topic-choice', { capture: 'fullPage' });
  });

  it('keeps forward progression and reload aligned after choosing a later mission directly', () => {
    cy.visit('/learn?mission=and');
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    cy.findByRole('combobox', { name: 'Editor view' }).select('code');
    cy.findByLabelText('HDL source')
      .clear()
      .type('CHIP And { IN a, b; OUT out; PARTS: Nand(a=a, b=b, out=n); Not(in=n, out=out); }', {
        parseSpecialCharSequences: false,
        delay: 0,
      });
    cy.findByRole('button', { name: 'Test circuit' }).click();
    cy.findByRole('button', { name: 'Continue' }).click();
    cy.findByRole('heading', { name: 'AND works.' }).should('be.visible');
    cy.findByRole('button', { name: 'Continue' }).click();
    cy.location('search').should('eq', '?mission=or');
    cy.findByRole('heading', { name: 'Merge two signals' }).should('be.visible');
    cy.reload();
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    cy.findByRole('heading', { name: 'Merge two signals' }).should('be.visible');
    cy.window().then((win) =>
      expect(
        JSON.parse(win.localStorage.getItem('chipsandcode.progress.v1') || '[]'),
      ).to.deep.equal(['and']),
    );
  });

  it('updates an explicit signals link when the introduction reaches NAND', () => {
    cy.visit('/learn?topic=signals');
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    cy.findByRole('switch', { name: 'Signal' }).click().click();
    cy.findByRole('button', { name: 'Continue' }).click();
    exploreNotAnd();
    cy.location('search').should('eq', '?mission=nand');
    cy.reload();
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    cy.findByRole('heading', { name: 'AND, with its answer flipped.' }).should('be.visible');
  });

  it('persists explicit topic skips without credit and keeps manual recovery available', () => {
    cy.visit('/learn');
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    openChoices();
    cy.findByRole('button', { name: 'Familiar? Skip this topic' }).click();
    cy.get('.topic-coach .adaptive-suggestion').click();
    openChoices();
    cy.findByRole('button', { name: 'Familiar? Skip this topic' }).click();
    cy.get('.topic-coach .adaptive-suggestion').click();
    cy.findByRole('heading', { name: 'Select a data path' }).should('be.visible');
    cy.reload();
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    openTopics();
    cy.findByRole('navigation', { name: 'Choose a learning topic' })
      .findByRole('link', { name: /Build logic gates/ })
      .should('contain', '0 / 5 checked')
      .and('contain', 'Skipped by choice')
      .click();
    cy.findByRole('heading', { name: 'AND, with its answer flipped.' }).should('be.visible');
    openChoices();
    cy.findByRole('button', { name: 'Need more help' }).click();
    cy.get('.topic-coach').should('not.contain', 'Skipped by your choice');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('chipsandcode.progress.v1')).to.equal(null);
      expect(win.localStorage.getItem('chipsandcode.signal-intro.v1')).to.equal(null);
    });
  });

  it('keeps skipped signal observations unearned after directly checking NAND and reloading', () => {
    cy.visit('/learn?mission=nand');
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    cy.findByRole('button', { name: 'Output 1' }).click();
    cy.findByRole('button', { name: 'Next combination' }).click();
    cy.findByRole('button', { name: 'Input b 0' }).click();
    cy.findByRole('button', { name: 'Output 1' }).click();
    cy.findByRole('button', { name: 'Next combination' }).click();
    cy.findByRole('button', { name: 'Input a 0' }).click();
    cy.findByRole('button', { name: 'Output 0' }).click();
    cy.findByRole('button', { name: 'Next combination' }).click();
    cy.findByRole('button', { name: 'Input b 1' }).click();
    cy.findByRole('button', { name: 'Output 1' }).click();
    cy.findByRole('button', { name: 'Continue' }).click();
    cy.findByRole('heading', { name: 'NAND, explored.' }).should('be.visible');
    cy.window().then((win) =>
      expect(win.localStorage.getItem('chipsandcode.signal-intro.v1')).to.equal('not-observed'),
    );
    cy.reload();
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    openTopics();
    cy.findByRole('navigation', { name: 'Choose a learning topic' })
      .findByRole('link', { name: /Signals & first gates/ })
      .should('contain', 'Not explored here');
  });

  it('makes feedback optional, scoped to one topic, persistent and reversible', () => {
    cy.visit('/learn?mission=not');
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    openChoices();
    cy.findByRole('button', { name: 'Too easy' }).click();
    cy.get('.topic-coach .adaptive-suggestion').should('have.attr', 'href', '/learn?mission=xor');
    cy.get('.topic-coach .adaptive-suggestion').click();
    cy.findByRole('heading', { name: 'Detect a difference' }).should('be.visible');
    cy.findByRole('button', { name: 'Need more help' }).click();
    cy.get('.topic-coach').should('contain', 'A smaller step');
    cy.get('.topic-coach .adaptive-suggestion').should('have.attr', 'href', '/learn?mission=nand');
    cy.reload();
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    openChoices();
    cy.findByRole('button', { name: 'Need more help' }).should('have.attr', 'aria-pressed', 'true');
    cy.findByRole('button', { name: 'About right' }).click();
    cy.get('.topic-coach').should('not.contain', 'A smaller step');
    cy.findByRole('button', { name: 'Reset this topic’s choices' }).click();
    cy.findByRole('button', { name: 'About right' }).should('have.attr', 'aria-pressed', 'false');
    cy.window().then((win) => {
      expect(JSON.parse(win.localStorage.getItem(choicesKey) || '{}')).to.deep.equal({
        version: 1,
        topics: {},
      });
      expect(win.localStorage.getItem('chipsandcode.progress.v1')).to.equal(null);
    });
  });

  it('skips by choice and recovers a mistaken placement while retaining an unfinished chapter draft', () => {
    cy.visit('/learn/path/arithmetic?task=alu');
    cy.get('.course-page')
      .should('have.attr', 'data-task', 'alu')
      .and('have.attr', 'data-ready', 'true');
    cy.findByRole('combobox', { name: 'Construction view' }).select('code');
    cy.findByRole('textbox', { name: 'HDL source' })
      .clear()
      .type('// my unfinished ALU', { parseSpecialCharSequences: false, delay: 0 });
    openChoices();
    cy.findByRole('button', { name: 'Familiar? Skip this topic' }).click();
    cy.get('.topic-coach').should('contain', 'Nothing in this topic was marked complete');
    cy.get('.topic-coach .adaptive-suggestion').should(
      'have.attr',
      'href',
      '/learn/path/memory?task=bit',
    );
    cy.findByRole('button', { name: 'Need more help' }).click();
    cy.get('.topic-coach .adaptive-suggestion')
      .should('have.attr', 'href', '/learn/path/arithmetic?task=halfadder')
      .click();
    cy.get('.course-page').should('have.attr', 'data-task', 'halfadder');
    cy.findByRole('heading', { name: 'Add two bits' }).should('have.focus');
    cy.contains('summary', 'Steps in this layer').click();
    cy.findByRole('button', { name: /Control a calculation/ }).click();
    cy.get('.course-page').should('have.attr', 'data-task', 'alu');
    cy.location('search').should('eq', '?task=alu');
    cy.findByRole('combobox', { name: 'Construction view' }).select('code');
    cy.findByRole('textbox', { name: 'HDL source' }).should('have.value', '// my unfinished ALU');
    cy.reload();
    cy.get('.course-page')
      .should('have.attr', 'data-ready', 'true')
      .and('have.attr', 'data-task', 'alu');
    cy.findByRole('combobox', { name: 'Construction view' }).select('code');
    cy.findByRole('textbox', { name: 'HDL source' }).should('have.value', '// my unfinished ALU');
    cy.window().then((win) => {
      expect(win.localStorage.getItem('chipsandcode.part-one.progress.v1')).to.equal(null);
      expect(
        JSON.parse(win.localStorage.getItem(choicesKey) || '{}').topics.arithmetic,
      ).to.deep.equal({ feedback: 'need-help' });
    });
  });

  it('preserves old progress and drafts, switches chapters, and restores direct entry on browser back', () => {
    cy.visit('/learn?mission=not', {
      onBeforeLoad(win) {
        win.localStorage.setItem('chipsandcode.signal-isles.progress.v1', '["nand","not"]');
        win.localStorage.setItem('chipsandcode.part-one.progress.v1', '["buses/not16"]');
        win.localStorage.setItem(
          'chipsandcode.part-one.draft.buses/and16',
          '// saved before learning choices',
        );
      },
    });
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    openTopics();
    cy.findByRole('navigation', { name: 'Choose a learning topic' }).within(() => {
      cy.findByRole('link', { name: /Build logic gates/ }).should('contain', '2 / 5 checked');
      cy.findByRole('link', { name: /Work with words/ })
        .should('contain', '1 / 9 checked')
        .click();
    });
    cy.get('.course-page').should('have.attr', 'data-task', 'not16');
    cy.contains('summary', 'Steps in this layer').click();
    cy.findByRole('button', { name: /Combine two words/ }).click();
    cy.findByRole('combobox', { name: 'Construction view' }).select('code');
    cy.findByRole('textbox', { name: 'HDL source' }).should(
      'have.value',
      '// saved before learning choices',
    );
    openTopics();
    cy.findByRole('navigation', { name: 'Choose a learning topic' })
      .findByRole('link', { name: /Turn names into instructions/ })
      .click();
    cy.get('.course-page').should('have.attr', 'data-chapter', 'assembler');
    cy.go('back');
    cy.get('.course-page')
      .should('have.attr', 'data-ready', 'true')
      .and('have.attr', 'data-task', 'and16');
    cy.findByRole('combobox', { name: 'Construction view' }).select('code');
    cy.findByRole('textbox', { name: 'HDL source' }).should(
      'have.value',
      '// saved before learning choices',
    );
  });

  it('keeps choices and drafts usable through client navigation when storage is unavailable', () => {
    cy.visit('/learn/path/arithmetic?task=alu', {
      onBeforeLoad(win) {
        cy.stub(win.Storage.prototype, 'getItem').throws(new Error('Storage denied'));
        cy.stub(win.Storage.prototype, 'setItem').throws(new Error('Storage denied'));
      },
    });
    cy.get('.course-page').should('have.attr', 'data-ready', 'true');
    cy.findByRole('combobox', { name: 'Construction view' }).select('code');
    cy.findByRole('textbox', { name: 'HDL source' })
      .clear()
      .type('// session ALU', { parseSpecialCharSequences: false, delay: 0 });
    openChoices();
    cy.findByRole('button', { name: 'Need more help' }).click();
    cy.get('.topic-coach').should('contain', 'Reloading may lose them');
    cy.get('.topic-coach .adaptive-suggestion').click();
    cy.get('.course-page').should('have.attr', 'data-task', 'halfadder');
    cy.contains('summary', 'Steps in this layer').click();
    cy.findByRole('button', { name: /Control a calculation/ }).click();
    cy.findByRole('combobox', { name: 'Construction view' }).select('code');
    cy.findByRole('textbox', { name: 'HDL source' }).should('have.value', '// session ALU');
    cy.findByRole('button', { name: 'Need more help' }).should('have.attr', 'aria-pressed', 'true');
  });

  it('supports narrow screens, keyboard activation, and accessible optional guidance', () => {
    cy.viewport(320, 760);
    cy.visit('/learn/path/memory?task=pc');
    cy.get('.course-page').should('have.attr', 'data-ready', 'true');
    cy.get('.topic-navigation > summary').focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get('.topic-navigation').should('have.attr', 'open');
    cy.injectAxe();
    checkAccessibility();
    expectNoPageOverflow();
    cy.screenshot('adaptive-mobile-topic-picker', { capture: 'fullPage' });
    cy.get('.topic-navigation > summary').focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get('.topic-coach > summary').focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.findByRole('button', { name: 'Need more help' }).focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.findByRole('button', { name: 'Need more help' }).should('have.attr', 'aria-pressed', 'true');
    checkAccessibility();
    expectNoPageOverflow();
    cy.screenshot('adaptive-mobile-help-and-refreshers', { capture: 'fullPage' });
    cy.findByRole('button', { name: 'Close adjustments' }).click();
    cy.get('.topic-coach').should('not.have.attr', 'open');
  });
});

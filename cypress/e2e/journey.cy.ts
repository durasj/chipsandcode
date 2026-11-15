import { treatments } from '../../src/lib/journey/treatments';
const journeySteps = Object.entries(treatments).map(([id, values]) => ({
  id,
  diagram: values[0],
  prior: values[2],
  change: values[3],
  next: values[4],
}));
import { checkAccessibility, expectNoPageOverflow } from '../support/checks';

const scene = () => cy.get('.learning-journey');
const pick = (id: string) =>
  cy.findByRole('combobox', { name: 'Explore a visual learning step' }).select(id);

describe('A growing computer at every learning step', () => {
  it('maps every step and captures each distinct visual family without granting completion', () => {
    cy.visit('/learn/path');
    cy.get('.course-page').should('have.attr', 'data-ready', 'true');
    const captured = new Set<string>();
    for (const step of journeySteps) {
      pick(step.id);
      scene()
        .should('have.attr', 'data-journey-step', step.id)
        .and('have.attr', 'data-journey-view', 'inside');
      scene()
        .should('contain.text', step.change)
        .and('contain.text', step.prior)
        .and('contain.text', step.next);
      if (
        !captured.has(step.diagram) ||
        [
          'missions/not',
          'missions/and',
          'missions/or',
          'missions/xor',
          'arithmetic/fulladder',
          'arithmetic/add16',
          'arithmetic/inc16',
          'memory/register',
          'memory/ram16k',
        ].includes(step.id)
      ) {
        captured.add(step.diagram);
        cy.get('.scene-stage').should('not.have.class', 'revealing');
        scene().screenshot(
          `journey-desktop-${captured.has(step.diagram) && ['missions/not', 'missions/and', 'missions/or', 'missions/xor', 'arithmetic/fulladder', 'arithmetic/add16', 'arithmetic/inc16', 'memory/register', 'memory/ram16k'].includes(step.id) ? step.id.replace('/', '-') : step.diagram}`,
        );
      }
    }
    cy.window().then((win) => {
      expect(win.localStorage.getItem('chipsandcode.progress.v1')).to.equal(null);
      expect(win.localStorage.getItem('chipsandcode.part-one.progress.v1')).to.equal(null);
    });
    cy.injectAxe();
    checkAccessibility();
    expectNoPageOverflow();
  });

  it('keeps the active draft while inspecting another layer, then reveals verified composition', () => {
    cy.visit('/learn/path/buses');
    cy.get('.course-page').should('have.attr', 'data-ready', 'true');
    cy.findByRole('combobox', { name: 'Construction view' }).select('code');
    const source = `CHIP Not16 { IN in[16]; OUT out[16]; PARTS:\n${Array.from({ length: 16 }, (_, i) => `Not(in=in[${i}],out=out[${i}]);`).join('\n')}\n}`;
    cy.findByRole('textbox', { name: 'HDL source' })
      .clear()
      .type(source, { parseSpecialCharSequences: false, delay: 0 });
    scene().should('contain.text', 'Not × 16');
    pick('architecture/cpu');
    scene().should('have.attr', 'data-journey-status', 'Not verified here');
    cy.window().then((win) =>
      win.dispatchEvent(
        new win.CustomEvent('chipsandcode:learning-choices-changed', {
          detail: { version: 1, topics: { architecture: { skipped: true } } },
        }),
      ),
    );
    scene().should('have.attr', 'data-journey-status', 'Bypassed · not verified here');
    cy.window().then((win) =>
      win.dispatchEvent(
        new win.CustomEvent('chipsandcode:learning-choices-changed', {
          detail: { version: 1, topics: {} },
        }),
      ),
    );
    scene().should('have.attr', 'data-journey-status', 'Not verified here');
    cy.findByRole('button', { name: 'Return to Not16' }).focus().type('{enter}');
    scene().should('have.attr', 'data-journey-step', 'buses/not16');
    cy.findByRole('textbox', { name: 'HDL source' }).should('have.value', source);
    cy.findByRole('button', { name: 'Check my work' }).click();
    scene()
      .should('have.attr', 'data-journey-status', 'Verified')
      .and('have.attr', 'data-journey-view', 'system');
    cy.get('.scene-stage').should('not.have.class', 'revealing');
    scene()
      .find('[data-system-module="Logic"]')
      .should('have.attr', 'data-evidence-count', '1')
      .and('contain', 'Not16');
    scene().find('[data-system-module="ALU"]').should('have.attr', 'data-evidence-count', '0');
    scene().screenshot('journey-verified-zoom-out');
    cy.findByRole('button', { name: 'Inside this piece' }).click();
    scene().should('have.attr', 'data-journey-view', 'inside');
    cy.reload();
    cy.get('.course-page').should('have.attr', 'data-task', 'and16');
    pick('buses/not16');
    scene().should('have.attr', 'data-journey-status', 'Verified');
  });

  it('makes every introductory observation visible in the journey', () => {
    cy.visit('/learn');
    cy.get('.computer-game').should('have.attr', 'data-ready', 'true');
    scene().should('have.attr', 'data-journey-step', 'intro/signal');
    cy.findByRole('switch', { name: 'Signal' }).click();
    scene().should('contain.text', 'out = 1');
    cy.findByRole('switch', { name: 'Signal' }).click();
    scene().should('have.attr', 'data-journey-status', 'Explored');
    cy.findByRole('button', { name: 'Continue' }).click();
    scene().should('have.attr', 'data-journey-step', 'intro/not');
    cy.findByRole('switch', { name: 'NOT input' }).click().click();
    cy.findByRole('button', { name: 'Continue' }).click();
    scene().should('have.attr', 'data-journey-step', 'intro/and');
    cy.findByRole('switch', { name: 'AND input a' }).click();
    cy.findByRole('switch', { name: 'AND input b' }).click();
    scene().should('contain.text', 'out = 1');
    cy.findByRole('switch', { name: 'AND input a' }).click();
    cy.findByRole('switch', { name: 'AND input b' }).click();
    cy.findByRole('button', { name: 'Continue' }).click();
    scene().should('have.attr', 'data-journey-step', 'missions/nand');
  });

  it('executes keyboard reads and screen writes, and loads a learner draft honestly', () => {
    cy.visit('/learn/path/machine-language');
    cy.get('.course-page').should('have.attr', 'data-ready', 'true');
    cy.contains('summary', 'Steps in this layer').click();
    cy.findByRole('button', { name: 'Connect a key to the screen' }).click();
    cy.get('[data-runtime-pixels]').should('contain', '0 / 8,192');
    cy.findByRole('button', { name: 'Press A key' }).click();
    cy.get('[data-runtime-pixels]').should('contain', '0 / 8,192');
    cy.findByRole('button', { name: 'Run program' }).click();
    cy.get('[data-runtime-pixels]').should('contain', '8,192 / 8,192');
    cy.get('.execution-evidence').should('contain', '65 at instruction');
    cy.get('.scene-stage').should('not.have.class', 'revealing');
    scene().screenshot('journey-keyboard-program-pixels');
    cy.findByRole('button', { name: 'Release A key' }).click();
    cy.get('.execution-evidence').should('not.contain', '65 at instruction');
    cy.get('[data-runtime-pixels]').should('contain', '8,192 / 8,192');
    cy.findByRole('button', { name: 'Run program' }).click();
    cy.get('[data-runtime-pixels]').should('contain', '0 / 8,192');
    cy.findByRole('textbox', { name: 'Assembly source' }).clear().type('@1\nD=A', { delay: 0 });
    cy.findByRole('button', { name: 'Load my Fill draft' }).click();
    cy.findByRole('button', { name: 'Run program' }).click();
    scene()
      .should('contain', 'Your Fill draft · loaded snapshot')
      .and('contain', 'No keyboard read observed')
      .and('contain', 'No screen write observed');
    cy.findByRole('textbox', { name: 'Assembly source' }).should('have.value', '@1\nD=A');
  });

  it('keeps diagrams, explanations and controls usable at 320 pixels with reduced motion', () => {
    cy.viewport(320, 760);
    cy.visit('/learn/path', {
      onBeforeLoad(win) {
        const original = win.matchMedia.bind(win);
        win.matchMedia = (query: string) => {
          const result = original(query);
          if (query === '(prefers-reduced-motion: reduce)')
            Object.defineProperty(result, 'matches', { value: true });
          return result;
        };
      },
    });
    for (const id of [
      'buses/not16',
      'missions/not',
      'arithmetic/fulladder',
      'memory/bit',
      'arithmetic/alu',
      'memory/ram16k',
      'architecture/cpu',
      'architecture/computer',
      'assembler/assembler',
    ]) {
      pick(id);
      cy.get('.scene-stage')
        .should('have.attr', 'data-motion', 'reduced')
        .and('not.have.class', 'revealing');
      cy.findByRole('button', { name: 'Replay reveal' }).should('not.exist');
      expectNoPageOverflow();
      cy.get('.scene-stage').should('not.have.class', 'revealing');
      scene().screenshot(`journey-mobile-reduced-${id.replace('/', '-')}`);
    }
    cy.findByRole('button', { name: /Zoom out/ })
      .focus()
      .type('{enter}');
    scene().should('have.attr', 'data-journey-view', 'system');
    cy.injectAxe();
    checkAccessibility();
    expectNoPageOverflow();
  });
});

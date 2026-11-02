import { checkAccessibility, expectMainNavigation, expectNoPageOverflow } from '../support/checks';

function chooseComponent(value: string) {
  cy.findByRole('combobox', { name: 'Component' }).select(value).should('have.value', value);
}

function setWord(name: string, value: string) {
  cy.findByRole('textbox', { name }).clear().type(value);
}

describe('Logic tools', () => {
  it('Connects edited truth tables, canonical form, NAND construction, and equivalence', () => {
    cy.visit('/tools/boolean-functions');
    expectMainNavigation();
    cy.findByRole('heading', { level: 1, name: 'Boolean functions' }).should('be.visible');
    cy.findByRole('combobox', { name: 'Function' }).should('have.value', '6');
    cy.findByTestId('function-output').should('have.text', '0');
    cy.findByRole('button', { name: 'Input a' }).click();
    cy.findByTestId('function-output').should('have.text', '1');
    cy.findByRole('button', { name: 'Input b' }).click();
    cy.findByTestId('function-output').should('have.text', '0');
    cy.findByRole('combobox', { name: 'Function' }).select('1');
    cy.findByTestId('canonical-expression').should('have.text', 'f = (a AND b)');
    cy.findByTestId('function-output').should('have.text', '1');
    cy.findByRole('button', { name: 'Output for a 0 b 0' })
      .click()
      .should('have.attr', 'aria-pressed', 'true');
    cy.findByRole('combobox', { name: 'Function' }).should('have.value', '9');
    cy.findByTestId('canonical-expression').should('contain', '(NOT a AND NOT b) OR (a AND b)');
    cy.contains('summary', 'NAND construction').click();
    cy.findByTestId('nand-verification').should('contain', '4 of 4 input combinations match.');
    cy.findByLabelText('Equivalent NAND HDL').should('contain', 'CHIP Function2');
    cy.contains('summary', 'Compare functions').click();
    cy.findByRole('combobox', { name: 'Compare with' }).select('6');
    cy.findByTestId('equivalence-result').should('contain', '4 of 4 input combinations differ');
    cy.findByRole('combobox', { name: 'Compare with' }).select('9');
    cy.findByTestId('equivalence-result').should(
      'contain',
      'Equivalent: all 4 input combinations match.',
    );
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('boolean-functions-lab', { capture: 'fullPage' });
  });

  it('Computes bus operations, exposes bit order, and rejects out-of-range words', () => {
    cy.visit('/tools/buses');
    expectMainNavigation();
    cy.findByRole('heading', { level: 1, name: 'Buses and routing' }).should('be.visible');
    cy.findByTestId('bus-output').should('have.text', '65295');
    setWord('Input in', '0');
    cy.findByTestId('bus-output').should('have.text', '65535');
    cy.contains('summary', 'Inspect individual bits').click();
    cy.findByRole('button', { name: 'Input in bit 15' }).click();
    cy.findByTestId('bus-output').should('have.text', '32767');
    setWord('Input in', '65536');
    cy.findByRole('alert').should('be.visible');
    cy.findByTestId('bus-output')
      .should('contain', 'Enter valid inputs')
      .and('not.contain', '32767');
    setWord('Input in', '0');
    chooseComponent('and16');
    setWord('Input a', '0xAAAA');
    setWord('Input b', '0x5555');
    cy.findByTestId('bus-output').should('have.text', '0');
    chooseComponent('or16');
    cy.findByTestId('bus-output').should('have.text', '65535');
    chooseComponent('or8way');
    setWord('Input in', '0b00000000');
    cy.findByTestId('bus-output').should('have.text', '0');
    setWord('Input in', '0b10000000');
    cy.findByTestId('bus-output').should('have.text', '1');
    cy.injectAxe();
    checkAccessibility();
  });

  it('Routes whole words and single signals using the selected path only', () => {
    cy.visit('/tools/buses');
    chooseComponent('mux4way16');
    cy.findByRole('combobox', { name: 'Selector' }).select('2');
    cy.findByTestId('bus-output').should('have.text', '13107');
    cy.findByRole('combobox', { name: 'Input to edit' }).select('c');
    setWord('Input c', '42');
    cy.findByTestId('bus-output').should('have.text', '42');
    chooseComponent('mux8way16');
    cy.findByRole('combobox', { name: 'Selector' }).select('7');
    cy.findByTestId('bus-output').should('have.text', '65535');
    chooseComponent('dmux8way');
    cy.findByRole('combobox', { name: 'Selector' }).select('7');
    cy.findByTestId('bus-output-h').should('have.text', '1');
    ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach((pin) => {
      cy.findByTestId(`bus-output-${pin}`).should('have.text', '0');
    });
    cy.findByRole('button', { name: 'Input signal' }).click();
    cy.findByTestId('bus-output-h').should('have.text', '0');
    cy.contains('summary', 'How this component is built').click();
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('bus-routing-lab', { capture: 'fullPage' });
  });

  it('Keeps both new labs readable and operable at 320 pixels', () => {
    cy.viewport(320, 760);
    cy.visit('/tools/boolean-functions');
    expectNoPageOverflow();
    cy.findByRole('combobox', { name: 'Function' }).select('15');
    cy.contains('summary', 'NAND construction').click();
    expectNoPageOverflow();
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('boolean-functions-mobile', { capture: 'fullPage' });
    cy.visit('/tools/buses');
    chooseComponent('mux8way16');
    cy.contains('summary', 'Inspect individual bits').click();
    cy.findByRole('button', { name: 'Input a bit 0' }).click();
    cy.findByTestId('bus-output').should('have.text', '241');
    expectNoPageOverflow();
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('buses-mobile', { capture: 'fullPage' });
  });
});

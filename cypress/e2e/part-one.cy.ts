import { checkAccessibility, expectMainNavigation, expectNoPageOverflow } from '../support/checks';

function visitComputer() {
  cy.visit('/tools/computer');
  cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
}

function writeProgram(source: string) {
  cy.findByRole('textbox', { name: 'Program source' })
    .clear()
    .type(source, { parseSpecialCharSequences: false, delay: 0 });
  cy.findByRole('button', { name: 'Assemble & load' }).click();
}

function step(count = 1) {
  for (let index = 0; index < count; index += 1) {
    cy.findByRole('button', { name: 'Step' }).click();
  }
}

describe('From gates to an assembler', () => {
  it('Earns progress from a working construction and resumes with the next additive step', () => {
    cy.visit('/learn/path/buses');
    cy.get('.course-page')
      .should('have.attr', 'data-ready', 'true')
      .and('have.attr', 'data-task', 'not16');
    expectMainNavigation();
    cy.findByRole('button', { name: /^Continue/ }).should('not.exist');
    cy.findByRole('button', { name: 'Check my work' }).click();
    cy.findByRole('status').should('contain', 'Keep building.');
    cy.window().then((window) => {
      expect(
        JSON.parse(window.localStorage.getItem('chipsandcode.part-one.progress.v1') || '[]'),
      ).to.deep.equal([]);
    });
    cy.findByRole('combobox', { name: 'Construction view' }).select('code');
    const source = `CHIP Not16 { IN in[16]; OUT out[16]; PARTS:
${Array.from({ length: 16 }, (_, bit) => `Not(in=in[${bit}], out=out[${bit}]);`).join('\n')}
}`;
    cy.findByRole('textbox', { name: 'HDL source' })
      .clear()
      .type(source, { parseSpecialCharSequences: false, delay: 0 });
    cy.findByRole('button', { name: 'Check my work' }).click();
    cy.findByRole('status').should('contain', 'It works.');
    cy.window().then((window) => {
      expect(
        JSON.parse(window.localStorage.getItem('chipsandcode.part-one.progress.v1') || '[]'),
      ).to.deep.equal(['buses/not16']);
      expect(window.localStorage.getItem('chipsandcode.part-one.draft.buses/not16')).to.equal(
        source,
      );
    });
    cy.injectAxe();
    checkAccessibility();
    cy.findByRole('button', { name: /^Continue/ }).click();
    cy.get('.course-page').should('have.attr', 'data-task', 'and16');
    cy.findByRole('heading', { name: 'Combine two words' }).should('have.focus');
    cy.reload();
    cy.get('.course-page')
      .should('have.attr', 'data-ready', 'true')
      .and('have.attr', 'data-task', 'and16');
    cy.findByRole('button', { name: /^Continue/ }).should('not.exist');
    cy.findByRole('link', { name: /Computer path/ }).click();
    cy.findByRole('link', { name: /Work with words/ }).should('contain', '1 / 9');
  });

  it('Keeps visual and code construction synchronized and accessible on a small screen', () => {
    cy.viewport(320, 760);
    cy.visit('/learn/path/buses');
    cy.get('.course-page').should('have.attr', 'data-ready', 'true');
    cy.findByRole('textbox', { name: 'HDL source' }).should('not.exist');
    cy.findByRole('combobox', { name: 'Part to add' }).select('Not');
    cy.findByRole('button', { name: 'Add part' }).click();
    cy.findByRole('textbox', { name: 'Part 1 pin in input' }).type('in[0]', {
      parseSpecialCharSequences: false,
    });
    cy.findByRole('textbox', { name: 'Part 1 pin out output' }).type('out[0]', {
      parseSpecialCharSequences: false,
    });
    cy.injectAxe();
    checkAccessibility();
    expectNoPageOverflow();
    cy.findByRole('combobox', { name: 'Construction view' }).select('split');
    cy.findByRole('textbox', { name: 'HDL source' }).should(
      'contain.value',
      'Not(in=in[0], out=out[0]);',
    );
    expectNoPageOverflow();
    checkAccessibility();
    cy.screenshot('course-mobile-construction', { capture: 'fullPage' });
    cy.reload();
    cy.get('.course-page').should('have.attr', 'data-ready', 'true');
    cy.findByRole('textbox', { name: 'Part 1 pin in input' }).should('have.value', 'in[0]');
    cy.findByRole('textbox', { name: 'Part 1 pin out output' }).should('have.value', 'out[0]');
  });

  it('Stops a learner assembler that loops forever and lets them repair it', () => {
    cy.visit('/learn/path/assembler');
    cy.get('.course-page').should('have.attr', 'data-ready', 'true');
    cy.contains('summary', 'Steps in this layer').click();
    cy.findByRole('button', { name: 'Build your assembler' }).click();
    cy.findByRole('textbox', { name: 'Assembler source' })
      .clear()
      .type('function assemble(source) { while (true) {} }', { parseSpecialCharSequences: false });
    cy.findByRole('button', { name: 'Check my work' }).click();
    cy.findByRole('status', { timeout: 10000 }).should('contain', '4 seconds');
    cy.findByRole('button', { name: 'Check my work' }).should('be.enabled');
    cy.get('iframe[title="Isolated assembler verification"]').should('not.exist');
    cy.findByRole('textbox', { name: 'Assembler source' })
      .clear()
      .type('function assemble(source) { return ""; }', { parseSpecialCharSequences: false });
    cy.findByRole('button', { name: 'Check my work' }).click();
    cy.findByRole('status')
      .should('contain', 'Translation 1 differs')
      .and('not.contain', '4 seconds');
    cy.findByRole('button', { name: 'Check my work' }).should('be.enabled');
    cy.get('iframe[title="Isolated assembler verification"]').should('not.exist');
  });

  it('Assembles source and traces real register and memory changes', () => {
    visitComputer();
    expectMainNavigation();
    cy.findByTestId('register-pc').should('have.text', '0');
    step();
    cy.findByTestId('register-a').should('have.text', '7');
    cy.findByTestId('register-d').should('have.text', '0');
    step();
    cy.findByTestId('register-d').should('have.text', '7');
    step(2);
    cy.findByTestId('memory-0').should('have.text', '7');
    cy.findByTestId('register-pc').should('have.text', '4');
    cy.contains('summary', 'Last instruction').click();
    cy.contains('Memory[0] ← 7').should('be.visible');
    cy.findByRole('button', { name: 'Run' }).should('be.disabled');
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('computer-instruction-trace', { capture: 'fullPage' });
  });

  it('Resolves forward labels and variable symbols, then runs binary input', () => {
    visitComputer();
    writeProgram('@NEXT\n0;JMP\n@99\n(NEXT)\n@value\nM=1');
    cy.contains('summary', 'Symbol table').click();
    cy.findByRole('region', { name: 'Assembler symbols' }).within(() => {
      cy.contains('tr', 'NEXT').should('contain', '3');
      cy.contains('tr', 'value').should('contain', '16');
    });
    step(2);
    cy.findByTestId('register-pc').should('have.text', '3');
    step(2);
    cy.findByRole('textbox', { name: 'Memory start address' }).clear().type('16');
    cy.findByTestId('memory-16').should('have.text', '1');
    cy.findByRole('combobox', { name: 'Source format' }).select('binary');
    // @7, D=A, @0, M=D: a supplied machine program independent of this assembler.
    writeProgram('0000000000000111\n1110110000010000\n0000000000000000\n1110001100001000');
    cy.findByRole('button', { name: 'Run' }).click();
    cy.findByRole('textbox', { name: 'Memory start address' }).clear().type('0');
    cy.findByTestId('memory-0').should('have.text', '7');
    cy.contains('summary', 'Machine code').click();
    cy.findByRole('region', { name: 'Machine instructions' }).should('contain', '1110110000010000');
  });

  it('Rejects invalid source without keeping an executable stale program and preserves the draft', () => {
    visitComputer();
    writeProgram('@32768\nD=A');
    cy.findByRole('alert').should('be.visible');
    cy.findByRole('button', { name: 'Step' }).should('be.disabled');
    cy.findByRole('button', { name: 'Run' }).should('be.disabled');
    cy.contains('summary', 'Machine code').should('not.exist');
    cy.reload();
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    cy.findByRole('textbox', { name: 'Program source' }).should('have.value', '@32768\nD=A');
    cy.findByRole('alert').should('be.visible');
    cy.findByRole('combobox', { name: 'Source format' }).select('binary');
    writeProgram('101');
    cy.findByRole('alert').should('be.visible');
    cy.findByRole('button', { name: 'Run' }).should('be.disabled');
    cy.findByRole('combobox', { name: 'Source format' }).select('assembly');
    writeProgram('@9\nD=A\n@0\nM=D');
    cy.findByRole('button', { name: 'Run' }).click();
    cy.findByTestId('memory-0').should('have.text', '9');
    cy.findByRole('alert').should('not.exist');
  });

  it('Connects screen and keyboard devices to their memory-mapped addresses', () => {
    visitComputer();
    cy.contains('summary', 'Small examples').click();
    cy.findByRole('button', { name: 'Light 16 pixels' }).click();
    cy.findByRole('button', { name: 'Run' }).click();
    cy.findByRole('textbox', { name: 'Memory start address' }).clear().type('16384');
    cy.findByTestId('memory-16384').should('have.text', '65535');
    cy.get<HTMLCanvasElement>('.hack-screen canvas').should(($canvas) => {
      const context = $canvas[0].getContext('2d');
      expect(context, 'screen renderer').not.to.equal(null);
      expect(context!.getImageData(0, 0, 1, 1).data[0], 'first pixel is lit').to.be.lessThan(128);
      expect(context!.getImageData(15, 0, 1, 1).data[0], 'sixteenth pixel is lit').to.be.lessThan(
        128,
      );
      expect(
        context!.getImageData(16, 0, 1, 1).data[0],
        'next word remains clear',
      ).to.be.greaterThan(128);
    });
    cy.findByRole('textbox', { name: 'Memory start address' }).clear().type('24576');
    cy.findByTestId('memory-24576').should('have.text', '0');
    cy.findByRole('textbox', { name: 'Keyboard input' })
      .focus()
      .trigger('keydown', { key: 'ArrowLeft', code: 'ArrowLeft' });
    cy.findByTestId('memory-24576').should('have.text', '130');
    cy.findByRole('textbox', { name: 'Keyboard input' }).trigger('keyup', { key: 'ArrowLeft' });
    cy.findByTestId('memory-24576').should('have.text', '0');
    cy.findByRole('textbox', { name: 'Keyboard input' }).trigger('keydown', {
      key: 'F12',
      code: 'F12',
    });
    cy.findByTestId('memory-24576').should('have.text', '152');
    cy.findByRole('textbox', { name: 'Keyboard input' }).blur();
    cy.findByTestId('memory-24576').should('have.text', '0');
  });

  it('Compiles multi-bit HDL and removes stale output after an invalid input or definition', () => {
    cy.visit('/tools/chip-builder');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    expectMainNavigation();
    cy.findByTestId('chip-output-out').should('have.text', '65535');
    cy.findByRole('textbox', { name: 'Input in' }).clear().type('0x00ff');
    cy.findByTestId('chip-output-out').should('have.text', '65280');
    cy.findByRole('textbox', { name: 'Input in' }).clear().type('65536');
    cy.findByRole('alert').should('contain', '65535');
    cy.findByTestId('chip-output-out').should('have.text', '—');
    cy.findByRole('textbox', { name: 'Chip HDL' })
      .clear()
      .type('CHIP Invalid {', { parseSpecialCharSequences: false });
    cy.findByRole('button', { name: 'Compile' }).click();
    cy.findByRole('alert').should('be.visible');
    cy.findByTestId('chip-output-out').should('not.exist');
    cy.findByRole('button', { name: 'Tick' }).should('be.disabled');
  });

  it('Separates captured next state from committed register state across tick and tock', () => {
    cy.visit('/tools/chip-builder');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    cy.contains('summary', 'Inspect a supplied component').click();
    cy.findByRole('button', { name: 'Register' }).click();
    cy.findByRole('textbox', { name: 'Input in' }).clear().type('7');
    cy.findByRole('textbox', { name: 'Input load' }).clear().type('1');
    cy.findByTestId('chip-output-out').should('have.text', '0');
    cy.findByRole('button', { name: 'Tick' }).click();
    cy.findByTestId('chip-output-out').should('have.text', '0');
    cy.findByRole('button', { name: 'Tock' }).click();
    cy.findByTestId('chip-output-out').should('have.text', '7');
    cy.findByRole('textbox', { name: 'Input load' }).clear().type('0');
    cy.findByRole('textbox', { name: 'Input in' }).clear().type('12');
    cy.findByRole('button', { name: 'Tick' }).click();
    cy.findByRole('button', { name: 'Tock' }).click();
    cy.findByTestId('chip-output-out').should('have.text', '7');
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('clocked-chip-builder', { capture: 'fullPage' });
    cy.reload();
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    cy.findByRole('textbox', { name: 'Chip HDL' }).should('contain.value', 'Register(in=in');
    cy.findByRole('textbox', { name: 'Input load' }).should('exist');
  });

  it('Runs clocked TST scripts and reports real comparison failures', () => {
    cy.visit('/tools/chip-builder');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    cy.contains('summary', 'Inspect a supplied component').click();
    cy.findByRole('button', { name: 'Register' }).click();
    cy.contains('summary', 'Test scripts').click();
    const script =
      'output-list in%D1.6.1 load%B1.1.1 out%D1.6.1;\nset in 7, set load 1, eval, output;\ntick, output;\ntock, output;\nset in 9, set load 0, tick, tock, output;';
    const expected =
      '| in | load | out |\n| 7 | 1 | 0 |\n| 7 | 1 | 0 |\n| 7 | 1 | 7 |\n| 9 | 0 | 7 |';
    cy.findByRole('textbox', { name: 'TST script' })
      .clear()
      .type(script, { parseSpecialCharSequences: false, delay: 0 });
    cy.findByRole('textbox', { name: 'Expected output' }).type(expected, { delay: 0 });
    cy.findByRole('button', { name: 'Run tests' }).click();
    cy.contains('[role="status"]', '4 passed, 0 failed').should('be.visible');
    cy.findByTestId('chip-output-out').should('have.text', '7');
    cy.findByRole('textbox', { name: 'Actual test output' }).should('contain.value', 'out');
    cy.findByRole('textbox', { name: 'Expected output' })
      .clear()
      .type(expected.replace('| 7 | 1 | 0 |', '| 7 | 1 | 99 |'), { delay: 0 });
    cy.findByRole('button', { name: 'Run tests' }).click();
    cy.contains('[role="status"]', '3 passed, 1 failed').should('be.visible');
    cy.injectAxe();
    checkAccessibility();
  });

  it('Runs a ROM program through the clocked computer inside a compiled HDL circuit', () => {
    cy.visit('/tools/chip-builder');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    cy.contains('summary', 'Inspect a supplied component').click();
    cy.findByRole('button', { name: 'Computer' }).click();
    cy.contains('summary', 'ROM and keyboard').click();
    cy.findByRole('button', { name: 'Load ROM' }).click();
    cy.findByRole('button', { name: 'Inspect memory' }).click();
    cy.findByTestId('chip-memory-word').should('have.text', '0');
    for (let cycle = 0; cycle < 4; cycle += 1) {
      cy.findByRole('button', { name: 'Tick' }).click();
      cy.findByTestId('chip-memory-word').should('have.text', '0');
      cy.findByRole('button', { name: 'Tock' }).click();
    }
    cy.findByTestId('chip-memory-word').should('have.text', '7');
    cy.findByRole('button', { name: 'Reset' }).click();
    cy.findByTestId('chip-memory-word').should('have.text', '0');
  });

  it('Keeps the multi-bit builder keyboard accessible on a narrow screen', () => {
    cy.viewport(320, 760);
    cy.visit('/tools/chip-builder');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    expectNoPageOverflow();
    cy.injectAxe();
    checkAccessibility();
    cy.findByRole('combobox', { name: 'View' }).select('visual');
    cy.findByRole('textbox', { name: 'Chip HDL' }).should('not.exist');
    cy.findByRole('textbox', { name: 'Input in' }).clear().type('65535');
    cy.findByTestId('chip-output-out').should('have.text', '0');
    expectNoPageOverflow();
    checkAccessibility();
    cy.screenshot('chip-builder-mobile', { capture: 'fullPage' });
  });

  it('Keeps the computer workspace usable at 320 pixels in every view', () => {
    cy.viewport(320, 760);
    visitComputer();
    expectNoPageOverflow();
    cy.injectAxe();
    checkAccessibility();
    cy.findByRole('combobox', { name: 'View' }).select('visual');
    cy.findByRole('textbox', { name: 'Program source' }).should('not.exist');
    cy.findByRole('heading', { name: 'Machine state' }).should('be.visible');
    expectNoPageOverflow();
    cy.findByRole('combobox', { name: 'View' }).select('code');
    cy.findByRole('textbox', { name: 'Program source' }).should('be.visible');
    cy.findByRole('heading', { name: 'Machine state' }).should('not.exist');
    cy.contains('summary', 'Machine code').click();
    cy.findByRole('region', { name: 'Machine instructions' }).focus().should('be.focused');
    expectNoPageOverflow();
    checkAccessibility();
    cy.screenshot('computer-mobile-code', { capture: 'fullPage' });
  });
});

describe('The complete tool suite', () => {
  it('Executes VM stack commands and clears a stale machine when source becomes invalid', () => {
    cy.viewport(320, 760);
    cy.visit('/tools/vm');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    expectMainNavigation();
    cy.findByTestId('vm-current').should('contain', 'push constant 7');
    cy.findByRole('button', { name: 'Step' }).click();
    cy.findByTestId('vm-stack').find('strong').should('have.length', 1).and('have.text', '7');
    cy.findByRole('button', { name: 'Step' }).click();
    cy.findByTestId('vm-stack')
      .find('strong')
      .should('have.length', 2)
      .last()
      .should('have.text', '8');
    cy.findByRole('button', { name: 'Run' }).click();
    cy.findByTestId('vm-stack').find('strong').should('have.length', 1).and('have.text', '15');
    cy.findByRole('button', { name: 'Run' }).should('be.disabled');
    expectNoPageOverflow();
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('vm-mobile-stack', { capture: 'fullPage' });
    cy.findByRole('textbox', { name: 'Source code' }).clear().type('push imaginary 7');
    cy.findByRole('button', { name: 'Step' }).should('be.disabled');
    cy.findByTestId('vm-stack').should('contain', 'The stack is empty.');
    cy.findByRole('button', { name: 'Load program' }).click();
    cy.findByRole('alert').should('be.visible');
    cy.findByRole('button', { name: 'Run' }).should('be.disabled');
    cy.findByRole('textbox', { name: 'Source code' })
      .clear()
      .type('push constant 7\npush constant 8\nadd\npop temp 0', { delay: 0 });
    cy.findByRole('button', { name: 'Load program' }).click();
    cy.findByRole('button', { name: 'Run' }).click();
    cy.contains('summary', 'Inspect memory').click();
    cy.findByRole('textbox', { name: 'Memory address' }).clear().type('5');
    cy.findByRole('button', { name: 'Read memory' }).click();
    cy.findByTestId('vm-memory').should('have.text', '15');
    cy.findByRole('alert').should('not.exist');
    cy.findByRole('button', { name: 'Reset' }).click();
    cy.findByTestId('vm-memory').should('have.text', '0');
  });

  it('Compiles multiple Jack classes and runs their transferred VM code', () => {
    cy.viewport(320, 760);
    cy.visit('/tools/compiler');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    expectMainNavigation();
    cy.findByRole('button', { name: 'Compile Jack' }).click();
    cy.findByRole('textbox', { name: 'Generated VM' }).should(
      'contain.value',
      'function Main.main',
    );
    cy.findByRole('textbox', { name: 'Source code' })
      .clear()
      .type('class Main {', { parseSpecialCharSequences: false });
    cy.findByRole('textbox', { name: 'Generated VM' }).should('have.value', '');
    cy.findByRole('button', { name: 'Open in VM emulator' }).should('be.disabled');
    cy.findByRole('button', { name: 'Compile Jack' }).click();
    cy.findByRole('alert').should('contain', 'Main.jack');
    cy.findByRole('textbox', { name: 'Source code' })
      .clear()
      .type(
        'class Main { function void main() { do Memory.poke(100, Helper.twice(21)); return; } }',
        { parseSpecialCharSequences: false, delay: 0 },
      );
    cy.contains('summary', 'Project files').click();
    cy.findByRole('textbox', { name: 'New file name' }).type('Helper.jack');
    cy.findByRole('button', { name: 'Add file' }).click();
    cy.findByRole('textbox', { name: 'Source code' }).type(
      'class Helper { function int twice(int value) { return value + value; } }',
      { parseSpecialCharSequences: false, delay: 0 },
    );
    cy.findByRole('button', { name: 'Compile Jack' }).click();
    cy.findByRole('combobox', { name: 'VM output file' }).select('Main.vm');
    cy.findByRole('textbox', { name: 'Generated VM' }).should(
      'contain.value',
      'call Helper.twice 1',
    );
    cy.findByRole('alert').should('not.exist');
    expectNoPageOverflow();
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('compiler-mobile-project', { capture: 'fullPage' });
    cy.findByRole('button', { name: 'Open in VM emulator' }).click();
    cy.location('pathname').should('eq', '/tools/vm');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    cy.findByRole('combobox', { name: 'Source file' }).select('Main.vm');
    cy.findByRole('textbox', { name: 'Source code' }).should(
      'contain.value',
      'call Helper.twice 1',
    );
    cy.reload();
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    cy.findByRole('combobox', { name: 'Source file' }).select('Main.vm');
    cy.findByRole('textbox', { name: 'Source code' }).should(
      'contain.value',
      'call Helper.twice 1',
    );
    cy.findByRole('combobox', { name: 'Source file' }).find('option').should('have.length', 2);
    cy.findByRole('button', { name: 'Run' }).click();
    cy.contains('p[role="status"]', 'Program finished.', { timeout: 10000 }).should('be.visible');
    cy.contains('summary', 'Inspect memory').click();
    cy.findByRole('textbox', { name: 'Memory address' }).clear().type('100');
    cy.findByRole('button', { name: 'Read memory' }).click();
    cy.findByTestId('vm-memory').should('have.text', '42');
  });

  it('Edits accessible bitmap pixels and executes the generated drawing code', () => {
    cy.viewport(320, 760);
    cy.visit('/tools/bitmap');
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    expectMainNavigation();
    cy.findByRole('button', { name: 'Pixel 0, 0 off' }).focus().type(' ');
    cy.findByRole('button', { name: 'Pixel 0, 0 on' }).should('have.attr', 'aria-pressed', 'true');
    cy.findByRole('button', { name: 'Pixel 0, 0 on' }).type('{enter}');
    cy.findByRole('button', { name: 'Pixel 0, 0 off' }).should('have.attr', 'aria-pressed', 'false');
    cy.findByRole('button', { name: 'Pixel 0, 0 off' }).type('{enter}');
    cy.findByRole('button', { name: 'Pixel 0, 0 on' }).should('have.attr', 'aria-pressed', 'true');
    cy.findByRole('textbox', { name: 'Generated bitmap code' }).should(
      'contain.value',
      'Memory.poke(16384, 1)',
    );
    cy.findByRole('button', { name: 'Pixel 0, 0 on' }).type(' ');
    cy.findByRole('button', { name: 'Pixel 15, 0 off' }).focus().type(' ');
    cy.findByRole('textbox', { name: 'Generated bitmap code' }).should(
      'contain.value',
      'Memory.poke(16384, ~32767)',
    );
    cy.findByRole('button', { name: 'Pixel 0, 1 off' }).focus().type(' ');
    cy.findByRole('combobox', { name: 'Export' }).select('words');
    cy.findByRole('textbox', { name: 'Generated bitmap code' })
      .should('contain.value', '16384: 32768')
      .and('contain.value', '16416: 1');
    cy.contains('summary', 'Screen position').click();
    cy.findByRole('textbox', { name: 'X' }).clear().type('512');
    cy.findByRole('alert').should('be.visible');
    cy.findByRole('textbox', { name: 'Generated bitmap code' }).should('have.value', '');
    cy.findByRole('button', { name: 'Download code' }).should('be.disabled');
    cy.findByRole('textbox', { name: 'X' }).clear().type('0');
    cy.findByRole('alert').should('not.exist');
    expectNoPageOverflow();
    cy.injectAxe();
    checkAccessibility();
    cy.screenshot('bitmap-mobile-drawing', { capture: 'fullPage' });
    cy.reload();
    cy.get('.machine-lab').should('have.attr', 'data-ready', 'true');
    cy.findByRole('button', { name: 'Pixel 15, 0 on' }).should('have.attr', 'aria-pressed', 'true');
    cy.findByRole('button', { name: 'Pixel 0, 1 on' }).should('have.attr', 'aria-pressed', 'true');
    cy.findByRole('combobox', { name: 'Export' }).select('assembly');
    cy.findByRole('textbox', { name: 'Generated bitmap code' })
      .invoke('val')
      .then((source) => {
        visitComputer();
        writeProgram(String(source));
        cy.findByRole('button', { name: 'Run' }).click();
        cy.findByRole('textbox', { name: 'Memory start address' }).clear().type('16384');
        cy.findByTestId('memory-16384').should('have.text', '32768');
        cy.findByRole('textbox', { name: 'Memory start address' }).clear().type('16416');
        cy.findByTestId('memory-16416').should('have.text', '1');
        cy.get<HTMLCanvasElement>('.hack-screen canvas').should(($canvas) => {
          const context = $canvas[0].getContext('2d');
          expect(context!.getImageData(0, 0, 1, 1).data[0], 'bit 0 is clear').to.be.greaterThan(
            128,
          );
          expect(context!.getImageData(15, 0, 1, 1).data[0], 'bit 15 is lit').to.be.lessThan(128);
          expect(
            context!.getImageData(0, 1, 1, 1).data[0],
            'next screen row is lit',
          ).to.be.lessThan(128);
        });
      });
  });
});

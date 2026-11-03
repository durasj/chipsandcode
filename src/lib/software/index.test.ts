import { afterEach, describe, expect, it, vi } from 'vitest';
import { compileJack, createVM, SoftwareError } from './index';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('Reference-backed Jack compiler', () => {
  it('compiles and executes constructors, methods, arrays, loops, strings and native OS services across files', () => {
    const result = compileJack({
      'Counter.jack': `class Counter {
        field int value;
        constructor Counter new(int start) { let value = start; return this; }
        method void inc() { let value = value + 1; return; }
        method int get() { return value; }
      }`,
      'Main.jack': `class Main {
        function void main() {
          var Counter counter;
          var Array values;
          var int i, total;
          let counter = Counter.new(7);
          do counter.inc();
          let values = Array.new(3);
          let values[1] = counter.get();
          let total = 0;
          let i = 0;
          while (i < 3) { let total = total + values[1]; let i = i + 1; }
          if (total = 24) { do Memory.poke(1000, total); }
          else { do Memory.poke(1000, 99); }
          do Output.printString("Hi");
          do Screen.setColor(true);
          do Screen.drawPixel(10, 10);
          do Memory.poke(1001, Keyboard.keyPressed());
          do values.dispose();
          return;
        }
      }`,
    });
    expect(result.errors).toEqual([]);
    expect(Object.keys(result.files)).toEqual(['Counter.vm', 'Main.vm']);
    expect(result.files['Counter.vm']).toContain('call Memory.alloc 1');
    expect(result.files['Main.vm']).toContain('call Counter.inc 1');
    const vm = createVM(result.files);
    vm.setKeyboard(65);
    vm.run(2000);
    expect(vm.halted).toBe(true);
    expect(vm.read(1000)).toBe(24);
    expect(vm.read(1001)).toBe(65);
    expect(vm.screen).toHaveLength(8192);
    expect(vm.screen[320] & (1 << 10)).toBe(1 << 10);
    expect(vm.screen.slice(0, 256).some(Boolean)).toBe(true);
    vm.dispose();
  });
  it('reports original file and line for syntax and semantic errors without retaining partial compiled output', () => {
    const syntax = compileJack({
      'Main.jack': 'class Main {\n function void main( { return; }\n}',
    });
    expect(syntax.errors[0]).toMatchObject({ file: 'Main.jack', line: 2 });
    expect(syntax.errors[0].column).toBeGreaterThan(1);
    expect(syntax.files).toEqual({});
    const semantic = compileJack({
      Other: 'class Other { function int valid() { return 1; } }',
      Main: 'class Main { function void main() { let missing = 5; return; } }',
    });
    expect(semantic.errors[0].message).toContain('Undeclared variable');
    expect(semantic.files).toEqual({});
    expect(
      compileJack({ Main: 'class Wrong { function void main() { return; } }' }).errors[0].message,
    ).toContain("doesn't match");
  });
  it('validates file names, duplicate classes and bounded project sizes', () => {
    expect(compileJack({}).errors[0].message).toContain('Add a Jack class');
    expect(compileJack({ '../Main.jack': '' }).errors[0].message).toContain('class filename');
    expect(compileJack({ Main: '', 'Main.jack': '' }).errors[0].message).toContain(
      'more than once',
    );
    expect(compileJack({ Main: ' '.repeat(1_000_001) }).errors[0].message).toContain('one million');
    expect(
      compileJack(Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`File${i}`, ''])))
        .errors[0].message,
    ).toContain('100 source files');
  });
});

describe('Reference-backed VM emulator', () => {
  it('steps arithmetic with signed 16-bit values and exposes instruction, segments and stack', () => {
    const vm = createVM({
      Main: 'push constant 7\npush constant 8\nadd\npush constant 15\neq\nnot\npush constant 2\nsub\nneg',
    });
    expect(vm.current).toMatchObject({ file: 'Main.vm', line: 1, command: 'push constant 7' });
    expect(vm.segments.SP).toBe(256);
    expect(vm.callStack).toEqual(['__implicit']);
    vm.step();
    expect(vm.stack).toEqual([7]);
    vm.step();
    expect(vm.stack).toEqual([7, 8]);
    vm.step();
    expect(vm.stack).toEqual([15]);
    vm.run(100);
    expect(vm.stack).toEqual([2]);
    expect(vm.halted).toBe(true);
    expect(vm.current).toBeNull();
    const count = vm.cycles;
    vm.step();
    expect(vm.cycles).toBe(count);
    vm.reset();
    expect(vm.cycles).toBe(0);
    expect(vm.stack).toEqual([]);
    vm.run(0);
    expect(vm.cycles).toBe(0);
    vm.dispose();
    expect(vm.halted).toBe(true);
  });
  it('runs every segment and function-scoped branching/call/return with independent file statics', () => {
    const vm = createVM({
      'Sys.vm': `function Sys.init 0
        push constant 7
        call Worker.twice 1
        pop temp 0
        push constant 11
        pop static 0
        push static 0
        pop temp 1
        push constant 0
        call Sys.halt 0`,
      'Worker.vm': `function Worker.twice 1
        push argument 0
        pop local 0
        push constant 3000
        pop pointer 0
        push constant 3010
        pop pointer 1
        push local 0
        pop this 2
        push this 2
        pop that 3
        push that 3
        push constant 2
        call Math.multiply 2
        pop static 0
        push static 0
        push constant 14
        eq
        if-goto CORRECT
        push constant 99
        goto END
        label CORRECT
        push static 0
        label END
        return`,
    });
    vm.run(100);
    expect(vm.halted).toBe(true);
    expect(vm.read(5)).toBe(14);
    expect(vm.read(6)).toBe(11);
    expect(vm.read(3002)).toBe(7);
    expect(vm.read(3013)).toBe(7);
    expect(vm.segments.THIS).toBe(0);
    vm.dispose();
  });
  it('rejects VM syntax, invalid names, duplicate definitions and bad calls', () => {
    expect(() => createVM({})).toThrow('Add a VM file');
    expect(() => createVM({ 'bad/name.vm': '' })).toThrow(SoftwareError);
    expect(() => createVM({ Main: 'invalid instruction' })).toThrow(SoftwareError);
    expect(() => createVM({ Main: 'function Other.f 0\nreturn' })).toThrow("doesn't match");
    expect(() => createVM({ Main: 'call Missing.f 0' })).toThrow('Undefined function');
    expect(() => createVM({ Main: 'call Math.multiply 1' })).toThrow('expects');
    expect(() => createVM({ Main: 'pop pointer 2' })).toThrow();
  });
  it('reports runtime failures at their source line and can reset afterward', () => {
    const vm = createVM({ Main: '// input\npop temp 0' });
    expect(() => vm.step()).toThrow('Main.vm:2:');
    expect(vm.halted).toBe(true);
    vm.reset();
    expect(vm.halted).toBe(false);
    vm.dispose();
  });
  it('validates memory editing, run bounds and keyboard input', () => {
    const vm = createVM({ Main: 'push constant 1' });
    vm.write(100, -1);
    expect(vm.read(100)).toBe(-1);
    vm.setKeyboard(130);
    expect(vm.read(24576)).toBe(130);
    expect(() => vm.write(24576, 0)).toThrow('read-only');
    for (const invalid of [-1, 24577, 0.5, NaN])
      expect(() => vm.read(invalid)).toThrow('memory address');
    for (const invalid of [-32769, 65536, 0.5, NaN])
      expect(() => vm.write(0, invalid)).toThrow('16-bit');
    for (const invalid of [-1, 32768, 0.5, NaN])
      expect(() => vm.setKeyboard(invalid)).toThrow('Keyboard code');
    for (const invalid of [-1, 100001, 0.5, NaN])
      expect(() => vm.run(invalid)).toThrow('VM operations');
    vm.dispose();
  });
  it('yields for Sys.wait and cancels pending timers on reset and disposal', () => {
    vi.useFakeTimers();
    const vm = createVM({ Main: 'push constant 10\ncall Sys.wait 1\npush constant 9\npop temp 0' });
    vm.run(10);
    expect(vm.blocked).toBe(true);
    const cycles = vm.cycles;
    vm.step();
    expect(vm.cycles).toBe(cycles);
    vi.advanceTimersByTime(10);
    expect(vm.blocked).toBe(false);
    vm.run(10);
    expect(vm.read(5)).toBe(9);
    vm.reset();
    vm.run(10);
    expect(vi.getTimerCount()).toBe(1);
    vm.reset();
    expect(vi.getTimerCount()).toBe(0);
    vm.run(10);
    vm.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('clears only the screen and reports OS errors for pixels beyond either screen edge', () => {
    const vm = createVM({ Main: 'call Screen.clearScreen 0' });
    vm.write(9000, 123);
    vm.write(16384, -1);
    vm.write(24575, -1);
    vm.setKeyboard(65);
    vm.run(10);
    expect(vm.read(9000)).toBe(123);
    expect(vm.read(24576)).toBe(65);
    expect(vm.screen).toHaveLength(8192);
    expect(vm.screen.every((value) => value === 0)).toBe(true);
    vm.dispose();
    for (const [x, y] of [
      [512, 0],
      [0, 256],
    ]) {
      const invalid = createVM({
        Main: `push constant ${x}\npush constant ${y}\ncall Screen.drawPixel 2`,
      });
      expect(() => invalid.run(10)).toThrow('Main.vm:3: Jack OS stopped with error');
      expect(invalid.halted).toBe(true);
      invalid.dispose();
    }
  });
  it('resumes Keyboard.readChar only after release and cancels animation frames when disposed', async () => {
    let id = 0;
    const frames = new Map<number, FrameRequestCallback>();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (frame: number) => frames.delete(frame));
    const tick = () => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(0));
    };
    const vm = createVM({ Main: 'call Keyboard.readChar 0\npop temp 0' });
    vm.run(10);
    expect(vm.blocked).toBe(true);
    expect(frames.size).toBe(1);
    vm.setKeyboard(65);
    tick();
    await Promise.resolve();
    expect(vm.blocked).toBe(true);
    vm.setKeyboard(0);
    tick();
    await Promise.resolve();
    expect(vm.blocked).toBe(false);
    vm.run(10);
    expect(vm.read(5)).toBe(65);
    expect(frames.size).toBe(0);
    vm.reset();
    vm.run(10);
    expect(frames.size).toBe(1);
    vm.reset();
    expect(frames.size).toBe(0);
    vm.run(10);
    vm.dispose();
    expect(frames.size).toBe(0);
  });
});

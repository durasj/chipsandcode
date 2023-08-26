import { vi, describe, expect, it } from 'vitest';

const sideEffectImports = [
  'monaco-editor/esm/vs/editor/editor.all.js',

  'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js',
  'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js',
  'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js',
  'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js',
  'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js',
  'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js',
  'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js',
];

const sideEffectImport = vi.fn();
const worker = vi.fn();
const defineTheme = vi.fn();
const registerLanguage = vi.fn();
const setMonarchTokensProvider = vi.fn();
sideEffectImports.forEach((path) => {
  vi.doMock(path, () => {
    sideEffectImport(path);

    return { default: path };
  });
});
vi.doMock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: { defineTheme },
  languages: { register: registerLanguage, setMonarchTokensProvider },
}));
vi.doMock('monaco-editor/esm/vs/editor/editor.worker?worker', () => ({ default: worker }));

const self = {} as { MonacoEnvironment: { getWorker: () => typeof worker } };
vi.stubGlobal('self', self);

describe('Monaco Initialization', () => {
  it('Registers worker and custom themes and languages', async () => {
    await import('./index');

    expect(sideEffectImport).toHaveBeenCalledTimes(sideEffectImports.length);

    expect(self.MonacoEnvironment).toMatchObject({
      getWorker: expect.any(Function),
    });

    expect(defineTheme).toBeCalledWith('vs-light', expect.any(Object));
    expect(defineTheme).toBeCalledWith('vs-dark', expect.any(Object));

    expect(registerLanguage).toBeCalledWith({ id: 'hdl' });
    expect(setMonarchTokensProvider).toBeCalledWith('hdl', expect.any(Object));

    expect(registerLanguage).toBeCalledWith({ id: 'tst' });
    expect(setMonarchTokensProvider).toBeCalledWith('tst', expect.any(Object));
  });
});

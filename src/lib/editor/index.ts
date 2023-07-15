import 'monaco-editor/esm/vs/editor/editor.all.js';

import 'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

import registerThemes from './themes';
import registerHdlLanguage from './hdl/registerHdlLanguage';
import registerTstLanguage from './tst/registerTstLanguage';

self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
  // @ts-ignore TODO: Remove once we update monaco editor - 0.40.0 fixes this but breaks accessibilityHelp
  createTrustedTypesPolicy: undefined,
};

registerThemes();
registerHdlLanguage();
registerTstLanguage();

export { monaco };

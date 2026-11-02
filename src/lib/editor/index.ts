import './contributions.js';

import * as monaco from 'monaco-editor/editor/editor.api.js';

import EditorWorker from 'monaco-editor/editor/editor.worker?worker';

import registerThemes from './themes';
import registerHdlLanguage from './hdl/registerHdlLanguage';
import registerTstLanguage from './tst/registerTstLanguage';

self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

registerThemes();
registerHdlLanguage();
registerTstLanguage();

export { monaco };

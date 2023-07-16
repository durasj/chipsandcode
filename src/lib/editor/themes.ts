import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Registers themes "vs-light" and "vs-dark" on global monaco editor instance
 */
function registerThemes() {
  Monaco.editor.defineTheme('vs-light', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#f5f5f4',
    },
  });

  Monaco.editor.defineTheme('vs-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#171717',
    },
  });
}

export default registerThemes;

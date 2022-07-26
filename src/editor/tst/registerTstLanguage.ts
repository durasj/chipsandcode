import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Registers language "tst" on global monaco editor instance
 */
function registerTstLanguage(): void {
  Monaco.languages.register({ id: 'tst' });
  Monaco.languages.setMonarchTokensProvider('tst', {
    defaultToken: '',

    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },

    brackets: [
      {
        open: '{',
        close: '}',
        token: 'delimiter.curly',
      },
      {
        open: '[',
        close: ']',
        token: 'delimiter.square',
      },
      {
        open: '(',
        close: ')',
        token: 'delimiter.parenthesis',
      },
    ],
    autoClosingPairs: [{ open: '{', close: '}' }],
    surroundingPairs: [{ open: '{', close: '}' }],

    keywords: ['load', 'output-file', 'compare-to', 'output-list', 'set', 'eval', 'output'],

    tokenizer: {
      root: [
        // keywords
        [
          /[a-zA-Z0-9_-]+/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'entity',
            },
          },
        ],

        { include: '@whitespace' },
        [/[{}()[\]]/, '@brackets'],
      ],

      numbers: [[/\d+/, 'number']],

      whitespace: [
        [/[ \t\r\n]+/, ''],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],

      comment: [
        [/[^/*]+/, 'comment'],
        [/\/\*/, 'comment', '@push'], // nested comment
        ['\\*/', 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
    },
  });
}

export default registerTstLanguage;

import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * Registers language "hdl" on global monaco editor instance
 */
function registerHdlLanguage(): void {
  Monaco.languages.register({ id: 'hdl' });
  Monaco.languages.setMonarchTokensProvider('hdl', {
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

    keywords: ['CHIP', 'IN', 'OUT', 'BUILTIN', 'PARTS', 'CLOCKED'],

    // TODO: Provide a proper list and actually use it
    builtin_gates: ['AND', 'NAND', 'NOR', 'OR', 'XOR', 'XNOR', 'NOT'],

    operators: ['='],

    identifier: /(?:[a-zA-Z_][a-zA-Z0-9_.]*|\\\S+ )/,

    tokenizer: {
      root: [
        // keywords or entities (chip names)
        // TODO: Chip names start with uppercase letter only by convention
        [
          /[A-Z][a-zA-Z0-9_.]*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'entity',
            },
          },
        ],

        // Identifiers are classified as type for styling only
        // TODO: Does this influence accessibility?
        [/[a-zA-Z_][a-zA-Z0-9_.]*/, 'type'],

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

export default registerHdlLanguage;

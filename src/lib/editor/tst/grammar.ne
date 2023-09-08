@{%
  import moo from 'moo';
  const lexer = moo.compile({
    semicolon:      ';',
    colon:          ':',
    comma:          ',',
    equals:         '=',
    format: {
      match: /%[BXDS][0-9]+\.[1-9][0-9]*\.[0-9]+/,
      value: f => [f[1], ...f.substr(2).split('.').map(Number)],
    },
    identifier: {
      match: /[a-zA-Z_][a-zA-Z0-9-_\.]*/,
      type: moo.keywords({
        keyword: ['load', 'output-file', 'compare-to', 'output-list', 'set', 'eval', 'output'],
      }),
    },
    decimalValue: { match: /\d+/, value: (v) => +v },
    // TODO: Add support for X, D, S values
    binaryValue: {
      match: /%B[01]+/,
      value: f => ({ type: 'value', format: 'binary', value: f.substr(2).split('').map(Boolean)}),
    },
    whiteSpace:     { match: /\s+/, lineBreaks: true },
    comment:        { match: /\/\/[^\n]*/, value: c => c.slice(2) },
    commentBlock:   { match: /\/\*[\s\S]*?\*\//, lineBreaks: true, value: c => c.slice(2, -2) }
  });

  const getIdentifier = ({ value, col, line, lineBreaks, offset }) =>
    ({ value, col, line, lineBreaks, offset });
%}

@lexer lexer

main ->
      _ preamble _          {% ([, preamble]) => ({ type: 'script', preamble, cases: [] }) %}
    | _ cases _             {% ([, cases]) => ({ type: 'script', preamble: [], cases }) %}
    | _ preamble _ cases _  {% ([, preamble, , cases]) => ({ type: 'script', preamble, cases }) %}

preamble ->
      preambleInstruction _ ";"             {% ([instruction]) => [instruction] %}
    | preambleInstruction _ "," _ preamble  {% ([instruction, , , , acc]) => ([instruction, ...acc]) %}

preambleInstruction ->
      "load" _ %identifier          {% ([, , file]) => ({ type: 'load', file: getIdentifier(file) }) %}
    | "output-file" _ %identifier   {% ([, , file]) => ({ type: 'output', file: getIdentifier(file) }) %}
    | "compare-to" _ %identifier    {% ([, , file]) => ({ type: 'compare', file: getIdentifier(file) }) %}
    | "output-list" _ outputList    {% ([, , outputs]) => ({ type: 'outputList', outputs }) %}

outputList ->
      outputSpec                {% ([spec]) => [spec] %}
    | outputSpec _ outputList   {% ([spec, , acc]) => ([spec, ...acc]) %}

outputSpec ->
      %identifier               {% ([name]) => ({ type: 'outputSpec', name: getIdentifier(name) }) %}
    | %identifier %format       {% ([name, f]) => ({ type: 'outputSpec', name: getIdentifier(name), format: f.value[0], length: f.value[2], padLeft: f.value[1], padRight: f.value[3] }) %}

cases ->
      caseSpec _ ";"            {% ([instructions]) => [instructions] %}
    | caseSpec _ ";" _ cases    {% ([instructions, , , , acc]) => ([instructions, ...acc]) %}

caseSpec ->
      caseInstruction                   {% ([instruction]) => [instruction] %}
    | caseInstruction _ "," _ caseSpec  {% ([instruction, , , , acc]) => ([instruction, ...acc]) %}

value ->
      %decimalValue {% id %}
    | %binaryValue  {% id %}

caseInstruction ->
      "set" _ %identifier _ value   {% ([kw, , name, , value]) => ({ type: 'set', name: getIdentifier(name), value: value.value, col: kw.col, line: kw.line }) %}
    | "eval"                        {% ([kw]) => ({ type: 'eval', col: kw.col, line: kw.line }) %}
    | "output"                      {% ([kw]) => ({ type: 'output', col: kw.col, line: kw.line }) %}

# Space and comments
_ ->
      optionalWhiteSpace           {% id %}
    | optionalWhiteSpace comment _ {% ([, comment]) => comment %}
optionalWhiteSpace ->
      null  {% id %}
    | %whiteSpace   {% () => null %}
comment ->
      %comment      {% ([content]) => ({ type: 'comment', content }) %}
    | %commentBlock {% ([content]) => ({ type: 'comment', content }) %}

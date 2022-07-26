@{%
    import moo from 'moo';
    const lexer = moo.compile({
        leftBrace:      '{',
        rightBrace:     '}',
        leftParen:      '(',
        rightParen:     ')',
        leftBracket:    '[',
        rightBracket:   ']',
        semicolon:      ';',
        colon:          ':',
        comma:          ',',
        equals:         '=',
        percent:        '%',
        format:         { match: /[BXDS][0-9]+.[1-9][0-9]*.[0-9]+/, value: f => [f[0], ...f.substr(1).split('.').map(Number)] },
        identifier:     { match: /[a-zA-Z_][a-zA-Z0-9-_\.]*/, type: moo.keywords({
          keyword: ['load', 'output-file', 'compare-to', 'output-list', 'set', 'eval', 'output'],
        }) },
        value:          { match: /[01]/, value: (v) => v === '1' },
        whiteSpace:     { match: /\s+/, lineBreaks: true },
        comment:        { match: /\/\/[^\n]*/, value: c => c.slice(2) },
        commentBlock:   { match: /\/\*[\s\S]*?\*\//, lineBreaks: true, value: c => c.slice(2, -2) }
    });
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
      "load" _ %identifier          {% ([, , file]) => ({ type: 'load', file }) %}
    | "output-file" _ %identifier   {% ([, , file]) => ({ type: 'output', file }) %}
    | "compare-to" _ %identifier    {% ([, , file]) => ({ type: 'compare', file }) %}
    | "output-list" _ outputList    {% ([, , outputs]) => ({ type: 'outputList', outputs }) %}

outputList ->
      outputSpec                {% ([spec]) => [spec] %}
    | outputSpec _ outputList   {% ([spec, , acc]) => ([spec, ...acc]) %}

outputSpec ->
      %identifier               {% ([name]) => ({ type: 'outputSpec', name }) %}
    | %identifier "%" %format   {% ([name, , f]) => ({ type: 'outputSpec', name, format: f.value[0], length: f.value[2], padLeft: f.value[1], padRight: f.value[3] }) %}

cases ->
      caseSpec _ ";"            {% ([instructions]) => [instructions] %}
    | caseSpec _ ";" _ cases    {% ([instructions, , , , acc]) => ([instructions, ...acc]) %}

caseSpec ->
      caseInstruction                   {% ([instruction]) => [instruction] %}
    | caseInstruction _ "," _ caseSpec  {% ([instruction, , , , acc]) => ([instruction, ...acc]) %}

caseInstruction ->
      "set" _ %identifier _ %value  {% ([kw, , name, , value]) => ({ type: 'set', name, value: value.value, col: kw.col, line: kw.line }) %}
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

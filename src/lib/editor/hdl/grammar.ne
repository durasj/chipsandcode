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
        keyword:        ['CHIP', 'IN', 'OUT', 'PARTS', 'BUILTIN', 'CLOCKED'],
        identifier:     /[a-zA-Z_][a-zA-Z0-9_\.]*/,
        number:         /\d+/,
        whiteSpace:     { match: /\s+/, lineBreaks: true },
        comment:        { match: /\/\/[^\n]*/, value: c => c.slice(2) },
        commentBlock:   { match: /\/\*[\s\S]*?\*\//, lineBreaks: true, value: c => c.slice(2, -2) }
    });
%}

@lexer lexer

main ->
      _ chip _     {% ([, stm]) => [stm] %}
    | _ chip main  {% ([, stm, acc]) => ([stm, ...acc]) %}

chip ->
    "CHIP" _ %identifier _ %leftBrace chipBody %rightBrace {% ([, , name, , , body]) => ({ type: 'chip', name, body }) %}
chipBody ->
      _ in _ %semicolon _              {% ([, id]) => [id] %}
    | _ in _ %semicolon chipBody       {% ([, id, , , acc]) => [id, ...acc] %}
    | _ out _ %semicolon _             {% ([, id]) => [id] %}
    | _ out _ %semicolon chipBody      {% ([, id, , , acc]) => [id, ...acc] %}
    | _ parts _                 {% ([, id]) => [id] %}
    | _ parts chipBody          {% ([, id, acc]) => [id, ...acc] %}
    # TODO: Add back once these are supported by Hardware Simulator
    # | _ builtIn _ %semicolon _         {% ([, id]) => [id] %}
    # | _ builtIn _ %semicolon chipBody  {% ([, id, , , acc]) => [id, ...acc] %}
    # | _ clocked _ %semicolon _         {% ([, id]) => [id] %}
    # | _ clocked _ %semicolon chipBody  {% ([, id, , , acc]) => [id, ...acc] %}

in ->
      "IN"              {% () => ({ type: 'input', pins: [] }) %}
    | "IN" _ pinList    {% ([, , pins]) => ({ type: 'input', pins }) %}

out ->
      "OUT"             {% () => ({ type: 'output', pins: [] }) %}
    | "OUT" _ pinList   {% ([, , pins]) => ({ type: 'output', pins }) %}

parts -> "PARTS" _ %colon _ statementList {% ([, , , , id]) => ({ type: 'parts', statements: id }) %}
statementList ->
      %identifier _ %leftParen _ pinConnections _ %rightParen _ %semicolon                     {% ([chip, , , , connections]) => [{ type: 'statement', chip, connections }] %}
    | %identifier _ %leftParen _ pinConnections _ %rightParen _ %semicolon _ statementList     {% ([chip, , , , connections, , , , , , acc]) => [{ type: 'statement', chip, connections }, ...acc] %}

builtIn -> "BUILTIN" _ %identifier {% ([, , id]) => ({ type: 'builtin', template: id }) %}

clocked ->
      "CLOCKED"             {% () => ({ type: 'clocked', pins: [] }) %}
    | "CLOCKED" _ pinList   {% ([, , pins]) => ({ type: 'clocked', pins }) %}

pinList ->
      %identifier                   {% ([pin]) => [pin] %}
    | %identifier _ %comma _ pinList   {% ([pin, , , , acc]) => ([pin, ...acc]) %}
pinConnections ->
      %identifier _ %equals _ %identifier                           {% ([left, , , , right]) => [{ type: 'assignment', left, right }] %}
    | %identifier _ %equals _ %identifier _ %comma _ pinConnections    {% ([left, , , , right, , , , acc]) => [{ type: 'assignment', left, right }, ...acc] %}

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

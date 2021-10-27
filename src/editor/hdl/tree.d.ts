export type Root = ChipNode[];

export interface ChipNode extends Node<'chip'> {
  name: IdentifierNode;
  body: Array<ChipIONode | ChipPartsNode>;
}

export interface ChipIONode extends Node<'input' | 'output'> {
  pins: IdentifierNode[];
}

export interface ChipPartsNode extends Node<'parts'> {
  statements: ChipStatementNode[];
}

export interface ChipStatementNode extends Node<'statement'> {
  chip: string;
  connections: AssignmentNode[];
}

export interface ChipBuiltInNode extends Node<'builtin'> {
  template: IdentifierNode;
}

export interface ChipClockedNode extends Node<'clocked'> {
  pins: IdentifierNode[];
}

export interface AssignmentNode extends Node<'assignment'> {
  left: IdentifierNode;
  right: IdentifierNode;
}

export interface IdentifierNode extends Node<'identifier'> {
  value: string;
  line: number;
  col: number;
}

export interface Node<type extends string> {
  type: type;
}

export interface Root extends Node<'script'> {
  preamble: (LoadNode | OutputFileNode | CompareNode | OutputListNode)[];
  cases: (SetNode | EvalNode | OutputNode)[][];
}

export interface LoadNode extends Node<'load'> {
  file: IdentifierNode;
}

export interface OutputFileNode extends Node<'output'> {
  file: IdentifierNode;
}

export interface CompareNode extends Node<'compare'> {
  file: IdentifierNode;
}

export interface OutputListNode extends Node<'outputList'> {
  outputs: OutputSpecNode[];
}

export interface OutputSpecNode extends Node<'outputSpec'> {
  name: IdentifierNode;
  format?: 'B' | 'X' | 'D' | 'S';
  length?: number;
  padLeft?: number;
  padRight?: number;
}

export interface SetNode extends Node<'set'> {
  name: IdentifierNode;
  value: number;
  line: number;
  col: number;
}

// This node has only type
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EvalNode extends Node<'eval'> {
  line: number;
  col: number;
}

// This node has only type
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OutputNode extends Node<'output'> {
  line: number;
  col: number;
}

export interface IdentifierNode extends Node<'identifier'> {
  value: string;
  line: number;
  col: number;
}

export interface Node<type extends string> {
  type: type;
}

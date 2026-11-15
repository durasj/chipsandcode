export type Side = 'left' | 'right' | 'top' | 'bottom';
export interface DiagramNode {
  id: string;
  label: string;
  detail?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  kind?: 'input' | 'output' | 'chip' | 'supplied' | 'control';
}
export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  fromSide?: Side;
  toSide?: Side;
  fromOffset?: number;
  toOffset?: number;
  via?: [number, number][];
  labelAt?: [number, number];
}
export interface ConnectedDiagram {
  width: number;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  notes?: { text: string; x: number; y: number }[];
}

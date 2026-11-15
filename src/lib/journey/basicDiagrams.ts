import type { JourneyStep } from './data';
import type { ConnectedDiagram, DiagramNode, DiagramEdge } from './schematicTypes';

export function basicDiagram(step: JourneyStep, small: boolean): ConnectedDiagram | null {
  const width = small ? 300 : 780;
  const w = small ? 120 : 160;
  const left = small ? 15 : 95,
    right = small ? 165 : 525,
    center = (width - w) / 2;
  const node = (
    id: string,
    label: string,
    x: number,
    y: number,
    detail?: string,
    kind: DiagramNode['kind'] = 'chip',
  ): DiagramNode => ({ id, label, x, y, w, h: 55, detail, kind });
  const edge = (from: string, to: string, label?: string): DiagramEdge => ({ from, to, label });
  const graph = (nodes: DiagramNode[], edges: DiagramEdge[], height = 485): ConnectedDiagram => ({
    width,
    height,
    nodes,
    edges,
  });
  if (step.diagram === 'gate') {
    if (step.id === 'missions/not') {
      return graph(
        [
          node('in', 'in', center, 90, 'one input signal', 'input'),
          node('nand', 'Nand', center, 220, 'a and b tied'),
          node('out', 'out', center, 355, 'opposite signal', 'output'),
        ],
        [
          {
            from: 'in',
            to: 'nand',
            fromSide: 'bottom',
            toSide: 'top',
            toOffset: -30,
            via: [
              [width / 2, 180],
              [width / 2 - 30, 180],
            ],
            label: 'a',
            labelAt: [width / 2 - 42, 203],
          },
          {
            from: 'in',
            to: 'nand',
            fromSide: 'bottom',
            toSide: 'top',
            toOffset: 30,
            via: [
              [width / 2, 180],
              [width / 2 + 30, 180],
            ],
            label: 'b',
            labelAt: [width / 2 + 42, 203],
          },
          edge('nand', 'out'),
        ],
        445,
      );
    }
    if (step.id === 'missions/and')
      return graph(
        [
          node('inputs', 'a, b', center, 85, 'two input bits', 'input'),
          node('nand', 'Nand', center, 185, 'combine + invert'),
          node('not', 'Not', center, 285, 'invert again'),
          node('out', 'out', center, 385, 'both inputs high', 'output'),
        ],
        [edge('inputs', 'nand'), edge('nand', 'not'), edge('not', 'out')],
      );
    if (step.id === 'missions/or')
      return graph(
        [
          node('a', 'a', left, 85, undefined, 'input'),
          node('b', 'b', right, 85, undefined, 'input'),
          node('notA', 'Not', left, 185, 'invert a'),
          node('notB', 'Not', right, 185, 'invert b'),
          node('nand', 'Nand', center, 290, 'combine inversions'),
          node('out', 'out', center, 395, 'either input high', 'output'),
        ],
        [
          edge('a', 'notA'),
          edge('b', 'notB'),
          edge('notA', 'nand'),
          edge('notB', 'nand'),
          edge('nand', 'out'),
        ],
        495,
      );
    if (step.id === 'missions/xor')
      return graph(
        [
          node('inputs', 'a, b', center, 85, 'two input bits', 'input'),
          node('or', 'Or', left, 185, 'at least one high'),
          node('and', 'And', right, 185, 'both high'),
          node('not', 'Not', right, 285, 'not both high'),
          node('both', 'And', center, 390, 'combine conditions'),
          node('out', 'out', center, 490, 'inputs differ', 'output'),
        ],
        [
          edge('inputs', 'or'),
          edge('inputs', 'and'),
          edge('and', 'not'),
          {
            from: 'or',
            to: 'both',
            fromSide: 'bottom',
            toSide: 'left',
            via: [[left + w / 2, 417]],
            label: 'either high',
            labelAt: [left + w / 2, 365],
          },
          edge('not', 'both'),
          edge('both', 'out'),
        ],
        590,
      );
    const two = step.id === 'intro/and' || step.id === 'missions/nand';
    return graph(
      [
        node(
          'inputs',
          two ? 'a, b' : 'in',
          center,
          95,
          two ? 'two input bits' : 'one input signal',
          'input',
        ),
        node(
          'gate',
          step.label,
          center,
          215,
          step.supplied ? 'supplied behavior' : 'transform a signal',
          step.supplied ? 'supplied' : 'chip',
        ),
        node(
          'out',
          'out',
          center,
          335,
          step.id === 'intro/and'
            ? '1 when both are 1'
            : step.id === 'missions/nand'
              ? '0 only for two 1s'
              : 'opposite signal',
          'output',
        ),
      ],
      [edge('inputs', 'gate'), edge('gate', 'out')],
      440,
    );
  }
  if (step.id === 'arithmetic/halfadder')
    return graph(
      [
        node('inputs', 'a, b', center, 85, 'two input bits', 'input'),
        node('xor', 'Xor', left, 200, 'inputs differ'),
        node('and', 'And', right, 200, 'both inputs high'),
        node('sum', 'sum', left, 330, 'low result bit', 'output'),
        node('carry', 'carry', right, 330, 'high result bit', 'output'),
      ],
      [edge('inputs', 'xor'), edge('inputs', 'and'), edge('xor', 'sum'), edge('and', 'carry')],
      435,
    );
  if (step.id === 'arithmetic/fulladder')
    return graph(
      [
        node('ab', 'a, b', left, 85, 'input bits', 'input'),
        node('c', 'c', right, 85, 'carry from bit below', 'input'),
        node('first', 'HalfAdder', left, 195, 'a + b'),
        node('second', 'HalfAdder', right, 195, 'partial sum + c'),
        node('or', 'Or', center, 320, 'combine carries'),
        node('carry', 'carry', left, 435, 'to the next column', 'output'),
        node('sum', 'sum', right, 435, 'this column’s bit', 'output'),
      ],
      [
        edge('ab', 'first'),
        edge('c', 'second'),
        { from: 'first', to: 'second', label: 'sum', labelAt: [width / 2, 180] },
        { from: 'first', to: 'or', label: 'carry 1', labelAt: [left + w / 2, 285] },
        { from: 'second', to: 'or', label: 'carry 2', labelAt: [right + w / 2, 285] },
        edge('or', 'carry'),
        {
          from: 'second',
          to: 'sum',
          fromSide: 'right',
          toSide: 'right',
          via: [
            [width - 12, 222],
            [width - 12, 462],
          ],
          label: 'sum',
          labelAt: [right + w / 2, 405],
        },
      ],
      540,
    );
  if (step.id === 'arithmetic/inc16')
    return graph(
      [
        node('in', 'in[16]', left, 90, 'input word', 'input'),
        node('one', '1', right, 90, 'constant word', 'input'),
        node('add', 'Add16', center, 220, 'add the operands'),
        node('out', 'out[16]', center, 350, '(in + 1) mod 65536', 'output'),
      ],
      [edge('in', 'add'), edge('one', 'add'), edge('add', 'out')],
      450,
    );
  return null;
}

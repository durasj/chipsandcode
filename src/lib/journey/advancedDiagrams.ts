import type { JourneyStep } from './data';
import type { ConnectedDiagram, DiagramNode, DiagramEdge } from './schematicTypes';

const node = (
  id: string,
  label: string,
  x: number,
  y: number,
  w = 130,
  detail?: string,
  kind: DiagramNode['kind'] = 'chip',
): DiagramNode => ({ id, label, x, y, w, h: 60, detail, kind });
const edge = (
  from: string,
  to: string,
  extra: Omit<DiagramEdge, 'from' | 'to'> = {},
): DiagramEdge => ({ from, to, ...extra });

function alu(small: boolean): ConnectedDiagram {
  if (small)
    return {
      width: 300,
      height: 760,
      nodes: [
        node('x', 'Prepare x', 20, 100, 120, 'zx: zero; nx: NOT'),
        node('y', 'Prepare y', 160, 100, 120, 'zy: zero; ny: NOT'),
        node('and', 'And16', 20, 265, 120, 'bitwise x AND y'),
        node('add', 'Add16', 160, 265, 120, 'word sum x + y'),
        node('select', 'Mux16', 90, 410, 120, 'f: AND or sum'),
        node('out', 'out[16]', 90, 535, 120, 'no: keep / NOT', 'output'),
        node('flags', 'zr / ng', 90, 660, 120, 'zero / sign bit'),
      ],
      edges: [
        edge('x', 'and'),
        edge('x', 'add', { fromOffset: 25, toOffset: -25 }),
        edge('y', 'and', { fromOffset: -25, toOffset: 25 }),
        edge('y', 'add'),
        edge('and', 'select', { toOffset: -25 }),
        edge('add', 'select', { toOffset: 25 }),
        edge('select', 'out'),
        edge('out', 'flags'),
      ],
      notes: [{ text: 'Both operations receive prepared x, y.', x: 150, y: 220 }],
    };
  return {
    width: 780,
    height: 540,
    nodes: [
      node('x', 'Prepare x', 30, 120, 150, 'zx: zero; nx: invert'),
      node('y', 'Prepare y', 30, 330, 150, 'zy: zero; ny: invert'),
      node('and', 'And16', 270, 120, 135, 'x AND y'),
      node('add', 'Add16', 270, 330, 135, 'x + y'),
      node('select', 'Mux16', 465, 225, 130, 'f: AND or sum'),
      node('out', 'out[16]', 625, 225, 130, 'no: keep / invert', 'output'),
      node('flags', 'zr / ng', 625, 390, 130, 'zero / sign bit'),
    ],
    edges: [
      edge('x', 'and'),
      edge('y', 'add'),
      edge('x', 'add', {
        fromSide: 'right',
        toSide: 'left',
        via: [
          [220, 150],
          [220, 360],
        ],
        toOffset: -15,
      }),
      edge('y', 'and', {
        fromSide: 'right',
        toSide: 'left',
        via: [
          [240, 360],
          [240, 150],
        ],
        toOffset: 15,
      }),
      edge('and', 'select', {
        fromSide: 'right',
        toSide: 'left',
        via: [
          [435, 150],
          [435, 240],
        ],
        toOffset: -15,
      }),
      edge('add', 'select', {
        fromSide: 'right',
        toSide: 'left',
        via: [
          [445, 360],
          [445, 270],
        ],
        toOffset: 15,
      }),
      edge('select', 'out'),
      edge('out', 'flags'),
    ],
    notes: [
      {
        text: 'The six control bits prepare operands, choose a result, and optionally invert it.',
        x: 390,
        y: 495,
      },
    ],
  };
}

function bank(step: JourneyStep, small: boolean): ConnectedDiagram {
  const words = step.count ?? 8;
  const banks = words === 16384 ? 4 : 8;
  const child = step.parts[0];
  const detail = `${words / banks} ${words / banks === 1 ? 'word' : 'words'} · ${child}`;
  const addressNote =
    words === 8 ? '3 address bits choose a register.' : `High bits choose 1 of ${banks} banks.`;
  if (small)
    return {
      width: 300,
      height: 780,
      nodes: [
        node('address', 'addr + load', 15, 100, 125, `${Math.log2(words)} address bits`, 'input'),
        node('write', 'in[16]', 160, 100, 125, 'shared write data', 'input'),
        node('decode', 'Write select', 15, 245, 125, `1 of ${banks} enables`, 'control'),
        node('first', 'Bank 0', 15, 390, 125, detail),
        node('last', `Bank ${banks - 1}`, 160, 390, 125, detail),
        node('mux', 'Read Mux', 90, 530, 125, 'address selects'),
        node('out', 'out[16]', 90, 650, 125, 'selected word', 'output'),
      ],
      edges: [
        edge('address', 'decode'),
        edge('decode', 'first', { toOffset: -25 }),
        edge('decode', 'last', { toOffset: -25, fromOffset: 25 }),
        edge('write', 'first', {
          fromSide: 'bottom',
          toSide: 'right',
          via: [
            [225, 200],
            [150, 200],
            [150, 420],
          ],
        }),
        edge('write', 'last'),
        edge('address', 'mux', {
          fromSide: 'top',
          toSide: 'right',
          via: [
            [77.5, 80],
            [292, 80],
            [292, 560],
          ],
          label: 'read address',
          labelAt: [235, 70],
        }),
        edge('first', 'mux', { toOffset: -25 }),
        edge('last', 'mux', { toOffset: 25 }),
        edge('mux', 'out'),
      ],
      notes: [
        { text: addressNote, x: 150, y: 725 },
        {
          text:
            words === 8
              ? 'Only the selected register is written.'
              : 'Low bits address a word inside a bank.',
          x: 150,
          y: 745,
        },
      ],
    };
  return {
    width: 780,
    height: 560,
    nodes: [
      node('address', 'addr + load', 25, 105, 130, `${Math.log2(words)} address bits`, 'input'),
      node('decode', 'Write select', 205, 105, 140, `1 of ${banks} enables`, 'control'),
      node('write', 'in[16]', 25, 325, 130, 'shared write data', 'input'),
      node('first', 'Bank 0', 400, 190, 140, detail),
      node('last', `Bank ${banks - 1}`, 400, 365, 140, detail),
      node('mux', 'Read Mux', 605, 275, 140, 'address selects'),
      node('out', 'out[16]', 605, 420, 140, 'selected word', 'output'),
    ],
    edges: [
      edge('address', 'decode'),
      edge('address', 'mux', {
        fromSide: 'top',
        toSide: 'right',
        via: [
          [90, 80],
          [755, 80],
          [755, 305],
        ],
        label: 'read address',
        labelAt: [625, 70],
      }),
      edge('decode', 'first', { fromSide: 'right', toSide: 'top', via: [[470, 135]] }),
      edge('decode', 'last', {
        fromSide: 'right',
        toSide: 'left',
        via: [
          [370, 135],
          [370, 380],
        ],
        toOffset: -15,
      }),
      edge('write', 'first', {
        fromSide: 'right',
        toSide: 'left',
        via: [
          [350, 355],
          [350, 235],
        ],
        toOffset: 15,
      }),
      edge('write', 'last', {
        fromSide: 'right',
        toSide: 'left',
        via: [
          [330, 355],
          [330, 410],
        ],
        toOffset: 15,
      }),
      edge('first', 'mux', {
        fromSide: 'right',
        toSide: 'left',
        via: [
          [570, 220],
          [570, 290],
        ],
        toOffset: -15,
      }),
      edge('last', 'mux', {
        fromSide: 'right',
        toSide: 'left',
        via: [
          [585, 395],
          [585, 320],
        ],
        toOffset: 15,
      }),
      edge('mux', 'out'),
    ],
    notes: [
      {
        text: `First and last banks shown; the same read/write interface repeats across all ${banks}.`,
        x: 390,
        y: 500,
      },
      {
        text: `${addressNote} ${words === 8 ? 'Each register stores one word.' : 'Low bits choose the word inside that bank.'}`,
        x: 390,
        y: 520,
      },
    ],
  };
}

function cpu(small: boolean): ConnectedDiagram {
  if (small)
    return {
      width: 300,
      height: 975,
      nodes: [
        node('instruction', 'instruction', 90, 100, 120, 'from ROM', 'input'),
        node('decode', 'Decode', 90, 220, 120, 'comp·dest·jump', 'control'),
        node('operands', 'A, D and M', 90, 345, 120, 'D and chosen A/M'),
        node('alu', 'ALU', 90, 470, 120, 'result + zr / ng'),
        node('dest', 'Destinations', 90, 595, 120, 'A / D / memory'),
        node('pc', 'PC + jump', 90, 765, 120, 'reset / flags / A'),
        node('rom', 'pc → ROM', 90, 885, 120, 'next instruction', 'output'),
      ],
      edges: [
        edge('instruction', 'decode'),
        edge('decode', 'alu', {
          fromSide: 'right',
          toSide: 'right',
          via: [
            [250, 250],
            [250, 485],
          ],
          toOffset: -15,
        }),
        edge('decode', 'dest', {
          fromSide: 'right',
          toSide: 'right',
          via: [
            [275, 250],
            [275, 625],
          ],
        }),
        edge('decode', 'operands', { label: 'A immediate' }),
        edge('operands', 'alu'),
        edge('alu', 'dest'),
        edge('dest', 'operands', {
          fromSide: 'left',
          toSide: 'left',
          via: [
            [50, 625],
            [50, 375],
          ],
        }),
        edge('operands', 'pc', {
          fromSide: 'left',
          toSide: 'left',
          via: [
            [25, 375],
            [25, 795],
          ],
        }),
        edge('alu', 'pc', {
          fromSide: 'right',
          toSide: 'right',
          via: [
            [235, 515],
            [235, 795],
          ],
          fromOffset: 15,
        }),
        edge('decode', 'pc', {
          fromSide: 'right',
          toSide: 'right',
          via: [
            [290, 265],
            [290, 810],
          ],
          fromOffset: 15,
          toOffset: 15,
        }),
        edge('pc', 'rom'),
      ],
      notes: [
        { text: 'A/D update at the clock edge.', x: 150, y: 700 },
        { text: 'Memory and jumps use the old A.', x: 150, y: 720 },
      ],
    };
  return {
    width: 780,
    height: 660,
    nodes: [
      node('instruction', 'instruction', 25, 100, 140, 'from ROM', 'input'),
      node('decode', 'Decode', 235, 100, 160, 'comp·dest·jump', 'control'),
      node('operands', 'A, D and M', 235, 300, 160, 'D and selected A/M'),
      node('alu', 'ALU', 460, 300, 130, 'result + zr / ng'),
      node('dest', 'Destinations', 625, 300, 130, 'A / D / memory'),
      node('pc', 'PC + jump', 460, 490, 130, 'reset / flags / A'),
      node('rom', 'pc → ROM', 625, 490, 130, 'next instruction', 'output'),
    ],
    edges: [
      edge('instruction', 'decode'),
      edge('decode', 'operands', { label: 'A immediate' }),
      edge('operands', 'alu'),
      edge('alu', 'dest'),
      edge('decode', 'alu', {
        fromSide: 'right',
        toSide: 'top',
        via: [[525, 130]],
        label: 'comp',
        labelAt: [460, 115],
      }),
      edge('decode', 'dest', {
        fromSide: 'top',
        toSide: 'top',
        via: [
          [315, 75],
          [690, 75],
        ],
        label: 'dest',
        labelAt: [650, 65],
      }),
      edge('dest', 'operands', {
        fromSide: 'bottom',
        toSide: 'bottom',
        via: [
          [690, 420],
          [315, 420],
        ],
        label: 'register feedback',
        labelAt: [470, 410],
      }),
      edge('operands', 'pc', {
        fromSide: 'left',
        toSide: 'left',
        via: [
          [200, 330],
          [200, 520],
        ],
        label: 'old A: target',
        labelAt: [320, 510],
      }),
      edge('alu', 'pc', { label: 'zr / ng', labelAt: [560, 455] }),
      edge('decode', 'pc', {
        fromSide: 'left',
        toSide: 'bottom',
        via: [
          [180, 130],
          [180, 590],
          [525, 590],
        ],
        label: 'jump bits',
        labelAt: [340, 580],
      }),
      edge('pc', 'rom'),
    ],
    notes: [
      {
        text: 'Instruction control selects operands, destinations and jumps. Memory addresses use the old A.',
        x: 390,
        y: 630,
      },
    ],
  };
}

function translation(symbols: boolean, small: boolean): ConnectedDiagram {
  const output = symbols ? 'Addresses' : '16-bit words';
  if (small)
    return {
      width: 300,
      height: 720,
      nodes: [
        node('source', 'Clean source', 90, 100, 120, 'without comments', 'input'),
        node('first', 'Pass 1', 90, 225, 120, 'labels → ROM'),
        node('table', 'Symbols', 15, 360, 115, 'built-in + new'),
        node('second', 'Pass 2', 165, 480, 120, symbols ? 'variables → RAM' : 'resolve + encode'),
        node('out', output, 165, 605, 120, symbols ? 'ready to encode' : 'ready for ROM', 'output'),
      ],
      edges: [
        edge('source', 'first'),
        edge('first', 'table', { fromSide: 'left', toSide: 'top', via: [[72.5, 255]] }),
        edge('first', 'second', { fromSide: 'right', toSide: 'top', via: [[225, 255]] }),
        edge('table', 'second', { fromSide: 'bottom', toSide: 'left', via: [[72.5, 510]] }),
        edge('second', 'out'),
      ],
      notes: [{ text: 'Labels do not occupy ROM words.', x: 150, y: 690 }],
    };
  return {
    width: 780,
    height: 470,
    nodes: [
      node('source', 'Clean source', 25, 120, 145, 'without comments', 'input'),
      node('first', 'Pass 1', 220, 120, 145, 'labels → ROM'),
      node('table', 'Symbol table', 220, 300, 145, 'built-in + new'),
      node('second', 'Pass 2', 420, 120, 145, symbols ? 'variables → RAM' : 'resolve + encode'),
      node('out', output, 620, 120, 135, symbols ? 'ready to encode' : 'ready for ROM', 'output'),
    ],
    edges: [
      edge('source', 'first'),
      edge('first', 'second', { label: 'instructions', labelAt: [392.5, 105] }),
      edge('first', 'table', { label: 'ROM labels', labelAt: [335, 245] }),
      edge('table', 'second', {
        fromSide: 'right',
        toSide: 'bottom',
        via: [[492.5, 330]],
        label: 'name → address',
        labelAt: [500, 280],
      }),
      edge('second', 'out'),
    ],
    notes: [
      {
        text: 'Labels name ROM positions without taking space. New variables receive RAM addresses from 16.',
        x: 390,
        y: 420,
      },
    ],
  };
}

function loop(small: boolean): ConnectedDiagram {
  if (small)
    return {
      width: 300,
      height: 820,
      nodes: [
        node('start', 'Initialize', 90, 100, 120, 'R2=0; count=R1'),
        node('test', 'count = 0?', 90, 240, 120, 'conditional jump', 'control'),
        node('add', 'R2 += R0', 90, 380, 120, 'one more addition'),
        node('dec', 'count − 1', 90, 520, 120, 'then test again'),
        node('done', 'Result in R2', 90, 685, 120, 'stable final loop', 'output'),
      ],
      edges: [
        edge('start', 'test'),
        edge('test', 'add', { label: 'no', labelAt: [175, 345] }),
        edge('add', 'dec'),
        edge('dec', 'test', {
          fromSide: 'left',
          toSide: 'left',
          via: [
            [35, 550],
            [35, 270],
          ],
        }),
        edge('test', 'done', {
          fromSide: 'right',
          toSide: 'right',
          via: [
            [265, 270],
            [265, 715],
          ],
          label: 'yes',
          labelAt: [265, 640],
        }),
      ],
      notes: [{ text: 'Multiply by repeating addition.', x: 150, y: 785 }],
    };
  return {
    width: 780,
    height: 490,
    nodes: [
      node('start', 'Initialize', 25, 110, 155, 'R2=0; count=R1'),
      node('test', 'count = 0?', 300, 110, 155, 'conditional jump', 'control'),
      node('done', 'Result in R2', 600, 110, 155, 'stable final loop', 'output'),
      node('add', 'R2 += R0', 300, 310, 155, 'one more addition'),
      node('dec', 'count − 1', 25, 310, 155, 'then test again'),
    ],
    edges: [
      edge('start', 'test'),
      edge('test', 'done', { label: 'yes' }),
      edge('test', 'add', { label: 'no', labelAt: [405, 245] }),
      edge('add', 'dec'),
      edge('dec', 'test', {
        fromSide: 'bottom',
        toSide: 'right',
        via: [
          [102.5, 425],
          [520, 425],
          [520, 140],
        ],
      }),
    ],
    notes: [
      {
        text: 'The program repeats an ALU operation; the hardware does not need a multiply instruction.',
        x: 390,
        y: 460,
      },
    ],
  };
}

function counter(small: boolean): ConnectedDiagram {
  if (small)
    return {
      width: 300,
      height: 890,
      nodes: [
        node('reset', 'reset?', 20, 100, 115, 'first choice', 'control'),
        node('zero', '0', 165, 100, 115, 'reset value', 'input'),
        node('load', 'load?', 20, 240, 115, 'otherwise', 'control'),
        node('in', 'in[16]', 165, 240, 115, 'in value', 'input'),
        node('inc', 'inc?', 20, 380, 115, 'otherwise', 'control'),
        node('plus', 'Inc16(PC)', 165, 380, 115, 'current PC + 1'),
        node('hold', 'Hold PC', 20, 520, 115, 'otherwise'),
        node('register', 'Register', 165, 665, 115, 'clocked value'),
        node('out', 'out[16]', 165, 785, 115, 'stored PC', 'output'),
      ],
      edges: [
        edge('reset', 'zero', { label: 'yes' }),
        edge('reset', 'load', { label: 'no', labelAt: [95, 205] }),
        edge('load', 'in', { label: 'yes' }),
        edge('load', 'inc', { label: 'no', labelAt: [95, 345] }),
        edge('inc', 'plus', { label: 'yes' }),
        edge('inc', 'hold', { label: 'no', labelAt: [95, 485] }),
        edge('zero', 'register', {
          fromSide: 'right',
          toSide: 'right',
          via: [
            [292, 130],
            [292, 695],
          ],
        }),
        edge('in', 'register', {
          fromSide: 'right',
          toSide: 'right',
          via: [
            [292, 270],
            [292, 695],
          ],
        }),
        edge('plus', 'register'),
        edge('hold', 'register', { fromSide: 'bottom', toSide: 'left', via: [[77.5, 695]] }),
        edge('register', 'out'),
      ],
    };
  return {
    width: 780,
    height: 620,
    nodes: [
      node('reset', 'reset?', 30, 110, 140, 'first choice', 'control'),
      node('load', 'load?', 220, 110, 140, 'otherwise', 'control'),
      node('inc', 'inc?', 410, 110, 140, 'otherwise', 'control'),
      node('hold', 'Hold PC', 600, 110, 140, 'otherwise'),
      node('zero', '0', 30, 295, 140, 'reset value', 'input'),
      node('in', 'in[16]', 220, 295, 140, 'in value', 'input'),
      node('plus', 'Inc16(PC)', 410, 295, 140, 'current PC + 1'),
      node('register', 'Register', 315, 480, 150, 'clocked value'),
      node('out', 'out[16]', 600, 480, 140, 'stored PC', 'output'),
    ],
    edges: [
      edge('reset', 'load', { label: 'no' }),
      edge('load', 'inc', { label: 'no' }),
      edge('inc', 'hold', { label: 'no' }),
      edge('reset', 'zero', { label: 'yes', labelAt: [125, 240] }),
      edge('load', 'in', { label: 'yes', labelAt: [315, 240] }),
      edge('inc', 'plus', { label: 'yes', labelAt: [505, 240] }),
      edge('zero', 'register', { toOffset: -50 }),
      edge('in', 'register', { toOffset: -20 }),
      edge('plus', 'register', { toOffset: 20 }),
      edge('hold', 'register', {
        fromSide: 'bottom',
        toSide: 'top',
        via: [
          [670, 420],
          [440, 420],
        ],
        toOffset: 50,
      }),
      edge('register', 'out'),
    ],
    notes: [
      {
        text: 'Only the first matching choice supplies the value captured at the next clock edge.',
        x: 390,
        y: 585,
      },
    ],
  };
}

export function advancedDiagram(step: JourneyStep, small: boolean): ConnectedDiagram | null {
  if (step.diagram === 'alu') return alu(small);
  if (step.diagram === 'bank') return bank(step, small);
  if (step.diagram === 'cpu') return cpu(small);
  if (step.diagram === 'counter') return counter(small);
  if (step.diagram === 'translator' || step.diagram === 'symbols')
    return translation(step.diagram === 'symbols', small);
  if (step.diagram === 'loop') return loop(small);
  return null;
}

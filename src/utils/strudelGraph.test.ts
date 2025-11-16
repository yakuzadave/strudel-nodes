import type { Edge, Node } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import type { NodeData } from '../types';
import { compileStrudelPatch } from './strudelGraph';

const createNode = (partial: Partial<Node<NodeData>> & { id: string; data: NodeData }): Node<NodeData> => ({
  position: { x: 0, y: 0 },
  type: partial.type ?? partial.data.type,
  ...partial,
});

const createEdge = (source: string, target: string, id = `${source}-${target}`): Edge => ({
  id,
  source,
  target,
});

describe('compileStrudelPatch', () => {
  it('returns null patch code when no playable nodes exist', () => {
    const result = compileStrudelPatch([], []);
    expect(result.patchCode).toBeNull();
    expect(result.expressions.size).toBe(0);
  });

  it('stacks multiple output expressions', () => {
    const nodes: Node<NodeData>[] = [
      createNode({
        id: 'pattern-1',
        data: { type: 'pattern', code: 's("bd")', label: 'Pattern 1' },
      }),
      createNode({
        id: 'pattern-2',
        data: { type: 'pattern', code: 's("sd")', label: 'Pattern 2' },
      }),
      createNode({
        id: 'output-1',
        data: { type: 'output', code: '', label: 'Out 1', volume: 0.8, pan: 0 },
      }),
      createNode({
        id: 'output-2',
        data: { type: 'output', code: '', label: 'Out 2', volume: 1, pan: 0.5 },
      }),
    ];
    const edges: Edge[] = [
      createEdge('pattern-1', 'output-1'),
      createEdge('pattern-2', 'output-2'),
    ];
    const result = compileStrudelPatch(nodes, edges);
    expect(result.outputExpressions).toHaveLength(2);
    expect(result.patchCode).toContain('stack(');
    expect(result.outputExpressions[0]).toContain('s("bd")');
    expect(result.outputExpressions[1]).toContain('.pan(0.5)');
  });

  it('chains upstream nodes for transforms and fx', () => {
    const nodes: Node<NodeData>[] = [
      createNode({
        id: 'pattern',
        data: { type: 'pattern', code: 's("bd sd")', label: 'Pattern' },
      }),
      createNode({
        id: 'transform',
        data: { type: 'transform', code: '.fast(2)', label: 'Transform' },
      }),
      createNode({
        id: 'fx',
        data: { type: 'fx', code: '.lpf(1000)', label: 'FX' },
      }),
      createNode({
        id: 'output',
        data: { type: 'output', code: '', label: 'Out', volume: 0.6, pan: -0.25 },
      }),
    ];

    const edges: Edge[] = [
      createEdge('pattern', 'transform'),
      createEdge('transform', 'fx'),
      createEdge('fx', 'output'),
    ];

    const result = compileStrudelPatch(nodes, edges);
    const transformExpression = result.expressions.get('transform');
    expect(transformExpression).toContain('s("bd sd")');
    expect(transformExpression).toContain('.fast(2)');
    const outputExpression = result.expressions.get('output');
    expect(outputExpression).toContain('.lpf(1000)');
    expect(outputExpression).toContain('.gain(0.6)');
    expect(outputExpression).toContain('.pan(-0.25)');
    expect(result.patchCode).toContain('.lpf(1000)');
  });
});

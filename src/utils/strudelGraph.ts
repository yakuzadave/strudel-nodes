import type { Edge, Node } from '@xyflow/react';
import type { NodeData } from '../types';

export interface CompiledStrudelPatch {
  expressions: Map<string, string>;
  outputExpressions: string[];
  patchCode: string | null;
}

interface NodeLookup {
  incoming: Map<string, string[]>;
  nodes: Map<string, Node<NodeData>>;
}

const wrapForChaining = (expr: string) => {
  const trimmed = expr.trim();
  if (!trimmed.length) {
    return trimmed;
  }
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return trimmed;
  }
  return `(${trimmed})`;
};

const sanitizeCode = (code?: string) => (typeof code === 'string' ? code.trim() : '');

const combineInputs = (inputs: string[]) => {
  if (inputs.length === 0) {
    return '';
  }
  if (inputs.length === 1) {
    return inputs[0];
  }
  return `stack(${inputs.join(', ')})`;
};

const applyOutputTransforms = (expr: string, data: NodeData) => {
  let result = expr;
  const volume = typeof data.volume === 'number' ? data.volume : null;
  if (volume !== null && !Number.isNaN(volume) && volume !== 1) {
    result = `${result}.gain(${Number(volume.toFixed(3))})`;
  }
  const pan = typeof data.pan === 'number' ? data.pan : null;
  if (pan !== null && !Number.isNaN(pan) && pan !== 0) {
    result = `${result}.pan(${Number(pan.toFixed(3))})`;
  }
  const extraCode = sanitizeCode(data.code);
  if (extraCode) {
    result = `${result}${extraCode}`;
  }
  return result;
};

const buildLookup = (nodes: Node<NodeData>[], edges: Edge[]): NodeLookup => {
  const nodeMap = new Map<string, Node<NodeData>>();
  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
  });

  const incoming = new Map<string, string[]>();
  edges.forEach((edge) => {
    if (!edge.source || !edge.target) {
      return;
    }
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      return;
    }
    const list = incoming.get(edge.target);
    if (list) {
      list.push(edge.source);
    } else {
      incoming.set(edge.target, [edge.source]);
    }
  });

  return {
    incoming,
    nodes: nodeMap,
  } satisfies NodeLookup;
};

export const compileStrudelPatch = (
  nodes: Node<NodeData>[],
  edges: Edge[]
): CompiledStrudelPatch => {
  const { nodes: nodeMap, incoming } = buildLookup(nodes, edges);
  const expressions = new Map<string, string>();
  const cache = new Map<string, string | null>();
  const visiting = new Set<string>();

  const resolveNode = (nodeId: string): string | null => {
    if (cache.has(nodeId)) {
      return cache.get(nodeId) ?? null;
    }
    if (visiting.has(nodeId)) {
      return null;
    }
    const node = nodeMap.get(nodeId);
    if (!node) {
      cache.set(nodeId, null);
      return null;
    }
    visiting.add(nodeId);
    const nodeData = node.data as NodeData;
    const nodeType = nodeData.type ?? node.type;
    let expression: string | null = null;

    if (nodeType === 'pattern') {
      const code = sanitizeCode(nodeData.code);
      expression = code ? wrapForChaining(code) : null;
    } else {
      const sources = incoming.get(nodeId) ?? [];
      const inputExpressions = sources
        .map((sourceId) => resolveNode(sourceId))
        .filter((value): value is string => Boolean(value));
      if (inputExpressions.length) {
        const combined = wrapForChaining(combineInputs(inputExpressions));
        if (nodeType === 'output') {
          expression = applyOutputTransforms(combined, nodeData);
        } else {
          const code = sanitizeCode(nodeData.code);
          expression = code ? `${combined}${code}` : combined;
        }
      }
    }

    visiting.delete(nodeId);
    cache.set(nodeId, expression);
    if (expression) {
      expressions.set(nodeId, expression);
    }
    return expression;
  };

  nodes.forEach((node) => {
    resolveNode(node.id);
  });

  const outputExpressions = nodes
    .filter((node) => (node.data as NodeData).type === 'output')
    .map((node) => expressions.get(node.id))
    .filter((expr): expr is string => Boolean(expr));

  let patchCode: string | null = null;
  if (outputExpressions.length) {
    patchCode = combineInputs(outputExpressions);
  } else {
    const standalonePatterns = nodes
      .filter((node) => (node.data as NodeData).type === 'pattern')
      .map((node) => expressions.get(node.id))
      .filter((expr): expr is string => Boolean(expr));
    patchCode = standalonePatterns.length ? combineInputs(standalonePatterns) : null;
  }

  return {
    expressions,
    outputExpressions,
    patchCode,
  } satisfies CompiledStrudelPatch;
};

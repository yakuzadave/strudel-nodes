import type { Edge, Node } from '@xyflow/react';

export type NodeType = 'pattern' | 'transform' | 'fx' | 'output';

export interface NodeData extends Record<string, unknown> {
  label: string;
  code: string;
  volume?: number;
  pan?: number;
  error?: string;
  type: NodeType;
}

export interface PatchData {
  nodes?: Node<NodeData>[];
  edges?: Edge[];
  name?: string;
  created?: string;
}

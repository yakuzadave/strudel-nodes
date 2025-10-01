import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '../types';
import { useState } from 'react';

export function TransformNode({ data }: NodeProps) {
  const nodeData = data as NodeData;
  const [code, setCode] = useState(nodeData.code || '.fast(2)');

  return (
    <div className="node transform-node">
      <div className="node-header">
        <span className="node-type">Transform</span>
        <span className="node-label">{nodeData.label}</span>
      </div>
      <div className="node-content">
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            nodeData.code = e.target.value;
          }}
          placeholder="Enter transformation..."
          className="code-input"
          rows={2}
        />
        {nodeData.error && <div className="error-message">{nodeData.error}</div>}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

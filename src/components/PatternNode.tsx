import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '../types';
import { useState } from 'react';

export function PatternNode({ data }: NodeProps) {
  const nodeData = data as NodeData;
  const [code, setCode] = useState(nodeData.code || 's("bd sd")');

  return (
    <div className="node pattern-node">
      <div className="node-header">
        <span className="node-type">Pattern</span>
        <span className="node-label">{nodeData.label}</span>
      </div>
      <div className="node-content">
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            nodeData.code = e.target.value;
          }}
          placeholder="Enter Strudel pattern..."
          className="code-input"
          rows={3}
        />
        {nodeData.error && <div className="error-message">{nodeData.error}</div>}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

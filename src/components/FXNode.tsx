import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '../types';
import { useState } from 'react';

export function FXNode({ data }: NodeProps) {
  const nodeData = data as NodeData;
  const [code, setCode] = useState(nodeData.code || '.lpf(1000)');

  return (
    <div className="node fx-node">
      <div className="node-header">
        <span className="node-type">FX</span>
        <span className="node-label">{nodeData.label}</span>
      </div>
      <div className="node-content">
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            nodeData.code = e.target.value;
          }}
          placeholder="Enter effect..."
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

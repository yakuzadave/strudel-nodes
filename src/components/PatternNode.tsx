import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '../types';
import { useState, useContext } from 'react';
import { SequencerContext } from '../SequencerContext';

export function PatternNode({ id, data }: NodeProps) {
  const seq = useContext(SequencerContext);
  const nodeData = data as NodeData;
  const [code, setCode] = useState(nodeData.code || 's("bd sd")');
  const isPlaying = seq?.playingNodes.has(id) ?? false;

  return (
    <div className={`node pattern-node${isPlaying ? ' is-playing' : ''}`}>
      <div className="node-header">
        <span className="node-type">Pattern</span>
        <span className="node-label">{nodeData.label}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void seq?.previewNode(id);
          }}
          title="Preview pattern"
          className="node-preview-button"
        >
          ▶
        </button>
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
          rows={4}
        />
        {nodeData.error && <div className="error-message">{nodeData.error}</div>}
        <Handle type="source" position={Position.Right} />
      </div>
    </div>
  );
}

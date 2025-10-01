import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '../types';
import { useState, useContext } from 'react';
import { SequencerContext } from '../SequencerContext';

export function FXNode({ id, data }: NodeProps) {
  const seq = useContext(SequencerContext);
  const nodeData = data as NodeData;
  const [code, setCode] = useState(nodeData.code || '.lpf(1000)');
  const isPlaying = seq?.playingNodes.has(id) ?? false;

  return (
    <div className={`node fx-node${isPlaying ? ' is-playing' : ''}`}>
      <div className="node-header">
        <span className="node-type">FX</span>
        <span className="node-label">{nodeData.label}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void seq?.previewNode(id);
          }}
          title="Preview effect"
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
          placeholder="Enter effect..."
          className="code-input"
          rows={2}
        />
        {nodeData.error && <div className="error-message">{nodeData.error}</div>}
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>
    </div>
  );
}

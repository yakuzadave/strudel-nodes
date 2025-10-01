import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { NodeData } from '../types';
import { useState } from 'react';

export function OutputNode({ data }: NodeProps) {
  const nodeData = data as NodeData;
  const [volume, setVolume] = useState(nodeData.volume || 0.8);
  const [pan, setPan] = useState(nodeData.pan || 0);

  return (
    <div className="node output-node">
      <div className="node-header">
        <span className="node-type">Output</span>
        <span className="node-label">{nodeData.label}</span>
      </div>
      <div className="node-content">
        <div className="mixer-control">
          <label>Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              nodeData.volume = val;
            }}
          />
          <span className="value">{(volume * 100).toFixed(0)}%</span>
        </div>
        <div className="mixer-control">
          <label>Pan</label>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={pan}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setPan(val);
              nodeData.pan = val;
            }}
          />
          <span className="value">{pan > 0 ? 'R' : pan < 0 ? 'L' : 'C'} {Math.abs(pan * 100).toFixed(0)}</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}

interface NodePaletteProps {
  onAddNode: (type: 'pattern' | 'transform' | 'fx' | 'output') => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <div className="node-palette">
      <h3>Add Nodes</h3>
      <button onClick={() => onAddNode('pattern')} className="palette-btn pattern">
        Pattern
      </button>
      <button onClick={() => onAddNode('transform')} className="palette-btn transform">
        Transform
      </button>
      <button onClick={() => onAddNode('fx')} className="palette-btn fx">
        FX
      </button>
      <button onClick={() => onAddNode('output')} className="palette-btn output">
        Output
      </button>
    </div>
  );
}

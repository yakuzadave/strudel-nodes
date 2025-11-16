interface NodePaletteProps {
  onAddNode: (type: 'pattern' | 'transform' | 'fx' | 'output') => void;
}

const paletteItems: Array<{
  type: 'pattern' | 'transform' | 'fx' | 'output';
  label: string;
  description: string;
}> = [
  { type: 'pattern', label: 'Pattern', description: 'Create rhythms & motifs' },
  { type: 'transform', label: 'Transform', description: 'Stretch, chop & evolve' },
  { type: 'fx', label: 'FX', description: 'Filter, delay & sculpt' },
  { type: 'output', label: 'Output', description: 'Mix, pan & send' },
];

export function NodePalette({ onAddNode }: NodePaletteProps) {
  return (
    <aside className="node-palette">
      <div className="node-palette__header">
        <div>
          <p className="node-palette__eyebrow">NODE LIBRARY</p>
          <h3>Assemble your patch</h3>
        </div>
        <p className="node-palette__hint">Drag nodes onto the canvas & link them together.</p>
      </div>
      <div className="palette-grid">
        {paletteItems.map((item) => (
          <button
            key={item.type}
            onClick={() => onAddNode(item.type)}
            className={`palette-btn ${item.type}`}
            type="button"
          >
            <span className="palette-btn__label">{item.label}</span>
            <span className="palette-btn__description">{item.description}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

interface ToolbarProps {
  isPlaying: boolean;
  isLoading: boolean;
  darkMode: boolean;
  snapToGrid: boolean;
  onPlay: () => void;
  onStop: () => void;
  onToggleDarkMode: () => void;
  onToggleSnapToGrid: () => void;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
}

export function Toolbar({
  isPlaying,
  isLoading,
  darkMode,
  snapToGrid,
  onPlay,
  onStop,
  onToggleDarkMode,
  onToggleSnapToGrid,
  onSave,
  onLoad,
  onClear,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <h1>Strudel Nodes</h1>
      </div>
      
      <div className="toolbar-section">
        <button
          onClick={isPlaying ? onStop : onPlay}
          disabled={isLoading}
          className="btn-primary"
        >
          {isPlaying ? '⏸ Stop' : '▶ Play'}
        </button>
      </div>

      <div className="toolbar-section">
        <button onClick={onSave} className="btn-secondary">
          💾 Save Patch
        </button>
        <button onClick={onLoad} className="btn-secondary">
          📂 Load Patch
        </button>
        <button onClick={onClear} className="btn-secondary">
          🗑️ Clear
        </button>
      </div>

      <div className="toolbar-section">
        <label className="toggle">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={onToggleSnapToGrid}
          />
          <span>Snap to Grid</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={onToggleDarkMode}
          />
          <span>Dark Mode</span>
        </label>
      </div>
    </div>
  );
}

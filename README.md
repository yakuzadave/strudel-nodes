# Strudel Nodes

A modular, node-based sequencer for Strudel patterns built in React. Create complex musical flows by connecting pattern, transform, and effect nodes in an intuitive visual interface.

## Features

- **🎵 Pattern Nodes**: Create Strudel patterns using the mini notation
- **🔄 Transform Nodes**: Apply transformations to patterns (speed, reverse, repeat, etc.)
- **🎛️ FX Nodes**: Add audio effects (filters, delays, reverbs, etc.)
- **🎚️ Output Nodes**: Control volume and pan for each signal path
- **🔗 Visual Connections**: Create sequential or parallel flows with drag-and-drop edges
- **🌓 Dark/Light Theme**: Toggle between dark and light modes
- **📐 Grid Snapping**: Align nodes cleanly with snap-to-grid
- **💾 Save/Load**: Export and import patches as JSON
- **⏯️ Real-time Playback**: Quantized to musical bars for tight synchronization
- **❌ Inline Errors**: See pattern errors directly in nodes

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

### Creating Nodes

Use the node palette on the left to add different types of nodes:

- **Pattern**: Source nodes that generate musical patterns
- **Transform**: Modify patterns with transformations
- **FX**: Apply audio effects
- **Output**: Final mixer with volume and pan controls

### Connecting Nodes

Click and drag from a node's output handle (right side) to another node's input handle (left side) to create connections. You can create multiple connections to build complex signal flows:

- **Sequential**: Chain nodes together for serial processing
- **Parallel**: Connect multiple outputs to one input for layering

### Pattern Examples

Pattern nodes use Strudel's mini notation:

```javascript
s("bd sd")              // Basic drum pattern
note("c e g").s("piano")  // Melodic pattern
"<c e g b>"             // Sequence
"[c e g]"               // Chord
```

### Transform Examples

Transform nodes modify incoming patterns:

```javascript
.fast(2)        // Double speed
.slow(2)        // Half speed
.rev()          // Reverse
.every(4, x => x.fast(2))  // Conditional transforms
```

### FX Examples

FX nodes add audio effects:

```javascript
.lpf(1000)      // Low-pass filter
.delay(0.5)     // Delay effect
.room(0.5)      // Reverb
.gain(0.8)      // Volume control
```

### Saving and Loading

- **Save**: Click "💾 Save Patch" to export your composition as JSON
- **Load**: Click "📂 Load Patch" to import a saved patch
- **Clear**: Click "🗑️ Clear" to remove all nodes (with confirmation)

## Controls

- **▶ Play/⏸ Stop**: Start and stop pattern playback
- **Snap to Grid**: Toggle grid snapping for cleaner layouts
- **Dark Mode**: Switch between dark and light themes

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Flow** - Node-based UI framework
- **Strudel** - Pattern sequencing engine
- **Web Audio API** - Audio synthesis and effects

## Architecture

The application uses a modular architecture:

- **Nodes**: Individual components representing different stages of audio processing
- **Edges**: Connections between nodes defining signal flow
- **Strudel Engine**: Pattern evaluation and audio synthesis
- **React Flow**: Visual canvas and interaction layer

Signal flows from Pattern nodes through Transform and FX nodes to Output nodes, where each node can be independently configured and combined in various ways.

## License

GNU General Public License v3.0 - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Built with [Strudel](https://strudel.cc/) - the live coding environment for algorithmic music patterns.

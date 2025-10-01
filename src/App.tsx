import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';

import { PatternNode } from './components/PatternNode';
import { TransformNode } from './components/TransformNode';
import { FXNode } from './components/FXNode';
import { OutputNode } from './components/OutputNode';
import { Toolbar } from './components/Toolbar';
import { NodePalette } from './components/NodePalette';
import { useStrudelEngine } from './hooks/useStrudelEngine';
import type { NodeData, PatchData } from './types';

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [darkMode, setDarkMode] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const { isPlaying, isLoading, play, stop } = useStrudelEngine();

  const nodeTypes = useMemo(
    () => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pattern: PatternNode as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      transform: TransformNode as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fx: FXNode as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output: OutputNode as any,
    }),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const addNode = useCallback(
    (type: 'pattern' | 'transform' | 'fx' | 'output') => {
      const id = `${type}-${Date.now()}`;
      const newNode: Node<NodeData> = {
        id,
        type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
          code: type === 'pattern' ? 's("bd sd")' : type === 'transform' ? '.fast(2)' : '.lpf(1000)',
          volume: type === 'output' ? 0.8 : undefined,
          pan: type === 'output' ? 0 : undefined,
          type,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes.length, setNodes]
  );

  const savePatch = useCallback(() => {
    const patch: PatchData = {
      nodes,
      edges,
      name: 'Untitled Patch',
      created: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(patch, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `strudel-patch-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [nodes, edges]);

  const loadPatch = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const patch: PatchData = JSON.parse(event.target?.result as string);
          setNodes(patch.nodes as Node<NodeData>[] || []);
          setEdges(patch.edges as Edge[] || []);
        } catch (error) {
          console.error('Failed to load patch:', error);
          alert('Failed to load patch file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges]);

  const clearCanvas = useCallback(() => {
    if (confirm('Clear all nodes and connections?')) {
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <Toolbar
        isPlaying={isPlaying}
        isLoading={isLoading}
        darkMode={darkMode}
        snapToGrid={snapToGrid}
        onPlay={play}
        onStop={stop}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
        onSave={savePatch}
        onLoad={loadPatch}
        onClear={clearCanvas}
      />
      <div className="main-content">
        <NodePalette onAddNode={addNode} />
        <div className="flow-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            snapToGrid={snapToGrid}
            snapGrid={[15, 15]}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

export default App;

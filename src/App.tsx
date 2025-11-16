import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
import { SequencerContext } from './SequencerContext';
import { createStaleRequestGuard } from './utils/staleRequestGuard';
import { compileStrudelPatch } from './utils/strudelGraph';

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [darkMode, setDarkMode] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const { isPlaying, isLoading, stop, evaluatePattern } = useStrudelEngine();

  const previewGuardRef = useRef(createStaleRequestGuard());
  const activePreviewRef = useRef<{ play?: () => void; stop?: () => void } | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playingNodes, setPlayingNodes] = useState<Set<string>>(new Set());

  const stopPreviewTimeout = useCallback(() => {
    if (previewTimeoutRef.current !== null) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  }, []);

  const stopActivePreview = useCallback(() => {
    stopPreviewTimeout();

    const activePreview = activePreviewRef.current;
    if (activePreview && typeof activePreview.stop === 'function') {
      try {
        activePreview.stop();
      } catch (error) {
        console.error('Failed to stop active preview:', error);
      }
    }

    activePreviewRef.current = null;
    setPlayingNodes(new Set());
  }, [stopPreviewTimeout]);

  const stopAllPatterns = useCallback(() => {
    previewGuardRef.current.invalidate();
    stopActivePreview();
  }, [stopActivePreview]);

  useEffect(() => {
    return () => {
      stopAllPatterns();
    };
  }, [stopAllPatterns]);

  const compiledPatch = useMemo(() => compileStrudelPatch(nodes, edges), [nodes, edges]);
  const compiledExpressions = compiledPatch.expressions;
  const compiledPatchCode = compiledPatch.patchCode;
  const previewNode = useCallback(
    async (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      const code = compiledExpressions.get(nodeId) ?? node?.data?.code;
      if (!code) {
        return;
      }

      const { isStale: isStaleRequest } = previewGuardRef.current.markNext();

      stopActivePreview();

      try {
        const result = await evaluatePattern(code);

        if (isStaleRequest()) {
          if (result && typeof result === 'object' && 'stop' in result && typeof result.stop === 'function') {
            try {
              result.stop();
            } catch (error) {
              console.error('Failed to stop stale preview:', error);
            }
          }
          return;
        }

        const playable =
          result && typeof result === 'object' && ('play' in result || 'stop' in result)
            ? (result as { play?: () => void; stop?: () => void })
            : null;

        activePreviewRef.current = playable;

        if (isStaleRequest()) {
          stopActivePreview();
          return;
        }

        if (playable && typeof playable.play === 'function') {
          playable.play();

          if (isStaleRequest()) {
            stopActivePreview();
            return;
          }
        }

        if (isStaleRequest()) {
          stopActivePreview();
          return;
        }

        setPlayingNodes(new Set([nodeId]));

        stopPreviewTimeout();
        previewTimeoutRef.current = setTimeout(() => {
          if (isStaleRequest()) {
            return;
          }
          stopActivePreview();
        }, 4000);
      } catch (error) {
        console.error('Failed to preview node:', error);
      }
    },
    [nodes, evaluatePattern, stopActivePreview, stopPreviewTimeout, compiledExpressions]
  );

  const handlePlay = useCallback(() => {
    stopAllPatterns();
    const code = compiledPatchCode;
    if (!code) {
      console.warn('No playable pattern found in the current patch.');
      return;
    }
    void evaluatePattern(code).catch((error) => {
      console.error('Failed to evaluate patch:', error);
    });
  }, [evaluatePattern, compiledPatchCode, stopAllPatterns]);

  const handleStop = useCallback(() => {
    stopAllPatterns();
    stop();
  }, [stop, stopAllPatterns]);

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
      const defaultCodeMap: Record<'pattern' | 'transform' | 'fx' | 'output', string> = {
        pattern: 's("bd sd")',
        transform: '.fast(2)',
        fx: '.lpf(1000)',
        output: '',
      };
      const newNode: Node<NodeData> = {
        id,
        type,
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        },
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodes.length + 1}`,
          code: defaultCodeMap[type],
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
          setNodes(patch.nodes ?? []);
          setEdges(patch.edges ?? []);
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

  const sequencerContextValue = useMemo(
    () => ({
      previewNode,
      playingNodes,
    }),
    [previewNode, playingNodes]
  );

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      <Toolbar
        isPlaying={isPlaying}
        isLoading={isLoading}
        darkMode={darkMode}
        snapToGrid={snapToGrid}
        onPlay={handlePlay}
        onStop={handleStop}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
        onSave={savePatch}
        onLoad={loadPatch}
        onClear={clearCanvas}
      />
      <div className="main-content">
        <NodePalette onAddNode={addNode} />
        <div className="flow-container">
          <SequencerContext.Provider value={sequencerContextValue}>
            <ReactFlow
              className="sequencer-flow"
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDoubleClick={(_, node) => {
                void previewNode(node.id);
              }}
              nodeTypes={nodeTypes}
              snapToGrid={snapToGrid}
              snapGrid={[15, 15]}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </SequencerContext.Provider>
        </div>
      </div>
    </div>
  );
}

export default App;

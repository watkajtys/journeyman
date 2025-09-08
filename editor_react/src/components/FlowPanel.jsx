import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { convertStoryToFlow } from '../utils/story-converter';

export default function FlowPanel({ nodes: storyNodes, onNodeClick }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    const { initialNodes, initialEdges } = convertStoryToFlow(storyNodes);
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [storyNodes]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  return (
    <div style={{ flexGrow: 1, height: '100vh', backgroundColor: '#1c1c1c' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick} // Pass the handler to React Flow
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}

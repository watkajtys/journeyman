import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * A panel that displays the story graph using ReactFlow.
 * It converts the story data into nodes and edges and renders them in a flow chart.
 * @param {object} props - The component props.
 * @param {object} props.nodes - The story nodes from the main story data.
 * @param {function} props.onNodeClick - The function to call when a node is clicked.
 * @returns {JSX.Element} The rendered FlowPanel component.
 */


const TEST_EDGES = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    type: 'smoothstep',
    animated: true,
  },
  {
    id: 'edge-2-3',
    source: 'node-2',
    target: 'node-3',
    type: 'smoothstep',
    animated: true,
  }
];

function Flow({ nodes: storyNodes, onNodeClick, selectedNodeId }) {
  const [nodes, setNodes] = useState(TEST_NODES);
  const [edges, setEdges] = useState(TEST_EDGES);

  // Log for debugging
  useEffect(() => {
    console.log('FlowPanel mounted');
    console.log('Initial nodes:', TEST_NODES);
    console.log('Initial edges:', TEST_EDGES);
  }, []);

  // Convert story nodes to flow format
  useEffect(() => {
    if (!storyNodes || Object.keys(storyNodes).length === 0) {
      console.log('No story nodes provided, using test nodes');
      return;
    }

    console.log('Converting story nodes:', storyNodes);
    
    const flowNodes = [];
    const flowEdges = [];
    
    // Simple linear layout
    let xPos = 100;
    const yPos = 200;
    const spacing = 250;
    
    Object.entries(storyNodes).forEach(([nodeId, node], index) => {
      const flowNode = {
        id: nodeId,
        type: 'default',
        position: { x: xPos, y: yPos },
        data: { 
          label: `${nodeId}\n${node.text?.substring(0, 30) || 'No text'}...` 
        },
        style: {
          backgroundColor: index === 0 ? '#4ade80' : '#2a2a2a',
          color: '#fff',
          border: '2px solid #555',
          borderRadius: '8px',
          width: 200,
          minHeight: 80,
          fontSize: '11px',
          padding: '10px',
        }
      };
      
      flowNodes.push(flowNode);
      console.log(`Node ${nodeId} positioned at (${xPos}, ${yPos})`);
      xPos += spacing;
      
      // Add edges for choices
      if (node.choices) {
        node.choices.forEach((choice, choiceIndex) => {
          if (choice.target_id && storyNodes[choice.target_id]) {
            flowEdges.push({
              id: `${nodeId}-${choice.target_id}-${choiceIndex}`,
              source: nodeId,
              target: choice.target_id,
              type: 'smoothstep',
              animated: true,
              label: choice.text?.substring(0, 20) + '...',
            });
          }
        });
      }
    });
    
    console.log('Created flow nodes:', flowNodes);
    console.log('Created flow edges:', flowEdges);
    
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [storyNodes]);

  const onNodesChange = useCallback(
    (changes) => {
      console.log('Node changes:', changes);
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const handleNodeClick = useCallback((event, node) => {
    console.log('Node clicked:', node);
    if (onNodeClick) {
      onNodeClick(event, node);
    }
  }, [onNodeClick]);

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#1c1c1c' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeClick={handleNodeClick}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background variant="dots" gap={20} size={1} color="#333" />
      </ReactFlow>
    </div>
  );
}

export default function FlowPanel({ nodes: storyNodes, onNodeClick, selectedNodeId }) {
  console.log('FlowPanel component rendering');
  
  return (
    <ReactFlowProvider>
      <Flow 
        nodes={storyNodes} 
        onNodeClick={onNodeClick} 
        selectedNodeId={selectedNodeId}
      />
    </ReactFlowProvider>
  );
}
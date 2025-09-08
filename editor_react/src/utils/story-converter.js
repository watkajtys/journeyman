export const convertStoryToFlow = (storyNodes) => {
  const initialNodes = [];
  const initialEdges = [];

  if (!storyNodes) {
    return { initialNodes: [], initialEdges: [] };
  }

  // Preserve the story order from the JSON (which represents narrative flow)
  const nodeEntries = Object.entries(storyNodes);
  
  // Create a map to track which nodes have been placed
  const placedNodes = new Set();
  const nodePositions = {};
  
  // Layout configuration
  const HORIZONTAL_SPACING = 300;
  const VERTICAL_SPACING = 120;
  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 100;
  const NODES_PER_ROW = 5; // How many nodes to show per row before wrapping
  
  // First pass: lay out nodes in story order (as they appear in the JSON)
  nodeEntries.forEach(([nodeId, node], index) => {
    // Calculate position in a flowing grid that reads left-to-right, top-to-bottom
    const row = Math.floor(index / NODES_PER_ROW);
    const col = index % NODES_PER_ROW;
    
    const x = col * HORIZONTAL_SPACING;
    const y = row * VERTICAL_SPACING;
    
    nodePositions[nodeId] = { x, y, index };
    placedNodes.add(nodeId);
  });
  
  // Build edges and track connections
  const connectionMap = {};
  Object.values(storyNodes).forEach((node) => {
    if (node.choices) {
      node.choices.forEach((choice, choiceIndex) => {
        if (choice.target_id && storyNodes[choice.target_id]) {
          // Track connections for visual hints
          if (!connectionMap[node.id]) connectionMap[node.id] = [];
          connectionMap[node.id].push(choice.target_id);
          
          // Create edge
          initialEdges.push({
            id: `e-${node.id}->${choice.target_id}-${choiceIndex}`,
            source: node.id,
            target: choice.target_id,
            label: choice.text?.substring(0, 25) + (choice.text?.length > 25 ? '...' : ''),
            animated: true,
            type: 'smoothstep', // Use smooth step edges for better readability
            style: {
              strokeWidth: 2,
              stroke: '#666',
            },
            labelStyle: {
              fill: '#fff',
              fontWeight: 400,
              fontSize: 10,
            },
            labelBgStyle: {
              fill: '#1a1a1a',
              fillOpacity: 0.9,
            },
          });
        }
      });
    }
  });
  
  // Create nodes with visual styling based on their role
  nodeEntries.forEach(([nodeId, node], index) => {
    const position = nodePositions[nodeId];
    
    // Determine node styling
    let backgroundColor = '#2a2a2a';
    let borderColor = '#555';
    let textColor = '#fff';
    let borderWidth = '2px';
    
    // First node (usually opening_scene)
    if (index === 0) {
      backgroundColor = '#1e4620';
      borderColor = '#4ade80';
      borderWidth = '3px';
    }
    // Start node (if different from first)
    else if (nodeId === 'start') {
      backgroundColor = '#1e4620';
      borderColor = '#4ade80';
    }
    // Ending nodes (no choices)
    else if (!node.choices || node.choices.length === 0) {
      backgroundColor = '#4a1e1e';
      borderColor = '#ef4444';
    }
    // Hub nodes (many connections)
    else if (node.choices && node.choices.length > 3) {
      backgroundColor = '#1e3a4a';
      borderColor = '#3b82f6';
    }
    // Transition nodes (contain "transition" in ID)
    else if (nodeId.includes('transition')) {
      backgroundColor = '#3a2e1e';
      borderColor = '#f59e0b';
    }
    
    // Create informative label
    const truncatedText = node.text ? 
      node.text.substring(0, 60) + (node.text.length > 60 ? '...' : '') : 
      'No text';
    
    const choiceCount = node.choices ? node.choices.length : 0;
    const choiceText = choiceCount > 0 ? 
      `${choiceCount} choice${choiceCount !== 1 ? 's' : ''}` : 
      'END';
    
    // Position indicator for debugging/reference
    const positionText = `[${index + 1}/${nodeEntries.length}]`;
    
    const label = `${nodeId}\n${truncatedText}\n${choiceText} ${positionText}`;
    
    initialNodes.push({
      id: nodeId,
      data: { 
        label: label,
        nodeId: nodeId,
        text: truncatedText,
        choiceCount: choiceCount,
        storyIndex: index
      },
      position: { 
        x: position.x,
        y: position.y
      },
      type: 'default',
      style: {
        backgroundColor,
        border: `${borderWidth} solid ${borderColor}`,
        borderRadius: '8px',
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        fontSize: '11px',
        color: textColor,
        padding: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        whiteSpace: 'pre-line',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    });
  });

  return { initialNodes, initialEdges };
};
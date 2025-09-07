export const convertStoryToFlow = (storyNodes) => {
  const initialNodes = [];
  const initialEdges = [];

  if (!storyNodes) {
    return { initialNodes: [], initialEdges: [] };
  }

  // A simple vertical auto-layout algorithm
  let yPos = 0;
  const xPos = 100;

  Object.values(storyNodes).forEach((node) => {
    // Create a React Flow node for each story node
    initialNodes.push({
      id: node.id,
      data: { label: node.id }, // Display the node ID as its label
      position: { x: xPos, y: yPos },
      type: 'default', // Using the default node style for now
    });

    yPos += 100; // Increment Y position to stack nodes vertically

    // Create edges for each choice leading from the current node
    if (node.choices) {
      node.choices.forEach((choice, choiceIndex) => {
        // Ensure the choice has a target to connect to
        if (choice.target_id) {
          initialEdges.push({
            id: `e-${node.id}->${choice.target_id}-${choiceIndex}`, // Unique edge ID
            source: node.id,
            target: choice.target_id,
            label: choice.text, // Display the choice text on the edge
            animated: true, // Make the edge animated
          });
        }
      });
    }
  });

  return { initialNodes, initialEdges };
};

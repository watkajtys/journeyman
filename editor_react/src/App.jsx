import { useState, useEffect, useCallback } from 'react';
import 'reactflow/dist/style.css';
import FlowPanel from './components/FlowPanel';
import NodeEditorPanel from './components/NodeEditorPanel';
import ElementsPanel from './components/ElementsPanel';
import './App.css';

function App() {
  const [storyData, setStoryData] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        setLoading(true);
        let response = await fetch('/api/load');
        if (!response.ok) {
          if (response.status === 404) {
            console.log("No saved story in cloud. Loading default local story.json.");
            response = await fetch('/story.json');
          } else {
            throw new Error(`Cloud load failed! Server responded with ${response.status}`);
          }
        }
        const data = await response.json();
        // Ensure consistent elements keys exist
        if (!data.style_guides) data.style_guides = {};
        if (!data.characters) data.characters = {};
        if (!data.locations) data.locations = {};
        setStoryData(data);
      } catch (err) {
        setError(err.message);
        console.error("Failed to load story data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStoryData();
  }, []);

  // --- State Update Handlers ---

  const handleNodeChange = useCallback((nodeId, field, value) => {
    setStoryData(currentData => {
      const newNode = { ...currentData.nodes[nodeId], [field]: value };
      const newNodes = { ...currentData.nodes, [nodeId]: newNode };
      return { ...currentData, nodes: newNodes };
    });
  }, []);

  const handleChoiceChange = useCallback((nodeId, choiceIndex, field, value) => {
    setStoryData(currentData => {
      const newChoices = [...currentData.nodes[nodeId].choices];
      newChoices[choiceIndex] = { ...newChoices[choiceIndex], [field]: value };
      const newNode = { ...currentData.nodes[nodeId], choices: newChoices };
      const newNodes = { ...currentData.nodes, [nodeId]: newNode };
      return { ...currentData, nodes: newNodes };
    });
  }, []);

  const handleAddChoice = useCallback((nodeId) => {
    setStoryData(currentData => {
      const currentChoices = currentData.nodes[nodeId].choices || [];
      const newChoices = [...currentChoices, { text: "New Choice", target_id: "" }];
      const newNode = { ...currentData.nodes[nodeId], choices: newChoices };
      const newNodes = { ...currentData.nodes, [nodeId]: newNode };
      return { ...currentData, nodes: newNodes };
    });
  }, []);

  const handleDeleteChoice = useCallback((nodeId, choiceIndex) => {
    setStoryData(currentData => {
      const newChoices = [...currentData.nodes[nodeId].choices];
      newChoices.splice(choiceIndex, 1);
      const newNode = { ...currentData.nodes[nodeId], choices: newChoices };
      const newNodes = { ...currentData.nodes, [nodeId]: newNode };
      return { ...currentData, nodes: newNodes };
    });
  }, []);

  const handleAddNode = useCallback(() => {
    const newNodeId = prompt("Enter a unique ID for the new node:");
    if (!newNodeId) return;
    if (storyData.nodes[newNodeId]) {
      alert("A node with this ID already exists.");
      return;
    }
    setStoryData(currentData => {
      const newNodes = {
        ...currentData.nodes,
        [newNodeId]: { id: newNodeId, text: "New node text.", image_prompt: "", choices: [] }
      };
      return { ...currentData, nodes: newNodes };
    });
    setSelectedNodeId(newNodeId);
  }, [storyData]);

  const handleDeleteNode = useCallback((nodeId) => {
    if (!nodeId || !confirm(`Are you sure you want to delete node "${nodeId}"? This cannot be undone.`)) {
      return;
    }
    setStoryData(currentData => {
      const newNodes = { ...currentData.nodes };
      delete newNodes[nodeId];
      Object.values(newNodes).forEach(node => {
        if (node.choices) {
          node.choices = node.choices.filter(c => c.target_id !== nodeId);
        }
      });
      return { ...currentData, nodes: newNodes };
    });
    setSelectedNodeId(null);
  }, []);

  const handleElementChange = useCallback((category, elementId, value) => {
    setStoryData(currentData => {
      const newCategory = { ...currentData[category] };
      if (typeof newCategory[elementId] === 'object') {
        newCategory[elementId] = { ...newCategory[elementId], description: value };
      } else {
        newCategory[elementId] = value;
      }
      return { ...currentData, [category]: newCategory };
    });
  }, []);

  const handleAddElement = useCallback((category) => {
    const elementId = prompt(`Enter new ID for ${category.replace('_', ' ')}:`);
    if (!elementId || storyData[category]?.[elementId]) {
      alert(elementId ? "This ID already exists." : "Invalid ID.");
      return;
    }
    setStoryData(currentData => {
      const newElement = category === 'style_guides' ? "New description." : { description: "New description." };
      const newCategory = { ...currentData[category], [elementId]: newElement };
      return { ...currentData, [category]: newCategory };
    });
  }, [storyData]);

  const handleDeleteElement = useCallback((category, elementId) => {
    if (!confirm(`Are you sure you want to delete ${elementId} from ${category}?`)) return;
    setStoryData(currentData => {
      const newCategory = { ...currentData[category] };
      delete newCategory[elementId];
      return { ...currentData, [category]: newCategory };
    });
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyData),
      });
      if (!response.ok) throw new Error(`Save failed! Server responded with ${response.status}`);
      alert('Story saved successfully!');
    } catch (err) {
      alert(`Error saving story: ${err.message}`);
      console.error(err);
    }
  };

  const selectedNode = storyData?.nodes?.[selectedNodeId] || null;

  if (loading) return <div>Loading story...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!storyData) return <div>No story data available.</div>;

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="top-bar">
          <h1>React Flow Editor</h1>
          <div>
            <button onClick={handleAddNode} style={{marginRight: '10px'}}>Add Node</button>
            <button onClick={handleSave}>Save to Cloud</button>
          </div>
        </div>
        <div className="panels-container">
          <ElementsPanel
            storyData={storyData}
            onElementChange={handleElementChange}
            onAddElement={handleAddElement}
            onDeleteElement={handleDeleteElement}
          />
          <FlowPanel
            nodes={storyData.nodes}
            onNodeClick={(event, node) => setSelectedNodeId(node.id)}
          />
          <NodeEditorPanel
            key={selectedNodeId}
            storyData={storyData}
            selectedNode={selectedNode}
            onNodeChange={handleNodeChange}
            onChoiceChange={handleChoiceChange}
            onAddChoice={handleAddChoice}
            onDeleteChoice={handleDeleteChoice}
            onDeleteNode={handleDeleteNode}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

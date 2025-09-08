import { useState } from 'react';
import { constructFinalPrompt } from '../utils/prompt-builder.js';

// This should be stored securely in a real app, e.g., in environment variables.
// We get this from the old script for now. A future step could be to get this from the worker env.
const API_KEY = 'AIzaSyC7puMSiLTOJJAY5Uf90L6MwtwJQwj44dg';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';


export default function NodeEditorPanel({
  storyData,
  selectedNode,
  onNodeChange,
  onChoiceChange,
  onAddChoice,
  onDeleteChoice,
  onDeleteNode,
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [useReference, setUseReference] = useState(false);

  if (!selectedNode) {
    return (
      <div style={{ width: '350px', borderLeft: '1px solid #555', padding: '10px', backgroundColor: '#2a2a2a' }}>
        <h2>Node Editor</h2>
        <p>Select a node from the graph to edit its properties.</p>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onNodeChange(selectedNode.id, name, value);
  };

  const handleGenerateImage = async () => {
    const finalPrompt = constructFinalPrompt(selectedNode, storyData);
    console.log("Generating image with prompt:", finalPrompt);

    setIsGenerating(true);

    const currentImage = selectedNode.pre_rendered_image;
    if (useReference && !currentImage) {
        alert("Please generate a base image first before using it as a reference.");
        setIsGenerating(false);
        return;
    }

    try {
        const parts = [{ text: finalPrompt }];
        if (useReference && currentImage) {
            const base64Data = currentImage.split(',')[1];
            parts.unshift({ inlineData: { mimeType: 'image/png', data: base64Data } });
            parts.unshift({ text: "Use the previous image as a strong reference for the environment, characters, and art style. Then, create a new image that follows the new prompt:" });
        }

        const payload = {
            contents: [{ parts: parts }],
            safetySettings: [
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };

        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API Error: ${errorBody.error.message}`);
        }

        const data = await response.json();
        const imagePart = data.candidates[0]?.content?.parts.find(p => p.inlineData);
        if (!imagePart) throw new Error("No image data found in API response.");

        const imageSrc = `data:image/png;base64,${imagePart.inlineData.data}`;
        onNodeChange(selectedNode.id, 'pre_rendered_image', imageSrc);

    } catch (error) {
        alert(`Failed to generate image: ${error.message}`);
        console.error(error);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleClearImage = () => {
      if (confirm('Are you sure you want to clear the pre-rendered image?')) {
          onNodeChange(selectedNode.id, 'pre_rendered_image', undefined);
      }
  };


  return (
    <div style={{ width: '350px', borderLeft: '1px solid #555', padding: '10px', backgroundColor: '#2a2a2a', overflowY: 'auto' }}>
      <h2 style={{marginTop: 0}}>Edit Node: {selectedNode.id}</h2>
      <form onSubmit={(e) => e.preventDefault()}>
        {/* Text and Image Prompt Textareas */}
        <div className="form-group">
          <label htmlFor="node-text">Text</label>
          <textarea id="node-text" name="text" rows="6" value={selectedNode.text || ''} onChange={handleInputChange} style={{ width: '100%', backgroundColor: '#333', color: '#f0f0f0', border: '1px solid #555', borderRadius: '4px', padding: '8px' }}/>
        </div>
        <div className="form-group" style={{ marginTop: '15px' }}>
          <label htmlFor="node-image-prompt">Image Prompt</label>
          <textarea id="node-image-prompt" name="image_prompt" rows="6" value={selectedNode.image_prompt || ''} onChange={handleInputChange} style={{ width: '100%', backgroundColor: '#333', color: '#f0f0f0', border: '1px solid #555', borderRadius: '4px', padding: '8px' }}/>
        </div>

        {/* Image Prerender Section */}
        <div className="form-group prerender-container">
            <h3>Image Prerender</h3>
            <div className="image-preview-wrapper">
                {isGenerating && <div className="loading-spinner"></div>}
                {!isGenerating && selectedNode.pre_rendered_image && <img src={selectedNode.pre_rendered_image} alt="Preview" />}
            </div>
            <div className="prerender-actions">
                <button onClick={handleGenerateImage} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate Image'}
                </button>
                <button onClick={handleClearImage} disabled={isGenerating || !selectedNode.pre_rendered_image}>
                    Clear Image
                </button>
                <div className="checkbox-wrapper">
                    <input type="checkbox" id="use-reference" checked={useReference} onChange={(e) => setUseReference(e.target.checked)} disabled={!selectedNode.pre_rendered_image} />
                    <label htmlFor="use-reference">Use current image as reference</label>
                </div>
            </div>
        </div>

        {/* Choices Section */}
        <div className="form-group" style={{ marginTop: '20px' }}>
          <h3>Choices</h3>
          {(selectedNode.choices || []).map((choice, index) => (
            <div key={index} className="choice-editor">
              <input type="text" placeholder="Choice Text" value={choice.text} onChange={(e) => onChoiceChange(selectedNode.id, index, 'text', e.target.value)} />
              <input type="text" placeholder="Target Node ID" value={choice.target_id} onChange={(e) => onChoiceChange(selectedNode.id, index, 'target_id', e.target.value)} />
              <button type="button" onClick={() => onDeleteChoice(selectedNode.id, index)}>X</button>
            </div>
          ))}
          <button type="button" onClick={() => onAddChoice(selectedNode.id)} style={{ width: '100%', marginTop: '10px', backgroundColor: '#4a4a4a' }}>
            Add Choice
          </button>
        </div>

        <hr style={{border: 'none', borderTop: '1px solid #444', marginTop: '20px'}} />

        <button type="button" onClick={() => onDeleteNode(selectedNode.id)} className="delete-node-btn">
          Delete This Node
        </button>
      </form>
    </div>
  );
}

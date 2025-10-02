import { useState } from 'react';
import { constructFinalPrompt } from '../utils/prompt-builder.js';

// API configuration - now uses secure server-side endpoint
// The API key is stored securely on the server
const API_URL = '/api/generate-image';


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

    // Check for image in either format (R2 URL or base64)
    const currentImage = selectedNode.pre_rendered_image || selectedNode.image_url;
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

        // Prepare context image if available
        let contextImage = null;
        if (useReference && currentImage) {
            // Extract base64 data
            if (currentImage.startsWith('data:')) {
                contextImage = currentImage.split(',')[1];
            } else {
                // If it's an R2 URL, we'd need to fetch it first
                // For now, skip reference for R2 URLs
                contextImage = null;
            }
        }
        
        // Extract prompt text
        const promptText = parts.filter(p => p.text).map(p => p.text).join('. ');
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Token': sessionStorage.getItem('adminToken') || '' // Admin token for React editor
            },
            body: JSON.stringify({
                prompt: promptText,
                contextImage: contextImage
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`API Error: ${errorBody.error.message}`);
        }

        const data = await response.json();
        
        let base64ImageData;
        // Handle response from our worker endpoint
        if (data.candidates?.[0]?.content?.parts) {
            // Response from Gemini via worker
            const imagePart = data.candidates[0].content.parts.find(p => p.inlineData);
            if (!imagePart) throw new Error("No image data found in API response.");
            base64ImageData = imagePart.inlineData.data;
        } else if (data.image) {
            // Direct image response from worker
            base64ImageData = data.image;
        } else {
            throw new Error("Invalid response format from server");
        }
        
        const imageSrc = `data:image/png;base64,${base64ImageData}`;
        onNodeChange(selectedNode.id, 'pre_rendered_image', imageSrc);

    } catch (error) {
        alert(`Failed to generate image: ${error.message}`);
        console.error(error);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleClearImage = () => {
      if (confirm('Are you sure you want to clear the image?')) {
          onNodeChange(selectedNode.id, 'pre_rendered_image', undefined);
          onNodeChange(selectedNode.id, 'image_url', undefined);
      }
  };


  return (
    <div style={{ 
      width: '320px',
      minWidth: '280px',
      maxWidth: '400px',
      borderLeft: '1px solid #555', 
      padding: '10px', 
      backgroundColor: '#2a2a2a', 
      overflowY: 'auto',
      height: '100%',
      flexShrink: 0
    }}>
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
                {!isGenerating && (selectedNode.pre_rendered_image || selectedNode.image_url) && (
                    <img 
                        src={selectedNode.pre_rendered_image || `/api/images/${encodeURIComponent(selectedNode.id)}`} 
                        alt="Preview" 
                        onError={(e) => {
                            // If R2 image fails to load, hide it
                            if (selectedNode.image_url && !selectedNode.pre_rendered_image) {
                                e.target.style.display = 'none';
                            }
                        }}
                    />
                )}
            </div>
            
            {/* Display generation history gallery if available */}
            {storyData.generation_history && storyData.generation_history[selectedNode.id] && storyData.generation_history[selectedNode.id].length > 0 && (
                <div style={{ marginTop: '15px' }}>
                    <h4 style={{ fontSize: '0.9em', marginBottom: '8px', color: '#888' }}>
                        Generation History ({storyData.generation_history[selectedNode.id].length} versions)
                    </h4>
                    <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        overflowX: 'auto', 
                        padding: '8px 0',
                        marginBottom: '10px'
                    }}>
                        {storyData.generation_history[selectedNode.id].map((historyItem, idx) => (
                            <div 
                                key={idx} 
                                style={{ 
                                    position: 'relative',
                                    minWidth: '80px',
                                    height: '80px',
                                    border: historyItem.image === (selectedNode.pre_rendered_image || selectedNode.image_url) ? '2px solid #667eea' : '1px solid #555',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                                onClick={() => {
                                    if (confirm('Use this version as the current image?')) {
                                        onNodeChange(selectedNode.id, 'pre_rendered_image', historyItem.image);
                                        onNodeChange(selectedNode.id, 'image_url', undefined);
                                    }
                                }}
                                title={`Generated: ${new Date(historyItem.timestamp).toLocaleString()}${historyItem.notes ? '\nNotes: ' + historyItem.notes : ''}`}
                            >
                                <img 
                                    src={historyItem.image} 
                                    alt={`Version ${idx + 1}`}
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover' 
                                    }}
                                />
                                {historyItem.isOriginal && (
                                    <span style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        background: '#10b981',
                                        color: 'white',
                                        fontSize: '10px',
                                        padding: '1px 4px',
                                        borderRadius: '2px',
                                        fontWeight: 'bold'
                                    }}>
                                        ORIG
                                    </span>
                                )}
                                {idx === 0 && !historyItem.isOriginal && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '2px',
                                        right: '2px',
                                        background: '#f59e0b',
                                        color: 'black',
                                        fontSize: '10px',
                                        padding: '1px 4px',
                                        borderRadius: '2px',
                                        fontWeight: 'bold'
                                    }}>
                                        NEW
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="prerender-actions">
                <button onClick={handleGenerateImage} disabled={isGenerating}>
                    {isGenerating ? 'Generating...' : 'Generate Image'}
                </button>
                <button onClick={handleClearImage} disabled={isGenerating || (!selectedNode.pre_rendered_image && !selectedNode.image_url)}>
                    Clear Image
                </button>
                <div className="checkbox-wrapper">
                    <input type="checkbox" id="use-reference" checked={useReference} onChange={(e) => setUseReference(e.target.checked)} disabled={!selectedNode.pre_rendered_image && !selectedNode.image_url} />
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

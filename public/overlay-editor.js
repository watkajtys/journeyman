// Overlay Editor JavaScript
class OverlayEditor {
  constructor() {
    this.isOpen = false;
    this.currentNode = null;
    this.generationHistory = {};
    this.refinementNotes = {};
    this.isGenerating = false;
    
    // API configuration (uses same key as main game)
    this.API_KEY = 'AIzaSyBNRc6wowYEBTxxu-44AP6AkrYScl0Yafk';
    this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';
    
    this.init();
  }
  
  init() {
    this.createElements();
    this.attachEventListeners();
    this.startSyncInterval();
    console.log('Overlay Editor initialized');
  }
  
  createElements() {
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'overlay-editor-toggle';
    toggleBtn.innerHTML = '🎨';
    toggleBtn.title = 'Open Image Editor';
    document.body.appendChild(toggleBtn);
    
    // Create overlay panel
    const panel = document.createElement('div');
    panel.className = 'overlay-editor-panel';
    panel.innerHTML = `
      <div class="overlay-editor-header">
        <h2>Scene Image Editor</h2>
        <div class="scene-info">
          <span class="scene-id">Scene: <span id="editor-scene-id">-</span></span>
          <span class="scene-location">Location: <span id="editor-scene-location">-</span></span>
        </div>
      </div>
      
      <div class="overlay-editor-content">
        <!-- Progress Section -->
        <div class="progress-section">
          <div class="progress-label">Story Progress</div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-stats">
            <span id="progress-current">0 scenes with images</span>
            <span id="progress-total">0 total scenes</span>
          </div>
        </div>
        
        <!-- Scene Text -->
        <div class="scene-text-section">
          <h3>Scene Text</h3>
          <div class="scene-text" id="editor-scene-text">
            No scene loaded
          </div>
        </div>
        
        <!-- Current Image -->
        <div class="image-section">
          <h3>Current Image</h3>
          <div class="current-image-container" id="current-image-container">
            <div class="no-image-placeholder">
              <i>🖼️</i>
              <p>No image generated yet</p>
            </div>
          </div>
          
          <!-- Loading Spinner -->
          <div class="generating-spinner" id="generating-spinner">
            <div class="spinner"></div>
            <p>Generating image...</p>
          </div>
        </div>
        
        <!-- Image Prompt -->
        <div class="prompt-section">
          <h3>Image Prompt</h3>
          <textarea 
            class="prompt-textarea" 
            id="editor-image-prompt"
            placeholder="Describe what the image should show..."
          ></textarea>
        </div>
        
        <!-- Refinement Notes -->
        <div class="notes-section">
          <h3>Refinement Notes (optional)</h3>
          <textarea 
            class="notes-textarea" 
            id="editor-refinement-notes"
            placeholder="Add notes for improving the image (e.g., 'make it darker', 'add more detail to the background')"
          ></textarea>
        </div>
        
        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn-generate" id="btn-generate">
            Generate Image
          </button>
          <button class="btn-regenerate" id="btn-regenerate">
            Regenerate with Notes
          </button>
          <button class="btn-clear" id="btn-clear">
            Clear Image
          </button>
        </div>
        
        <!-- Generation History -->
        <div class="history-section" id="history-section" style="display: none;">
          <h3 class="history-title">Generation History</h3>
          <div class="history-grid" id="history-grid">
            <!-- History items will be added here -->
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    
    // Store references
    this.toggleBtn = toggleBtn;
    this.panel = panel;
  }
  
  attachEventListeners() {
    // Toggle button
    this.toggleBtn.addEventListener('click', () => this.toggle());
    
    // Generate button
    document.getElementById('btn-generate').addEventListener('click', () => {
      this.generateImage(false);
    });
    
    // Regenerate with notes button
    document.getElementById('btn-regenerate').addEventListener('click', () => {
      this.generateImage(true);
    });
    
    // Clear button
    document.getElementById('btn-clear').addEventListener('click', () => {
      this.clearImage();
    });
    
    // Save prompt changes
    document.getElementById('editor-image-prompt').addEventListener('blur', () => {
      this.savePromptChanges();
    });
    
    // Save notes changes
    document.getElementById('editor-refinement-notes').addEventListener('blur', () => {
      this.saveNotesChanges();
    });
  }
  
  toggle() {
    this.isOpen = !this.isOpen;
    this.toggleBtn.classList.toggle('active', this.isOpen);
    this.panel.classList.toggle('active', this.isOpen);
    
    if (this.isOpen) {
      // Pause the game and stop any ongoing generation
      this.pauseGame();
      this.syncWithGame();
    } else {
      // Resume the game when closing
      this.resumeGame();
    }
  }
  
  pauseGame() {
    // Stop any ongoing image generation
    if (window.generationController) {
      window.generationController.abort();
      console.log('Stopped ongoing image generation');
    }
    
    // Set a global flag to pause auto-transitions
    window.overlayEditorOpen = true;
    
    // Disable choice buttons temporarily
    const choices = document.querySelectorAll('#choices-container button');
    choices.forEach(btn => {
      btn.disabled = true;
      btn.dataset.wasDisabled = btn.dataset.wasDisabled || 'false';
    });
    
    console.log('Game paused for editing');
  }
  
  resumeGame() {
    // Clear the pause flag
    window.overlayEditorOpen = false;
    
    // Re-enable choice buttons that weren't previously disabled
    const choices = document.querySelectorAll('#choices-container button');
    choices.forEach(btn => {
      if (btn.dataset.wasDisabled !== 'true') {
        btn.disabled = false;
      }
    });
    
    console.log('Game resumed');
  }
  
  startSyncInterval() {
    // Sync with game state every 500ms when open
    setInterval(() => {
      if (this.isOpen) {
        this.syncWithGame();
      }
    }, 500);
  }
  
  syncWithGame() {
    // Get current game state from global variables
    if (typeof currentNodeId === 'undefined' || !window.storyData) {
      console.log('Game not ready yet');
      return;
    }
    
    if (currentNodeId !== this.currentNode) {
      this.currentNode = currentNodeId;
      this.loadCurrentScene();
    }
    
    this.updateProgress();
  }
  
  loadCurrentScene() {
    if (!this.currentNode || !window.storyData || !window.storyData.nodes) {
      return;
    }
    
    const node = window.storyData.nodes[this.currentNode];
    if (!node) {
      return;
    }
    
    // Update scene info
    document.getElementById('editor-scene-id').textContent = this.currentNode;
    document.getElementById('editor-scene-location').textContent = node.location || 'Unknown';
    document.getElementById('editor-scene-text').textContent = node.text || 'No text';
    
    // Update image prompt
    const promptField = document.getElementById('editor-image-prompt');
    promptField.value = node.image_prompt || '';
    
    // Load refinement notes if any
    const notesField = document.getElementById('editor-refinement-notes');
    notesField.value = this.refinementNotes[this.currentNode] || '';
    
    // Update current image
    this.updateImageDisplay();
    
    // Update history
    this.updateHistoryDisplay();
  }
  
  updateImageDisplay() {
    const container = document.getElementById('current-image-container');
    const node = window.storyData.nodes[this.currentNode];
    
    // Check for pre-rendered image or cached image
    const currentImage = node?.pre_rendered_image || window.imageCache?.[this.currentNode];
    
    if (currentImage) {
      container.innerHTML = `<img src="${currentImage}" alt="Scene image">`;
    } else {
      container.innerHTML = `
        <div class="no-image-placeholder">
          <i>🖼️</i>
          <p>No image generated yet</p>
        </div>
      `;
    }
  }
  
  updateProgress() {
    if (!window.storyData || !window.storyData.nodes) {
      return;
    }
    
    const totalNodes = Object.keys(window.storyData.nodes).length;
    let nodesWithImages = 0;
    
    for (const nodeId in window.storyData.nodes) {
      const node = window.storyData.nodes[nodeId];
      if (node.pre_rendered_image || window.imageCache?.[nodeId]) {
        nodesWithImages++;
      }
    }
    
    const percentage = totalNodes > 0 ? (nodesWithImages / totalNodes) * 100 : 0;
    
    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('progress-current').textContent = `${nodesWithImages} scenes with images`;
    document.getElementById('progress-total').textContent = `${totalNodes} total scenes`;
  }
  
  async generateImage(useNotes = false) {
    if (this.isGenerating || !this.currentNode) {
      return;
    }
    
    const node = window.storyData.nodes[this.currentNode];
    if (!node) {
      return;
    }
    
    this.isGenerating = true;
    this.setGeneratingState(true);
    
    try {
      // Build the prompt
      let prompt = document.getElementById('editor-image-prompt').value || node.image_prompt || '';
      
      if (useNotes) {
        const notes = document.getElementById('editor-refinement-notes').value;
        if (notes) {
          prompt = `${prompt}\n\nAdditional requirements: ${notes}`;
        }
      }
      
      // Add consistent style guides
      if (window.storyData.style_guides) {
        const styleGuides = Object.values(window.storyData.style_guides).join('\n');
        prompt = `${styleGuides}\n\n${prompt}`;
      }
      
      console.log('Generating image with prompt:', prompt);
      
      // Build parts array with prompt
      const parts = [{ text: prompt }];
      
      // If regenerating with notes, include current image as context
      if (useNotes) {
        const currentImage = node.pre_rendered_image || window.imageCache?.[this.currentNode];
        if (currentImage && currentImage.startsWith('data:image')) {
          // Extract base64 from data URL
          const base64Data = currentImage.split(',')[1];
          if (base64Data) {
            // Add image context like the main game does
            parts.unshift({ inlineData: { mimeType: 'image/png', data: base64Data } });
            parts.unshift({ text: "Use the previous image as a strong reference for the environment, characters, and art style. Apply the following refinements to create an improved version:" });
            console.log('Including current image as context for regeneration');
          }
        }
      }
      
      // Call Gemini API
      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: parts
          }],
          safetySettings: [
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      const imagePart = data.candidates[0]?.content?.parts?.find(p => p.inlineData);
      
      if (!imagePart) {
        throw new Error('No image data in response');
      }
      
      const imageData = `data:image/png;base64,${imagePart.inlineData.data}`;
      
      // Save to cache and story
      if (!window.imageCache) {
        window.imageCache = {};
      }
      window.imageCache[this.currentNode] = imageData;
      node.pre_rendered_image = imageData;
      
      // Add to history
      if (!this.generationHistory[this.currentNode]) {
        this.generationHistory[this.currentNode] = [];
      }
      this.generationHistory[this.currentNode].unshift({
        image: imageData,
        prompt: prompt,
        notes: useNotes ? document.getElementById('editor-refinement-notes').value : '',
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 5 generations
      if (this.generationHistory[this.currentNode].length > 5) {
        this.generationHistory[this.currentNode] = this.generationHistory[this.currentNode].slice(0, 5);
      }
      
      // Update displays
      this.updateImageDisplay();
      this.updateHistoryDisplay();
      this.updateProgress();
      
      // Save to cloud
      this.saveToCloud();
      
      console.log('Image generated successfully');
      
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert(`Failed to generate image: ${error.message}`);
    } finally {
      this.isGenerating = false;
      this.setGeneratingState(false);
    }
  }
  
  clearImage() {
    if (!this.currentNode || !confirm('Are you sure you want to clear this image?')) {
      return;
    }
    
    const node = window.storyData.nodes[this.currentNode];
    if (node) {
      delete node.pre_rendered_image;
    }
    
    if (window.imageCache) {
      delete window.imageCache[this.currentNode];
    }
    
    this.updateImageDisplay();
    this.updateProgress();
    this.saveToCloud();
  }
  
  savePromptChanges() {
    if (!this.currentNode) return;
    
    const node = window.storyData.nodes[this.currentNode];
    if (node) {
      node.image_prompt = document.getElementById('editor-image-prompt').value;
      this.saveToCloud();
    }
  }
  
  saveNotesChanges() {
    if (!this.currentNode) return;
    
    this.refinementNotes[this.currentNode] = document.getElementById('editor-refinement-notes').value;
  }
  
  setGeneratingState(isGenerating) {
    const spinner = document.getElementById('generating-spinner');
    const generateBtn = document.getElementById('btn-generate');
    const regenerateBtn = document.getElementById('btn-regenerate');
    const clearBtn = document.getElementById('btn-clear');
    
    spinner.classList.toggle('active', isGenerating);
    generateBtn.disabled = isGenerating;
    regenerateBtn.disabled = isGenerating;
    clearBtn.disabled = isGenerating;
  }
  
  updateHistoryDisplay() {
    const historySection = document.getElementById('history-section');
    const historyGrid = document.getElementById('history-grid');
    
    const history = this.generationHistory[this.currentNode];
    
    if (!history || history.length === 0) {
      historySection.style.display = 'none';
      return;
    }
    
    historySection.style.display = 'block';
    historyGrid.innerHTML = '';
    
    const currentImage = window.storyData.nodes[this.currentNode]?.pre_rendered_image;
    
    history.forEach((item, index) => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      if (item.image === currentImage) {
        historyItem.classList.add('history-item-current');
      }
      historyItem.innerHTML = `<img src="${item.image}" alt="Generation ${index + 1}">`;
      historyItem.title = `Generated: ${new Date(item.timestamp).toLocaleString()}`;
      
      historyItem.addEventListener('click', () => {
        this.revertToHistoryItem(item);
      });
      
      historyGrid.appendChild(historyItem);
    });
  }
  
  revertToHistoryItem(item) {
    if (!this.currentNode || !confirm('Revert to this version?')) {
      return;
    }
    
    const node = window.storyData.nodes[this.currentNode];
    if (node) {
      node.pre_rendered_image = item.image;
      if (window.imageCache) {
        window.imageCache[this.currentNode] = item.image;
      }
      
      this.updateImageDisplay();
      this.updateHistoryDisplay();
      this.saveToCloud();
    }
  }
  
  async saveToCloud() {
    if (!window.storyData) return;
    
    try {
      await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(window.storyData)
      });
      console.log('Story saved to cloud');
    } catch (error) {
      console.error('Failed to save to cloud:', error);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.overlayEditor = new OverlayEditor();
  });
} else {
  window.overlayEditor = new OverlayEditor();
}
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
          <button class="btn-retry" id="btn-retry">
            Retry Generation
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
      this.generateImage('new');
    });
    
    // Retry button (simple regenerate)
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.generateImage('retry');
    });
    
    // Regenerate with notes button
    document.getElementById('btn-regenerate').addEventListener('click', () => {
      this.generateImage('with-notes');
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
    if (!window.currentNodeId || !window.storyData) {
      console.log('Game not ready yet');
      return;
    }
    
    if (window.currentNodeId !== this.currentNode) {
      this.currentNode = window.currentNodeId;
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
  
  async updateImageDisplay() {
    const container = document.getElementById('current-image-container');
    const node = window.storyData.nodes[this.currentNode];
    
    // Standardized retrieval: Cache → R2 → Base64 → None
    let currentImage = window.imageCache?.[this.currentNode];
    
    // If no cache, try to load from node data with R2 priority
    if (!currentImage) {
      if (node?.image_url) {
        container.innerHTML = `
          <div class="no-image-placeholder">
            <i>⏳</i>
            <p>Loading image from storage...</p>
          </div>
        `;
        
        try {
          console.log(`Loading R2 image for node: ${this.currentNode}`);
          const response = await fetch(node.image_url);
          if (response.ok) {
            const blob = await response.blob();
            const reader = new FileReader();
            currentImage = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            // Cache it for future use
            if (!window.imageCache) window.imageCache = {};
            window.imageCache[this.currentNode] = currentImage;
            console.log(`Cached R2 image for node: ${this.currentNode}`);
          } else {
            console.warn(`Failed to fetch R2 image (${response.status}), trying direct URL`);
            currentImage = node.image_url; // Use URL directly
          }
        } catch (err) {
          console.error('Failed to fetch R2 image:', err);
          currentImage = node.image_url; // Fall back to URL
        }
      } else if (node?.pre_rendered_image) {
        // Fallback to legacy base64 storage
        console.log(`Using legacy base64 image for node: ${this.currentNode}`);
        currentImage = node.pre_rendered_image;
        // Cache it for consistency
        if (!window.imageCache) window.imageCache = {};
        window.imageCache[this.currentNode] = currentImage;
      }
    }
    
    if (currentImage) {
      container.innerHTML = `<img src="${currentImage}" alt="Scene image" onload="console.log('Image loaded successfully')">`;
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
      // Count nodes that have images in any format (prioritizing R2 URLs)
      if (node.image_url || node.pre_rendered_image || window.imageCache?.[nodeId]) {
        nodesWithImages++;
      }
    }
    
    const percentage = totalNodes > 0 ? (nodesWithImages / totalNodes) * 100 : 0;
    
    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('progress-current').textContent = `${nodesWithImages} scenes with images`;
    document.getElementById('progress-total').textContent = `${totalNodes} total scenes`;
    
    console.log(`Progress: ${nodesWithImages}/${totalNodes} (${percentage.toFixed(1)}%) scenes have images`);
  }
  
  findPreviousNode() {
    // Try to find the previous node based on visited history or parent references
    if (window.visitedNodes && window.visitedNodes.length > 1) {
      // Get the node before the current one in visited history
      const currentIndex = window.visitedNodes.indexOf(this.currentNode);
      if (currentIndex > 0) {
        return window.visitedNodes[currentIndex - 1];
      }
    }
    
    // Fallback: look for any node that has this node as a choice
    if (window.storyData && window.storyData.nodes) {
      for (const nodeId in window.storyData.nodes) {
        const node = window.storyData.nodes[nodeId];
        if (node.choices) {
          for (const choice of node.choices) {
            if (choice.next === this.currentNode) {
              return nodeId;
            }
          }
        }
      }
    }
    
    return null;
  }
  
  async generateImage(mode = 'new') {
    // mode can be: 'new', 'retry', or 'with-notes'
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
      
      if (mode === 'with-notes') {
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
      
      console.log(`Generating image (mode: ${mode}) with prompt:`, prompt);
      
      // Build parts array with prompt
      const parts = [{ text: prompt }];
      
      // Handle different modes for image context
      if (mode === 'with-notes') {
        // Use current image as base for refinement
        const currentImage = node.pre_rendered_image || window.imageCache?.[this.currentNode];
        if (currentImage && currentImage.startsWith('data:image')) {
          const base64Data = currentImage.split(',')[1];
          if (base64Data) {
            parts.unshift({ inlineData: { mimeType: 'image/png', data: base64Data } });
            parts.unshift({ text: "Use the previous image as a strong reference for the environment, characters, and art style. Apply the following refinements to create an improved version:" });
            console.log('Including current image as context for refinement');
          }
        }
      } else if (mode === 'retry') {
        // Use previous node's image as context (like normal game flow)
        const previousNodeId = this.findPreviousNode();
        if (previousNodeId) {
          const prevNode = window.storyData.nodes[previousNodeId];
          // First check cache, then pre_rendered_image
          let prevImage = window.imageCache?.[previousNodeId] || prevNode?.pre_rendered_image;
          
          // If no base64 but we have an R2 URL, we need to fetch it
          if (!prevImage && prevNode?.image_url) {
            try {
              console.log('Fetching previous image from R2 for retry context...');
              const response = await fetch(`/api/images/${encodeURIComponent(previousNodeId)}`);
              if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                prevImage = await new Promise((resolve) => {
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(blob);
                });
                // Cache it for future use
                if (!window.imageCache) window.imageCache = {};
                window.imageCache[previousNodeId] = prevImage;
              }
            } catch (err) {
              console.error('Failed to fetch previous image from R2:', err);
            }
          }
          
          if (prevImage && prevImage.startsWith('data:image')) {
            const base64Data = prevImage.split(',')[1];
            if (base64Data) {
              parts.unshift({ inlineData: { mimeType: 'image/png', data: base64Data } });
              parts.unshift({ text: "Use the previous image as a reference for the art style and character consistency:" });
              console.log('Including previous scene image as context for retry');
            }
          } else {
            console.log('No previous image available for retry context');
          }
        } else {
          console.log('No previous node found for retry context');
        }
      }
      // mode === 'new' doesn't include any previous image
      
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
      
      // Sanitize node ID for use in URLs
      const sanitizedNodeId = encodeURIComponent(this.currentNode);
      
      // Upload image to R2 with unified error handling
      const imageUploaded = await this.uploadImageToR2(sanitizedNodeId, imagePart.inlineData.data);
      
      // Update cache with base64 data for immediate display
      if (!window.imageCache) {
        window.imageCache = {};
      }
      window.imageCache[this.currentNode] = imageData; // Store base64 in cache
      
      if (imageUploaded) {
        // Store the R2 URL in the story and remove base64
        const imageUrl = `/api/images/${sanitizedNodeId}`;
        node.image_url = imageUrl;
        delete node.pre_rendered_image; // Remove old base64 to prevent confusion
        console.log(`Successfully stored image as R2 URL for node: ${this.currentNode}`);
      } else {
        // Upload failed - fallback to base64 storage
        console.warn(`R2 upload failed for node: ${this.currentNode}, using base64 fallback`);
        node.pre_rendered_image = imageData; // Store the full data URL
        delete node.image_url; // Remove URL to prevent confusion
      }
      
      // Always save the story data
      try {
        await this.saveToCloud();
        console.log(`Story saved successfully after image generation for node: ${this.currentNode}`);
      } catch (saveError) {
        console.error('Failed to save story after image generation:', saveError);
        alert('Warning: Image generated but story save failed. Changes may be lost.');
      }
      
      // Add to generation history (always use base64 for display)
      if (!this.generationHistory[this.currentNode]) {
        this.generationHistory[this.currentNode] = [];
      }
      this.generationHistory[this.currentNode].unshift({
        image: imageData, // Always store base64 for history display
        prompt: prompt,
        notes: mode === 'with-notes' ? document.getElementById('editor-refinement-notes').value : '',
        timestamp: new Date().toISOString(),
        storage: imageUploaded ? 'R2' : 'base64' // Track storage method for debugging
      });
      
      // Keep only last 5 generations
      if (this.generationHistory[this.currentNode].length > 5) {
        this.generationHistory[this.currentNode] = this.generationHistory[this.currentNode].slice(0, 5);
      }
      
      // Update displays
      this.updateImageDisplay();
      this.updateHistoryDisplay();
      this.updateProgress();
      
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
      // Clear both storage methods
      delete node.pre_rendered_image;
      delete node.image_url;
      console.log(`Cleared image data for node: ${this.currentNode}`);
    }
    
    // Clear from cache
    if (window.imageCache) {
      delete window.imageCache[this.currentNode];
    }
    
    // Clear from generation history
    if (this.generationHistory[this.currentNode]) {
      delete this.generationHistory[this.currentNode];
    }
    
    // Update displays
    this.updateImageDisplay();
    this.updateProgress();
    this.updateHistoryDisplay();
    
    // Save changes
    this.saveToCloud().catch(err => {
      console.error('Failed to save after clearing image:', err);
      alert('Warning: Image cleared but save failed. Changes may not persist.');
    });
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
      // For reverting, we need to re-upload the old image
      // This is a limitation - history items are local only
      if (window.imageCache) {
        window.imageCache[this.currentNode] = item.image;
      }
      
      this.updateImageDisplay();
      this.updateHistoryDisplay();
      // Note: This doesn't re-upload to R2, just updates local display
    }
  }
  
  async saveToCloud() {
    if (!window.storyData) {
      console.error('No story data available to save');
      return false;
    }
    
    try {
      // Validate story data before saving
      await this.validateStoryData();
      
      // Count images by storage type for debugging
      let r2ImageCount = 0;
      let base64ImageCount = 0;
      let totalNodes = 0;
      
      for (const nodeId in window.storyData.nodes) {
        const node = window.storyData.nodes[nodeId];
        totalNodes++;
        if (node.image_url) {
          r2ImageCount++;
        }
        if (node.pre_rendered_image) {
          base64ImageCount++;
        }
      }
      
      console.log(`Saving story: ${totalNodes} nodes, ${r2ImageCount} R2 images, ${base64ImageCount} base64 images`);
      
      // Prepare payload with validation
      const payload = JSON.stringify(window.storyData);
      if (payload.length > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('Story data too large for upload (>50MB)');
      }
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save failed with status ${response.status}: ${errorText}`);
      }
      
      const result = await response.text();
      console.log(`✅ Story saved to cloud successfully: ${result}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to save to cloud:', error);
      
      // More specific error handling
      if (error.message.includes('too large')) {
        alert('Story data is too large to save. Try clearing some unused images.');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        alert('Network error while saving. Please check your connection and try again.');
      } else {
        alert(`Failed to save: ${error.message}`);
      }
      return false;
    }
  }
  
  async validateStoryData() {
    // Validate critical story structure
    if (!window.storyData.nodes || typeof window.storyData.nodes !== 'object') {
      throw new Error('Invalid story structure: missing or invalid nodes');
    }
    
    let inconsistencies = [];
    
    // Check for data consistency issues
    for (const nodeId in window.storyData.nodes) {
      const node = window.storyData.nodes[nodeId];
      
      // Check for duplicate storage (both R2 and base64)
      if (node.image_url && node.pre_rendered_image) {
        console.warn(`Node ${nodeId} has both R2 URL and base64 image - removing base64`);
        delete node.pre_rendered_image;
        inconsistencies.push(`Removed duplicate base64 image from ${nodeId}`);
      }
      
      // Validate image URLs
      if (node.image_url && !node.image_url.startsWith('/api/images/')) {
        console.warn(`Node ${nodeId} has invalid image URL: ${node.image_url}`);
        inconsistencies.push(`Invalid image URL in ${nodeId}`);
      }
      
      // Check for orphaned base64 data (very large base64 without corresponding cache)
      if (node.pre_rendered_image && node.pre_rendered_image.length > 100000) {
        if (!window.imageCache || !window.imageCache[nodeId]) {
          console.warn(`Large base64 image in ${nodeId} not cached - should consider R2 storage`);
        }
      }
    }
    
    if (inconsistencies.length > 0) {
      console.log('Story data validation fixes applied:', inconsistencies);
    }
  }
  
  async uploadImageToR2(nodeId, base64Data) {
    try {
      // Comprehensive validation
      if (!nodeId || typeof nodeId !== 'string') {
        throw new Error('Invalid node ID provided for upload');
      }
      
      if (!base64Data || typeof base64Data !== 'string' || base64Data.length === 0) {
        throw new Error('No valid image data to upload');
      }
      
      // Validate base64 format
      try {
        atob(base64Data);
      } catch (e) {
        throw new Error('Invalid base64 image data');
      }
      
      // Convert base64 to blob with error handling
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });
      
      // Validate blob
      if (blob.size === 0) {
        throw new Error('Generated image blob is empty');
      }
      
      // Check size (max 10MB)
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error(`Image too large (${(blob.size / 1024 / 1024).toFixed(2)}MB, max 10MB)`);
      }
      
      console.log(`Uploading ${(blob.size / 1024).toFixed(2)}KB image for node: ${nodeId}`);
      
      // Upload to R2 with timeout and retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
      
      let lastError;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Upload attempt ${attempt}/2 for node: ${nodeId}`);
          
          const response = await fetch(`/api/images/${nodeId}`, {
            method: 'PUT',
            body: blob,
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'no-cache'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed (${response.status}): ${errorText}`);
          }
          
          const result = await response.json();
          console.log(`✅ Image uploaded successfully to R2: ${result.path} (attempt ${attempt})`);
          return true;
        } catch (err) {
          lastError = err;
          if (attempt === 1 && err.name !== 'AbortError') {
            console.warn(`Upload attempt ${attempt} failed, retrying:`, err.message);
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // All attempts failed
      throw lastError;
      
    } catch (error) {
      let userMessage = 'Failed to upload image to cloud storage.';
      
      if (error.name === 'AbortError') {
        console.error('❌ Image upload timed out');
        userMessage = 'Image upload timed out. Please check your connection and try again.';
      } else if (error.message.includes('too large')) {
        console.error('❌ Image too large:', error.message);
        userMessage = error.message;
      } else if (error.message.includes('Invalid')) {
        console.error('❌ Invalid data for upload:', error.message);
        userMessage = 'Invalid image data. Please regenerate the image.';
      } else {
        console.error('❌ R2 upload failed:', error);
        userMessage = `Upload failed: ${error.message}`;
      }
      
      // Only show alert for non-network errors to avoid spam
      if (!error.message.includes('fetch') && !error.message.includes('network')) {
        console.warn('Will show alert for upload error:', userMessage);
        // Don't block the UI with alert in production, just log
        // alert(userMessage);
      }
      
      return false;
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